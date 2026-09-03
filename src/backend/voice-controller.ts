/**
 * MandiMitra Backend: Voice-Assisted Smart Autofill Controller
 *
 * POST /api/voice/process
 *   Accepts EITHER
 *     - JSON  { text: "नाशिक निफाड मध्ये 40 गोणी कांदा आहे" }              (transcript path)
 *     - JSON  { audioBase64: "...", mimeType: "audio/webm" }                (audio path)
 *     - raw binary body with Content-Type audio/webm | audio/wav | audio/mpeg
 *
 * PIPELINE
 *   Step A — Speech to text: OpenAI Whisper (`whisper-1`) or Groq Whisper, language mr/hi.
 *   Step B — Agrarian entity extraction and unit normalisation: Google Gemini (`gemini-1.5-flash`).
 *   Step C — Reconciliation: every slot is validated against the canonical 99-crop and
 *            36-district catalogues, and the Bags/Crates -> Quintals arithmetic is ALWAYS
 *            recomputed locally. An LLM never gets the last word on a farmer's tonnage.
 *
 * ZERO-DEMO-FAILURE GUARANTEE
 *   If OPENAI_API_KEY / GROQ_API_KEY / GEMINI_API_KEY are unset, or any upstream call fails or
 *   times out, the request still returns HTTP 200 with a deterministic offline extraction and an
 *   explicit `pipeline` block saying which stage was skipped. The endpoint never 500s on a
 *   missing key, so a live demo cannot break on stage.
 */

import { Request, Response } from 'express';
import {
  extractAgrarianSlots,
  reconcileLlmExtraction,
  VoiceExtraction,
  UNIT_TO_QUINTALS
} from '../core/voice-extraction';

const WHISPER_TIMEOUT_MS = 20000;
const GEMINI_TIMEOUT_MS = 12000;

export const GEMINI_SYSTEM_INSTRUCTION = `You are MandiMitra's AI Agrarian Entity Extractor for Indian farmers.
From spoken Marathi, Hindi, or English, extract:
1. "crop": Canonical English commodity from the Maharashtra 99-crop catalog (e.g., "Onion", "Tomato", "Soyabean", "Wheat", "Bengal Gram", "Pomegranate", "Cotton").
2. "originalQuantity": number
3. "originalUnit": "Bags" | "Crates" | "Quintals" | "Trolley" | "Tempo"
4. "quantityQuintals": number (CRITICAL CONVERSION: 1 Bag/Goni/Bori = 0.5 Quintals [50kg]; 1 Crate/Pethi = 0.25 Quintals [25kg]; 1 Trolley/Tractor = 40 Quintals; 1 Tempo/Chhota Hathi = 12 Quintals; 1 Quintal = 1 Quintal).
5. "district": Canonical Maharashtra district from the 36 districts (e.g., "Nashik", "Pune", "Ahilyanagar", "Latur", "Solapur", "Kolhapur", "Nagpur").
6. "displaySummaryMr": e.g. "कांदा • 40 गोणी (20 क्विंटल) • नाशिक"
7. "displaySummaryHi": e.g. "प्याज • 40 बोरी (20 क्विंटल) • नासिक"
Return pure JSON adhering to the schema.`;

export interface VoiceProcessResponse {
  ok: true;
  extraction: VoiceExtraction;
  pipeline: {
    sttProvider: 'openai-whisper' | 'groq-whisper' | 'client-web-speech' | 'none';
    sttStatus: 'ok' | 'skipped-no-key' | 'failed' | 'not-required';
    sttDetail?: string;
    nluProvider: 'google-gemini' | 'deterministic-offline';
    nluStatus: 'ok' | 'skipped-no-key' | 'failed';
    nluDetail?: string;
    usedFallback: boolean;
  };
  unitConversionTable: Record<string, number>;
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
    promise.then(
      v => { clearTimeout(timer); resolve(v); },
      e => { clearTimeout(timer); reject(e); }
    );
  });
}

function pickAudioBuffer(req: Request): { buffer: Buffer; mimeType: string } | null {
  const contentType = String(req.headers['content-type'] || '');

  if (Buffer.isBuffer(req.body) && req.body.length > 0) {
    return { buffer: req.body, mimeType: contentType || 'audio/webm' };
  }

  const body = req.body as Record<string, unknown> | undefined;
  if (body && typeof body.audioBase64 === 'string' && body.audioBase64.length > 0) {
    const raw = body.audioBase64.replace(/^data:[^;]+;base64,/, '');
    try {
      return {
        buffer: Buffer.from(raw, 'base64'),
        mimeType: typeof body.mimeType === 'string' ? body.mimeType : 'audio/webm'
      };
    } catch {
      return null;
    }
  }
  return null;
}

function extensionFor(mimeType: string): string {
  if (mimeType.includes('wav')) return 'wav';
  if (mimeType.includes('mpeg') || mimeType.includes('mp3')) return 'mp3';
  if (mimeType.includes('mp4') || mimeType.includes('m4a')) return 'm4a';
  if (mimeType.includes('ogg')) return 'ogg';
  return 'webm';
}

/**
 * Step A: OpenAI (or Groq) Whisper speech-to-text.
 * Returns null when no key is configured so the caller can fall back cleanly.
 */
async function transcribeWithWhisper(
  audio: { buffer: Buffer; mimeType: string },
  language: string
): Promise<{ text: string; provider: 'openai-whisper' | 'groq-whisper' }> {
  const openAiKey = process.env.OPENAI_API_KEY;
  const groqKey = process.env.GROQ_API_KEY;

  const endpoint = openAiKey
    ? 'https://api.openai.com/v1/audio/transcriptions'
    : 'https://api.groq.com/openai/v1/audio/transcriptions';
  const apiKey = openAiKey || groqKey;
  const model = openAiKey ? 'whisper-1' : 'whisper-large-v3';
  const provider: 'openai-whisper' | 'groq-whisper' = openAiKey ? 'openai-whisper' : 'groq-whisper';

  if (!apiKey) throw new Error('no-key');

  const form = new FormData();
  const blob = new Blob([new Uint8Array(audio.buffer)], { type: audio.mimeType });
  form.append('file', blob, `speech.${extensionFor(audio.mimeType)}`);
  form.append('model', model);
  form.append('language', language);
  form.append('response_format', 'json');

  const res = await withTimeout(
    fetch(endpoint, { method: 'POST', headers: { Authorization: `Bearer ${apiKey}` }, body: form }),
    WHISPER_TIMEOUT_MS,
    'Whisper transcription'
  );

  if (!res.ok) {
    throw new Error(`Whisper HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
  }
  const json = await res.json() as { text?: string };
  if (!json.text) throw new Error('Whisper returned an empty transcript');
  return { text: json.text, provider };
}

/**
 * Step B: Google Gemini agrarian entity extraction.
 */
async function extractWithGemini(transcript: string): Promise<Record<string, unknown>> {
  const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!key) throw new Error('no-key');

  const model = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`;

  const payload = {
    systemInstruction: { parts: [{ text: GEMINI_SYSTEM_INSTRUCTION }] },
    contents: [{ role: 'user', parts: [{ text: transcript }] }],
    generationConfig: {
      temperature: 0,
      responseMimeType: 'application/json',
      responseSchema: {
        type: 'OBJECT',
        properties: {
          crop: { type: 'STRING' },
          originalQuantity: { type: 'NUMBER' },
          originalUnit: { type: 'STRING', enum: ['Bags', 'Crates', 'Quintals', 'Trolley', 'Tempo'] },
          quantityQuintals: { type: 'NUMBER' },
          district: { type: 'STRING' },
          displaySummaryMr: { type: 'STRING' },
          displaySummaryHi: { type: 'STRING' }
        },
        required: ['crop', 'originalQuantity', 'originalUnit', 'quantityQuintals', 'district', 'displaySummaryMr']
      }
    }
  };

  const res = await withTimeout(
    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }),
    GEMINI_TIMEOUT_MS,
    'Gemini extraction'
  );

  if (!res.ok) {
    throw new Error(`Gemini HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
  }

  const json = await res.json() as any;
  const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Gemini returned no candidate text');
  return JSON.parse(text) as Record<string, unknown>;
}

export async function voiceProcessController(req: Request, res: Response): Promise<void> {
  const pipeline: VoiceProcessResponse['pipeline'] = {
    sttProvider: 'none',
    sttStatus: 'not-required',
    nluProvider: 'deterministic-offline',
    nluStatus: 'skipped-no-key',
    usedFallback: true
  };

  try {
    const body = (Buffer.isBuffer(req.body) ? {} : (req.body || {})) as Record<string, unknown>;
    const language = typeof body.language === 'string' ? body.language : 'mr';

    // ---------- Step A: obtain a transcript ----------
    let transcript = typeof body.text === 'string' ? body.text.trim() : '';

    if (transcript) {
      // The client already has text (typed, a demo chip, or the Web Speech API).
      pipeline.sttProvider = typeof body.sttSource === 'string' && body.sttSource === 'web-speech'
        ? 'client-web-speech'
        : 'none';
      pipeline.sttStatus = 'not-required';
    } else {
      const audio = pickAudioBuffer(req);
      if (!audio) {
        res.status(400).json({
          error: {
            code: 'BAD_REQUEST',
            message: 'Provide either { text } or audio (raw body / audioBase64) to /api/voice/process.'
          }
        });
        return;
      }

      try {
        const stt = await transcribeWithWhisper(audio, language);
        transcript = stt.text.trim();
        pipeline.sttProvider = stt.provider;
        pipeline.sttStatus = 'ok';
      } catch (err) {
        const message = String(err instanceof Error ? err.message : err);
        pipeline.sttStatus = message === 'no-key' ? 'skipped-no-key' : 'failed';
        pipeline.sttDetail = message === 'no-key'
          ? 'OPENAI_API_KEY / GROQ_API_KEY not configured. Use the browser Web Speech API and POST { text } instead.'
          : message;

        res.json({
          ok: true,
          extraction: extractAgrarianSlots(''),
          pipeline,
          unitConversionTable: UNIT_TO_QUINTALS,
          hint: 'Server-side speech-to-text is unavailable. The client should fall back to webkitSpeechRecognition and re-POST { text }.'
        });
        return;
      }
    }

    // ---------- Step B: entity extraction ----------
    let extraction: VoiceExtraction;
    try {
      const llm = await extractWithGemini(transcript);
      extraction = reconcileLlmExtraction(transcript, llm as any);
      pipeline.nluProvider = 'google-gemini';
      pipeline.nluStatus = 'ok';
      pipeline.usedFallback = false;
    } catch (err) {
      const message = String(err instanceof Error ? err.message : err);
      pipeline.nluProvider = 'deterministic-offline';
      pipeline.nluStatus = message === 'no-key' ? 'skipped-no-key' : 'failed';
      pipeline.nluDetail = message === 'no-key'
        ? 'GEMINI_API_KEY not configured. Using MandiMitra\'s deterministic catalogue-driven extractor.'
        : message;
      pipeline.usedFallback = true;
      extraction = extractAgrarianSlots(transcript);
    }

    const response: VoiceProcessResponse = {
      ok: true,
      extraction,
      pipeline,
      unitConversionTable: UNIT_TO_QUINTALS
    };
    res.json(response);
  } catch (err) {
    // Last-resort guard: still return 200 with an offline extraction so a demo never breaks.
    res.json({
      ok: true,
      extraction: extractAgrarianSlots(''),
      pipeline: { ...pipeline, nluStatus: 'failed', nluDetail: String(err) },
      unitConversionTable: UNIT_TO_QUINTALS
    });
  }
}
