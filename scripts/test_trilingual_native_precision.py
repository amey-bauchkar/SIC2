#!/usr/bin/env python3
"""
scripts/test_trilingual_native_precision.py

Comprehensive test suite verifying native precision across Marathi, Hindi, and English
with exact canonical slot matching, loanword transliterations, and unit conversions.
"""

import json
import urllib.request
import sys
import os

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

PORT = os.environ.get("PORT", "3001")
BASE_URL = f"http://localhost:{PORT}/api/voice/process"

TRILINGUAL_TEST_CASES = [
    # =========================================================================
    # Group 1: Native Marathi (मराठी - mr)
    # =========================================================================
    {
        "name": "Marathi Onion: 'नाशिक निफाड मध्ये 40 गोणी कांदा आहे'",
        "body": {"text": "नाशिक निफाड मध्ये 40 गोणी कांदा आहे", "language": "mr"},
        "expected_crop": "Onion",
        "expected_district": "Nashik",
        "expected_qty_qtl": 20.0
    },
    {
        "name": "Marathi Tomato: 'पुणे जुन्नर मध्ये 80 क्रेट टोमॅटो'",
        "body": {"text": "पुणे जुन्नर मध्ये 80 क्रेट टोमॅटो", "language": "mr"},
        "expected_crop": "Tomato",
        "expected_district": "Pune",
        "expected_qty_qtl": 20.0
    },
    {
        "name": "Marathi Soyabean: 'लातूर मध्ये 30 क्विंटल सोयाबीन'",
        "body": {"text": "लातूर मध्ये 30 क्विंटल सोयाबीन", "language": "mr"},
        "expected_crop": "Soyabean",
        "expected_district": "Latur",
        "expected_qty_qtl": 30.0
    },
    {
        "name": "Marathi Potato: 'अहमदनगर संगमनेर मध्ये 50 गोणी बटाटा'",
        "body": {"text": "अहमदनगर संगमनेर मध्ये 50 गोणी बटाटा", "language": "mr"},
        "expected_crop": "Potato",
        "expected_district": "Ahilyanagar",
        "expected_qty_qtl": 25.0
    },
    {
        "name": "Marathi Pomegranate (ळ sound): 'सोलापूर पंढरपूर मध्ये 15 क्विंटल डाळिंब'",
        "body": {"text": "सोलापूर पंढरपूर मध्ये 15 क्विंटल डाळिंब", "language": "mr"},
        "expected_crop": "Pomegranate",
        "expected_district": "Solapur",
        "expected_qty_qtl": 15.0
    },
    {
        "name": "Marathi Jaggery (ळ sound): 'कोल्हापूर मध्ये 30 गोणी गूळ'",
        "body": {"text": "कोल्हापूर मध्ये 30 गोणी गूळ", "language": "mr"},
        "expected_crop": "Gur(Jaggery)",
        "expected_district": "Kolhapur",
        "expected_qty_qtl": 15.0
    },
    {
        "name": "Marathi Spoken Numeral: 'नाशिक मध्ये चाळीस गोणी कांदा'",
        "body": {"text": "नाशिक मध्ये चाळीस गोणी कांदा", "language": "mr"},
        "expected_crop": "Onion",
        "expected_district": "Nashik",
        "expected_qty_qtl": 20.0
    },
    {
        "name": "Marathi Rice: 'पन्नास गोणी तांदूळ'",
        "body": {"text": "पन्नास गोणी तांदूळ", "language": "mr"},
        "expected_crop": "Rice",
        "expected_district": None,
        "expected_qty_qtl": 25.0
    },
    {
        "name": "Marathi Rice ASR Guni: '50 गुणी तांदूळ'",
        "body": {"text": "50 गुणी तांदूळ", "language": "mr"},
        "expected_crop": "Rice",
        "expected_district": None,
        "expected_qty_qtl": 25.0
    },
    {
        "name": "Marathi Rice Latin: 'pannas goni tandul'",
        "body": {"text": "pannas goni tandul", "language": "mr"},
        "expected_crop": "Rice",
        "expected_district": None,
        "expected_qty_qtl": 25.0
    },
    {
        "name": "Marathi Rice Bhat: '50 गोणी भात'",
        "body": {"text": "50 गोणी भात", "language": "mr"},
        "expected_crop": "Rice",
        "expected_district": None,
        "expected_qty_qtl": 25.0
    },

    # =========================================================================
    # Group 2: Native Hindi (हिन्दी - hi)
    # =========================================================================
    {
        "name": "Hindi Onion: 'नासिक में 40 बोरी प्याज है'",
        "body": {"text": "नासिक में 40 बोरी प्याज है", "language": "hi"},
        "expected_crop": "Onion",
        "expected_district": "Nashik",
        "expected_qty_qtl": 20.0
    },
    {
        "name": "Hindi Tomato: 'पुणे में 80 क्रेट टमाटर'",
        "body": {"text": "पुणे में 80 क्रेट टमाटर", "language": "hi"},
        "expected_crop": "Tomato",
        "expected_district": "Pune",
        "expected_qty_qtl": 20.0
    },
    {
        "name": "Hindi Wheat: 'जलगांव में 2 ट्रॉली गेहूं'",
        "body": {"text": "जलगांव में 2 ट्रॉली गेहूं", "language": "hi"},
        "expected_crop": "Wheat",
        "expected_district": "Jalgaon",
        "expected_qty_qtl": 80.0
    },
    {
        "name": "Hindi Maize: 'धुले में 25 कट्टे मक्का'",
        "body": {"text": "धुले में 25 कट्टे मक्का", "language": "hi"},
        "expected_crop": "Maize",
        "expected_district": "Dhule",
        "expected_qty_qtl": 12.5
    },
    {
        "name": "Hindi Orange: 'नागपुर में 1 छोटा हाथी संतरा'",
        "body": {"text": "नागपुर में 1 छोटा हाथी संतरा", "language": "hi"},
        "expected_crop": "Orange",
        "expected_district": "Nagpur",
        "expected_qty_qtl": 12.0
    },
    {
        "name": "Hindi Spoken Numeral: 'नासिक में चालीस बोरी प्याज'",
        "body": {"text": "नासिक में चालीस बोरी प्याज", "language": "hi"},
        "expected_crop": "Onion",
        "expected_district": "Nashik",
        "expected_qty_qtl": 20.0
    },

    # =========================================================================
    # Group 3: Native English (English - en)
    # =========================================================================
    {
        "name": "English Onion: '40 bags onion in Nashik'",
        "body": {"text": "40 bags onion in Nashik", "language": "en"},
        "expected_crop": "Onion",
        "expected_district": "Nashik",
        "expected_qty_qtl": 20.0
    },
    {
        "name": "English Tomato: '80 crates tomato in Pune'",
        "body": {"text": "80 crates tomato in Pune", "language": "en"},
        "expected_crop": "Tomato",
        "expected_district": "Pune",
        "expected_qty_qtl": 20.0
    },
    {
        "name": "English Soyabean: '30 quintals soyabean in Latur'",
        "body": {"text": "30 quintals soyabean in Latur", "language": "en"},
        "expected_crop": "Soyabean",
        "expected_district": "Latur",
        "expected_qty_qtl": 30.0
    },
    {
        "name": "English Spoken Numeral: 'forty bags onion in Nashik'",
        "body": {"text": "forty bags onion in Nashik", "language": "en"},
        "expected_crop": "Onion",
        "expected_district": "Nashik",
        "expected_qty_qtl": 20.0
    },
    {
        "name": "English Potato: '50 bags potato in Ahmednagar'",
        "body": {"text": "50 bags potato in Ahmednagar", "language": "en"},
        "expected_crop": "Potato",
        "expected_district": "Ahilyanagar",
        "expected_qty_qtl": 25.0
    },

    # =========================================================================
    # Group 4: Devanagari Transliterated English Loanwords
    # =========================================================================
    {
        "name": "Transliterated 'फोर्टी बैग अनियन नासिक'",
        "body": {"text": "फोर्टी बैग अनियन नासिक"},
        "expected_crop": "Onion",
        "expected_district": "Nashik",
        "expected_qty_qtl": 20.0
    },
    {
        "name": "Transliterated 'एटी क्रेट टोमेटो पुणे'",
        "body": {"text": "एटी क्रेट टोमेटो पुणे"},
        "expected_crop": "Tomato",
        "expected_district": "Pune",
        "expected_qty_qtl": 20.0
    },
    {
        "name": "Transliterated 'थर्टी क्विंटल सोयाबीन लातूर'",
        "body": {"text": "थर्टी क्विंटल सोयाबीन लातूर"},
        "expected_crop": "Soyabean",
        "expected_district": "Latur",
        "expected_qty_qtl": 30.0
    }
]

def main():
    print(f"Running MandiMitra Trilingual Native Precision Suite ({len(TRILINGUAL_TEST_CASES)} cases)...")
    passed = 0
    failed = 0

    for i, case in enumerate(TRILINGUAL_TEST_CASES, 1):
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
                    summary = ext.get("displaySummaryMr") or ext.get("displaySummaryHi") or ext.get("displaySummaryEn")
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
    print(f"TOTAL: {len(TRILINGUAL_TEST_CASES)} | PASSED: {passed} | FAILED: {failed} | SUCCESS RATE: {passed / len(TRILINGUAL_TEST_CASES) * 100:.1f}%")
    print("=" * 60)

    if failed > 0:
        sys.exit(1)

if __name__ == "__main__":
    main()
