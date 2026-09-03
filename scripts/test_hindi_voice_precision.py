#!/usr/bin/env python3
"""
Test Suite: Hindi Agrarian Voice Precision Verification
Validates that Hindi spoken agrarian phrases match the exact same gold-standard
precision as Marathi in MandiMitra's voice extraction engine.
"""

import sys
import json
import urllib.request
import urllib.error

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

API_URL = "http://localhost:3001/api/voice/process"

# Comprehensive test matrix: (Utterance, Expected Crop, Expected Unit, Expected Qty, Expected District)
HINDI_TEST_CASES = [
    # 1. Standard Hindi phrases
    ("नासिक में 40 बोरी प्याज है", "Onion", "Bags", 40.0, "Nashik"),
    ("पुणे में 80 क्रेट टमाटर", "Tomato", "Crates", 80.0, "Pune"),
    ("लातूर में 30 क्विंटल सोयाबीन", "Soyabean", "Quintals", 30.0, "Latur"),
    ("जलगांव में 2 ट्रॉली गेहूं", "Wheat", "Trolley", 2.0, "Jalgaon"),
    ("धुले में 25 कट्टे मक्का", "Maize", "Bags", 25.0, "Dhule"),

    # 2. Hindi agrarian units (बोरी, कट्टा, कट्टी, पेटी, छोटा हाथी, पिकअप, क्विंटल)
    ("सोलापुर में 15 पेटी अनार", "Pomegranate", "Crates", 15.0, "Solapur"),
    ("अहमदनगर में 50 कट्टा चना", "Bengal Gram(Gram)(Whole)", "Bags", 50.0, "Ahilyanagar"),
    ("कोल्हापुर में 1 छोटा हाथी प्याज", "Onion", "Tempo", 1.0, "Kolhapur"),
    ("नागपुर में 100 बोरियां संतरा", "Orange", "Bags", 100.0, "Nagpur"),
    ("सांगली में 40 डब्बे अंगूर", "Grapes", "Crates", 40.0, "Sangli"),

    # 3. Spoken Hindi number words (शब्दों में संख्याएँ)
    ("नासिक में चालीस बोरी प्याज", "Onion", "Bags", 40.0, "Nashik"),
    ("पुणे में अस्सी क्रेट टमाटर", "Tomato", "Crates", 80.0, "Pune"),
    ("लातूर में तीस क्विंटल सोयाबीन", "Soyabean", "Quintals", 30.0, "Latur"),
    ("जलगांव में दो ट्रॉली गेहूं", "Wheat", "Trolley", 2.0, "Jalgaon"),
    ("धुलिया में पच्चीस कट्टे मक्का", "Maize", "Bags", 25.0, "Dhule"),
    ("नासिक में पचास बोरी आलू", "Potato", "Bags", 50.0, "Nashik"),
    ("अहमदनगर में दस कट्टे चना", "Bengal Gram(Gram)(Whole)", "Bags", 10.0, "Ahilyanagar"),

    # 4. Fused words and postpositions (-में, -से, -का, -भर)
    ("नासिकमें 40 बोरी प्याज है", "Onion", "Bags", 40.0, "Nashik"),
    ("पुणेसे 50 क्रेट टमाटर भेजना है", "Tomato", "Crates", 50.0, "Pune"),
    ("लातूरका 20 क्विंटल सोयाबीन", "Soyabean", "Quintals", 20.0, "Latur"),
    ("धुलेमें 15 कट्टेभर मक्का", "Maize", "Bags", 15.0, "Dhule"),

    # 5. Hindi district and taluka alternate variants
    ("पूना में 60 क्रेट टमाटर", "Tomato", "Crates", 60.0, "Pune"),
    ("निफाड़ में 40 बोरी प्याज", "Onion", "Bags", 40.0, "Nashik"),
    ("पिम्पलगांव में 50 बोरी प्याज", "Onion", "Bags", 50.0, "Nashik"),
    ("जुन्नर में 80 क्रेट टमाटर", "Tomato", "Crates", 80.0, "Pune"),
    ("छत्रपति संभाजीनगर में 35 क्विंटल मक्का", "Maize", "Quintals", 35.0, "Chhatrapati Sambhajinagar"),
    ("औरंगाबाद में 30 क्विंटल मक्का", "Maize", "Quintals", 30.0, "Chhatrapati Sambhajinagar"),

    # 6. Colloquial / Natural Hindi speech orders
    ("मेरे पास 40 बोरी प्याज है नासिक में", "Onion", "Bags", 40.0, "Nashik"),
    ("टमाटर 80 क्रेट है पुणे में", "Tomato", "Crates", 80.0, "Pune"),
    ("सोयाबीन 30 क्विंटल लातूर", "Soyabean", "Quintals", 30.0, "Latur"),
]

def run_tests():
    passed = 0
    failed = 0
    print("=" * 75)
    print("🌾 MANDIMITRA HINDI VOICE PRECISION VERIFICATION TEST SUITE")
    print(f"Targeting: {API_URL}")
    print("=" * 75)

    for idx, (utterance, exp_crop, exp_unit, exp_qty, exp_dist) in enumerate(HINDI_TEST_CASES, 1):
        payload = json.dumps({"text": utterance, "source": "web-speech"}).encode("utf-8")
        req = urllib.request.Request(
            API_URL,
            data=payload,
            headers={"Content-Type": "application/json"}
        )

        try:
            with urllib.request.urlopen(req, timeout=5) as response:
                data = json.loads(response.read().decode("utf-8"))
                ext = data.get("extraction", {})

                act_crop = ext.get("crop")
                act_unit = ext.get("originalUnit")
                act_qty = ext.get("originalQuantity")
                act_dist = ext.get("district")
                summary_hi = ext.get("displaySummaryHi", "")

                crop_ok = act_crop == exp_crop
                unit_ok = act_unit == exp_unit
                qty_ok = act_qty == exp_qty
                dist_ok = act_dist == exp_dist

                all_ok = crop_ok and unit_ok and qty_ok and dist_ok

                if all_ok:
                    passed += 1
                    print(f"[{idx:02d}/28] ✅ PASS: '{utterance}'")
                    print(f"         → {act_crop} | {act_qty} {act_unit} | {act_dist} | '{summary_hi}'")
                else:
                    failed += 1
                    print(f"[{idx:02d}/28] ❌ FAIL: '{utterance}'")
                    print(f"         Expected: {exp_crop}, {exp_qty} {exp_unit}, {exp_dist}")
                    print(f"         Actual:   {act_crop}, {act_qty} {act_unit}, {act_dist}")
        except urllib.error.URLError as e:
            failed += 1
            print(f"[{idx:02d}/28] ❌ ERROR: Could not connect to API: {e}")

    print("=" * 75)
    print(f"RESULTS: {passed} PASSED, {failed} FAILED out of {len(HINDI_TEST_CASES)} tests ({passed / len(HINDI_TEST_CASES) * 100:.1f}%)")
    print("=" * 75)
    return failed == 0

if __name__ == "__main__":
    success = run_tests()
    sys.exit(0 if success else 1)
