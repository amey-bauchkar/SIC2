#!/usr/bin/env python3
"""
scripts/test_voice_acoustic_precision.py

Comprehensive test suite verifying acoustic resilience, phonetic confusion handling,
spoken number word conversion, and multi-hypothesis scoring in MandiMitra's Voice Engine.
"""

import json
import urllib.request
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

BASE_URL = "http://localhost:3000/api/voice/process"

# Test cases testing real-world speech engine flaws:
# 1. Phonetic misspellings from speech-to-text (कंधा, गोली, निफाद, बताता)
# 2. Number words in Devanagari & English (चालीस, अस्सी, forty)
# 3. Fused digits & words (40बोरी, 80क्रेट)
# 4. Multi-hypothesis candidate ranking (top candidate has missing slot, candidate 2 has complete slots)
ACOUSTIC_TEST_CASES = [
    # --- Group A: Spoken Number Words ---
    {
        "name": "Marathi spoken number 'चाळीस गोणी'",
        "body": {"text": "नाशिक मध्ये चाळीस गोणी कांदा आहे"},
        "expected_crop": "Onion",
        "expected_district": "Nashik",
        "expected_qty_qtl": 20.0
    },
    {
        "name": "Hindi spoken number 'चालीस बोरी'",
        "body": {"text": "नासिक में चालीस बोरी प्याज है"},
        "expected_crop": "Onion",
        "expected_district": "Nashik",
        "expected_qty_qtl": 20.0
    },
    {
        "name": "Hindi spoken number 'अस्सी क्रेट'",
        "body": {"text": "पुणे में अस्सी क्रेट टमाटर"},
        "expected_crop": "Tomato",
        "expected_district": "Pune",
        "expected_qty_qtl": 20.0
    },
    {
        "name": "English spoken number 'forty bags'",
        "body": {"text": "forty bags onion in Nashik"},
        "expected_crop": "Onion",
        "expected_district": "Nashik",
        "expected_qty_qtl": 20.0
    },
    {
        "name": "English spoken number 'thirty quintals'",
        "body": {"text": "thirty quintals soyabean in Latur"},
        "expected_crop": "Soyabean",
        "expected_district": "Latur",
        "expected_qty_qtl": 30.0
    },

    # --- Group B: Fused Digits & Packaging Tokens ---
    {
        "name": "Fused Marathi '40गोणी'",
        "body": {"text": "नाशिक मध्ये 40गोणी कांदा"},
        "expected_crop": "Onion",
        "expected_district": "Nashik",
        "expected_qty_qtl": 20.0
    },
    {
        "name": "Fused Hindi '80क्रेट'",
        "body": {"text": "पुणे में 80क्रेट टमाटर"},
        "expected_crop": "Tomato",
        "expected_district": "Pune",
        "expected_qty_qtl": 20.0
    },

    # --- Group C: Phonetic Confusion & ASR Mishearings ---
    {
        "name": "ASR mishearing 'कंधा' for 'कांदा'",
        "body": {"text": "नाशिक मध्ये 40 गोणी कंधा आहे"},
        "expected_crop": "Onion",
        "expected_district": "Nashik",
        "expected_qty_qtl": 20.0
    },
    {
        "name": "ASR mishearing 'कांधा' for 'कांदा'",
        "body": {"text": "नासिक में 40 बोरी कांधा"},
        "expected_crop": "Onion",
        "expected_district": "Nashik",
        "expected_qty_qtl": 20.0
    },
    {
        "name": "ASR mishearing 'गोली' for 'गोणी'",
        "body": {"text": "नाशिक मध्ये 40 गोली कांदा"},
        "expected_crop": "Onion",
        "expected_district": "Nashik",
        "expected_qty_qtl": 20.0
    },
    {
        "name": "ASR mishearing 'गोनी' for 'गोणी'",
        "body": {"text": "नाशिक मध्ये 50 गोनी कांदा"},
        "expected_crop": "Onion",
        "expected_district": "Nashik",
        "expected_qty_qtl": 25.0
    },
    {
        "name": "ASR mishearing taluka 'निफाद' for 'निफाड'",
        "body": {"text": "निफाद मध्ये 40 गोणी कांदा"},
        "expected_crop": "Onion",
        "expected_district": "Nashik",
        "expected_qty_qtl": 20.0
    },
    {
        "name": "ASR mishearing 'बताता' for 'बटाटा'",
        "body": {"text": "अहमदनगर मध्ये 50 गोणी बताता"},
        "expected_crop": "Potato",
        "expected_district": "Ahilyanagar",
        "expected_qty_qtl": 25.0
    },
    {
        "name": "ASR mishearing 'दालिंब' for 'डाळिंब'",
        "body": {"text": "सोलापूर मध्ये 15 क्विंटल दालिंब"},
        "expected_crop": "Pomegranate",
        "expected_district": "Solapur",
        "expected_qty_qtl": 15.0
    },
    {
        "name": "ASR mishearing 'हरबरा' for 'हरभरा'",
        "body": {"text": "लातूर मध्ये 40 क्विंटल हरबरा"},
        "expected_crop": "Bengal Gram(Gram)(Whole)",
        "expected_district": "Latur",
        "expected_qty_qtl": 40.0
    },

    # --- Group D: Multi-Hypothesis Alternative Scoring ---
    {
        "name": "Multi-hypothesis: alt 0 missing slots, alt 1 complete",
        "body": {
            "candidates": [
                "नाशिक मध्ये कांदा आहे", # missing quantity
                "नाशिक निफाड मध्ये 40 गोणी कांदा आहे" # complete!
            ]
        },
        "expected_crop": "Onion",
        "expected_district": "Nashik",
        "expected_qty_qtl": 20.0
    },
    {
        "name": "Multi-hypothesis: alt 0 noisy garble, alt 2 clean Hindi",
        "body": {
            "candidates": [
                "पुणे में असी ग्रेड टमाटर",
                "पुणे टमाटर",
                "पुणे में 80 क्रेट टमाटर" # clean!
            ]
        },
        "expected_crop": "Tomato",
        "expected_district": "Pune",
        "expected_qty_qtl": 20.0
    },
    {
        "name": "Multi-hypothesis: alt 0 English partial, alt 1 full",
        "body": {
            "candidates": [
                "Nashik onion",
                "40 bags onion in Nashik"
            ]
        },
        "expected_crop": "Onion",
        "expected_district": "Nashik",
        "expected_qty_qtl": 20.0
    }
]

def main():
    print(f"Running MandiMitra Acoustic Precision & Multi-Hypothesis Suite ({len(ACOUSTIC_TEST_CASES)} cases)...")
    passed = 0
    failed = 0

    for i, case in enumerate(ACOUSTIC_TEST_CASES, 1):
        req = urllib.request.Request(
            BASE_URL,
            data=json.dumps(case["body"]).encode("utf-8"),
            headers={"Content-Type": "application/json"}
        )
        try:
            with urllib.request.urlopen(req, timeout=10) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                ext = data.get("extraction", {})

                crop_match = ext.get("crop") == case["expected_crop"]
                dist_match = ext.get("district") == case["expected_district"]
                qty_match = abs((ext.get("quantityQuintals") or 0.0) - case["expected_qty_qtl"]) < 0.01

                if crop_match and dist_match and qty_match:
                    passed += 1
                    summary = ext.get("displaySummaryHi") or ext.get("displaySummaryMr") or ext.get("displaySummaryEn")
                    print(f"✅ Case {i:02d} PASSED: {case['name']} -> {summary}")
                else:
                    failed += 1
                    print(f"❌ Case {i:02d} FAILED: {case['name']}")
                    print(f"   Expected: crop={case['expected_crop']}, dist={case['expected_district']}, qty={case['expected_qty_qtl']}")
                    print(f"   Got:      crop={ext.get('crop')}, dist={ext.get('district')}, qty={ext.get('quantityQuintals')}")
                    print(f"   Response: {json.dumps(ext, ensure_ascii=False)}")
        except Exception as e:
            failed += 1
            print(f"❌ Case {i:02d} ERROR: {case['name']} -> {e}")

    print("\n" + "=" * 60)
    print(f"TOTAL: {len(ACOUSTIC_TEST_CASES)} | PASSED: {passed} | FAILED: {failed} | SUCCESS RATE: {passed / len(ACOUSTIC_TEST_CASES) * 100:.1f}%")
    print("=" * 60)

    if failed > 0:
        sys.exit(1)

if __name__ == "__main__":
    main()
