# 3-Minute Demo Script

Scripted, second-by-second demo flow for the judging panel.

---

## Demo Setup (Before Going On Stage)

- [ ] Cached real data snapshot loaded and verified
- [ ] One live API call tested and working (with cached fallback ready)
- [ ] Phone-width browser window open
- [ ] Network disconnect rehearsed twice
- [ ] Backtest numbers verified and screenshot taken as fallback

---

## The Demo (3:00)

### Beat 1: The Hook (0:00 – 0:20)

**[SPEAKER]:** Amey or Purva

> "A farmer in Nashik has 20 quintals of onion. He's standing at the edge of his field right now. Does he sell today, or wait?"

**[SCREEN]:** Clean input — Commodity: Onion, District: Nashik, Quantity: 20 quintals

**Purpose:** Judge understands the problem instantly. No jargon, no statistics, no slides. One farmer, one decision.

---

### Beat 2: The Live Data Pull (0:20 – 0:50) — THE MOMENT

**[ACTION]:** Hit the button. Make a **live call to data.gov.in on stage.**

**[SCREEN]:** Today's real modal prices appear at four nearby mandis with their real reporting dates:

| Mandi | Modal Price | Last Reported | Distance |
|-------|------------|---------------|----------|
| Lasalgaon | ₹2,340/q | 1 Sep 2026 | 35 km |
| Pimpalgaon | ₹2,280/q | 1 Sep 2026 | 18 km |
| Nashik | ₹2,190/q | 31 Aug 2026 | 8 km |
| Manmad | ₹2,150/q | 25 Aug 2026 | 62 km |

> "These are real prices. From the Government of India's open data portal. Called live, right now, in front of you."

**Purpose:** This is the moment that separates us from every mock-data team. Nobody else can do this.

**[FALLBACK]:** If the API call fails, show the cached snapshot and say: "We pulled this from the same API yesterday. Let me show you what we do with it."

---

### Beat 3: The Decision Card (0:50 – 1:40)

**[SCREEN]:** The decision card appears:

```
┌─────────────────────────────────────────┐
│  🟡 WAIT 2 DAYS                         │
│                                         │
│  Sell at: LASALGAON                     │
│  Expected: +₹180/quintal               │
│  After transport: +₹135/quintal net     │
│  Confidence: MEDIUM                     │
│                                         │
│  [WHY?]                                 │
└─────────────────────────────────────────┘
```

**[ACTION]:** Open the "WHY" panel:

> "Here's why. Prices at Lasalgaon rose 4.2% over the last 7 days. No rain forecast — supply stays steady. Transport to Lasalgaon costs ₹45 per quintal. And Lasalgaon reported 12 of the last 14 days — that's a reliable data source."

**[SCREEN]:** Why panel shows:
- 📈 Trend: +4.2% over 7 days
- 🌤️ Weather: No rain forecast
- 🚛 Transport: 35 km, ₹45/quintal
- 📊 Data quality: 12/14 days reported (85%)

**Purpose:** Not a magic number — a reasoned decision with transparent inputs.

---

### Beat 4: The Abstention — THE CREDIBILITY BEAT (1:40 – 2:15)

**[ACTION]:** Switch to Manmad mandi.

**[SCREEN]:** 

```
┌─────────────────────────────────────────┐
│  ⚫ CANNOT ADVISE                        │
│                                         │
│  Manmad has not reported prices         │
│  in 9 days.                             │
│                                         │
│  Nearest reliable mandi:               │
│  LASALGAON (42 km, quality: 85%)       │
│                                         │
│  [SEE LASALGAON →]                      │
└─────────────────────────────────────────┘
```

> "When the government's own data is too thin — this mandi hasn't reported in nine days — the system refuses to guess. It tells the farmer why, and redirects to the nearest reliable mandi. A model that knows when to stay silent is more trustworthy than one that's always confident."

**Purpose:** This is the moment that makes judges sit up. No other team will do this. It reads as engineering maturity.

---

### Beat 5: The Backtest — THE PROOF (2:15 – 2:50)

**[SCREEN]:** Backtest panel:

| Metric | Our Advice | Harvest-Day Sale | Persistence |
|--------|-----------|-------------------|-------------|
| ₹/quintal realised | ₹X,XXX | ₹X,XXX | ₹X,XXX |
| Direction hit-rate | XX% | N/A | ~60% |
| Days evaluated | N | — | — |

> "On [N] real held-out market-days — days the model never saw during training — following our advice would have realised ₹[X] more per quintal than selling on harvest day, and beat naive persistence [Y]% of the time. Real data, real number, checkable. The code is in the repo."

**Purpose:** A verifiable impact claim. Not a slogan. The one thing no other team can fake.

---

### Beat 6: The User (2:50 – 3:00)

**[ACTION]:** Switch to phone-width Marathi view. Trigger voice output.

**[SCREEN]:** Decision card in Marathi, large text, three-colour scheme (green/yellow/red)

**[AUDIO]:** Voice output in Marathi: "दोन दिवस थांबा. लासलगाव मंडीत विका."

> "Three colours. One number. A voice in their language. Works on a slow connection."

---

## Demo Scoring Expectations

| Axis | Score | Notes |
|------|-------|-------|
| First 30 seconds | 9/10 | Instant comprehension — one farmer, one decision |
| Visual impact | 8/10 | Clean, not flashy — the substance IS the wow |
| Technical depth | 9/10 | Live API, direction model, abstention, backtest |
| **Real-data proof** | **10/10** | Live government data, cached fallback, verifiable backtest |
| Wow factor | 8/10 | The abstention moment + the backtest number |
| Clarity | 9/10 | Every element explained in one sentence |
| Reliability | 8/10 | Cached snapshot means network failure doesn't kill the demo |

---

## Failure Modes & Recovery

| Failure | Recovery |
|---------|----------|
| API call fails on stage | Show cached snapshot. Say: "We pulled this from the same API. Let me show you what we do with it." |
| Backtest shows small edge | Report it honestly. "A modest edge, correctly measured, over [N] real days beats a suspicious claim." |
| Judge asks to try their own commodity | If we have it: great. If not: "We pre-loaded 3 commodities with dense data. Adding more is configuration, not code." |
| Voice output glitches | Skip it. It's beat 6, not beat 3. |
| UI rendering issue | Have the backtest screenshot as a fallback image. |

---

## What NOT to Do in the Demo

- ❌ Don't start with slides or statistics
- ❌ Don't explain the tech stack
- ❌ Don't say "we used React and FastAPI"
- ❌ Don't show a login screen
- ❌ Don't show an admin dashboard
- ❌ Don't mention the word "LSTM"
- ❌ Don't claim "95% accuracy"
- ✅ Start with the farmer, end with the number
