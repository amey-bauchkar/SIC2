import requests
import sys

sys.stdout.reconfigure(encoding='utf-8')

URL = "http://localhost:3001/api/voice/process"

TEST_CASES = [
    # ---- 10 MARATHI UTTERANCES ----
    {
        "text": "नाशिक निफाड मध्ये 40 गोणी कांदा आहे",
        "expected_crop": "Onion",
        "expected_qty": 40,
        "expected_unit": "Bags",
        "expected_quintals": 20.0,
        "expected_district": "Nashik",
        "expected_lang": "mr"
    },
    {
        "text": "पुणे जुन्नर मध्ये 80 क्रेट टोमॅटो",
        "expected_crop": "Tomato",
        "expected_qty": 80,
        "expected_unit": "Crates",
        "expected_quintals": 20.0,
        "expected_district": "Pune",
        "expected_lang": "mr"
    },
    {
        "text": "लातूर मध्ये 30 क्विंटल सोयाबीन",
        "expected_crop": "Soyabean",
        "expected_qty": 30,
        "expected_unit": "Quintals",
        "expected_quintals": 30.0,
        "expected_district": "Latur",
        "expected_lang": "mr"
    },
    {
        "text": "अहमदनगर संगमनेर मध्ये 50 गोणी बटाटा",
        "expected_crop": "Potato",
        "expected_qty": 50,
        "expected_unit": "Bags",
        "expected_quintals": 25.0,
        "expected_district": "Ahilyanagar",
        "expected_lang": "mr"
    },
    {
        "text": "सोलापूर पंढरपूर मध्ये 15 क्विंटल डाळिंब",
        "expected_crop": "Pomegranate",
        "expected_qty": 15,
        "expected_unit": "Quintals",
        "expected_quintals": 15.0,
        "expected_district": "Solapur",
        "expected_lang": "mr"
    },
    {
        "text": "नागपूर मध्ये 100 गोणी संत्री",
        "expected_crop": "Orange",
        "expected_qty": 100,
        "expected_unit": "Bags",
        "expected_quintals": 50.0,
        "expected_district": "Nagpur",
        "expected_lang": "mr"
    },
    {
        "text": "जळगाव रावेर मध्ये 60 क्रेट केळी",
        "expected_crop": "Banana",
        "expected_qty": 60,
        "expected_unit": "Crates",
        "expected_quintals": 15.0,
        "expected_district": "Jalgaon",
        "expected_lang": "mr"
    },
    {
        "text": "धुळे मध्ये 25 क्विंटल गहू",
        "expected_crop": "Wheat",
        "expected_qty": 25,
        "expected_unit": "Quintals",
        "expected_quintals": 25.0,
        "expected_district": "Dhule",
        "expected_lang": "mr"
    },
    {
        "text": "कोल्हापूर मध्ये 30 गोणी गूळ",
        "expected_crop": "Gur(Jaggery)",
        "expected_qty": 30,
        "expected_unit": "Bags",
        "expected_quintals": 15.0,
        "expected_district": "Kolhapur",
        "expected_lang": "mr"
    },
    {
        "text": "सातारा कराड मध्ये 50 गोणी आले",
        "expected_crop": "Ginger(Green)",
        "expected_qty": 50,
        "expected_unit": "Bags",
        "expected_quintals": 25.0,
        "expected_district": "Satara",
        "expected_lang": "mr"
    },

    # ---- 10 HINDI UTTERANCES ----
    {
        "text": "नासिक में 40 बोरी प्याज है",
        "expected_crop": "Onion",
        "expected_qty": 40,
        "expected_unit": "Bags",
        "expected_quintals": 20.0,
        "expected_district": "Nashik",
        "expected_lang": "hi"
    },
    {
        "text": "पुणे में 80 क्रेट टमाटर",
        "expected_crop": "Tomato",
        "expected_qty": 80,
        "expected_unit": "Crates",
        "expected_quintals": 20.0,
        "expected_district": "Pune",
        "expected_lang": "hi"
    },
    {
        "text": "लातूर में 30 क्विंटल सोयाबीन",
        "expected_crop": "Soyabean",
        "expected_qty": 30,
        "expected_unit": "Quintals",
        "expected_quintals": 30.0,
        "expected_district": "Latur",
        "expected_lang": "hi"
    },
    {
        "text": "जलगांव में 2 ट्रॉली गेहूं",
        "expected_crop": "Wheat",
        "expected_qty": 2,
        "expected_unit": "Trolley",
        "expected_quintals": 80.0,
        "expected_district": "Jalgaon",
        "expected_lang": "hi"
    },
    {
        "text": "धुले में 25 कट्टे मक्का",
        "expected_crop": "Maize",
        "expected_qty": 25,
        "expected_unit": "Bags",
        "expected_quintals": 12.5,
        "expected_district": "Dhule",
        "expected_lang": "hi"
    },
    {
        "text": "अहमदनगर में 60 कट्टा प्याज",
        "expected_crop": "Onion",
        "expected_qty": 60,
        "expected_unit": "Bags",
        "expected_quintals": 30.0,
        "expected_district": "Ahilyanagar",
        "expected_lang": "hi"
    },
    {
        "text": "नागपुर में 1 छोटा हाथी संतरा",
        "expected_crop": "Orange",
        "expected_qty": 1,
        "expected_unit": "Tempo",
        "expected_quintals": 12.0,
        "expected_district": "Nagpur",
        "expected_lang": "hi"
    },
    {
        "text": "सोलापुर में 35 बोरी अनार",
        "expected_crop": "Pomegranate",
        "expected_qty": 35,
        "expected_unit": "Bags",
        "expected_quintals": 17.5,
        "expected_district": "Solapur",
        "expected_lang": "hi"
    },
    {
        "text": "अमरावती में 40 क्विंटल हल्दी",
        "expected_crop": "Turmeric",
        "expected_qty": 40,
        "expected_unit": "Quintals",
        "expected_quintals": 40.0,
        "expected_district": "Amravati",
        "expected_lang": "hi"
    },
    {
        "text": "औरंगाबाद में 50 कट्टे चना",
        "expected_crop": "Bengal Gram(Gram)(Whole)",
        "expected_qty": 50,
        "expected_unit": "Bags",
        "expected_quintals": 25.0,
        "expected_district": "Chhatrapati Sambhajinagar",
        "expected_lang": "hi"
    },

    # ---- 10 ENGLISH / MIXED UTTERANCES ----
    {
        "text": "40 bags onion in Nashik",
        "expected_crop": "Onion",
        "expected_qty": 40,
        "expected_unit": "Bags",
        "expected_quintals": 20.0,
        "expected_district": "Nashik",
        "expected_lang": "en"
    },
    {
        "text": "80 crates tomato in Pune",
        "expected_crop": "Tomato",
        "expected_qty": 80,
        "expected_unit": "Crates",
        "expected_quintals": 20.0,
        "expected_district": "Pune",
        "expected_lang": "en"
    },
    {
        "text": "30 quintals soyabean in Latur",
        "expected_crop": "Soyabean",
        "expected_qty": 30,
        "expected_unit": "Quintals",
        "expected_quintals": 30.0,
        "expected_district": "Latur",
        "expected_lang": "en"
    },
    {
        "text": "2 trolley wheat in Jalgaon",
        "expected_crop": "Wheat",
        "expected_qty": 2,
        "expected_unit": "Trolley",
        "expected_quintals": 80.0,
        "expected_district": "Jalgaon",
        "expected_lang": "en"
    },
    {
        "text": "50 bags potato in Ahmednagar",
        "expected_crop": "Potato",
        "expected_qty": 50,
        "expected_unit": "Bags",
        "expected_quintals": 25.0,
        "expected_district": "Ahilyanagar",
        "expected_lang": "en"
    },
    {
        "text": "100 bags orange in Nagpur",
        "expected_crop": "Orange",
        "expected_qty": 100,
        "expected_unit": "Bags",
        "expected_quintals": 50.0,
        "expected_district": "Nagpur",
        "expected_lang": "en"
    },
    {
        "text": "25 quintals turmeric in Amravati",
        "expected_crop": "Turmeric",
        "expected_qty": 25,
        "expected_unit": "Quintals",
        "expected_quintals": 25.0,
        "expected_district": "Amravati",
        "expected_lang": "en"
    },
    {
        "text": "35 bags pomegranate in Solapur",
        "expected_crop": "Pomegranate",
        "expected_qty": 35,
        "expected_unit": "Bags",
        "expected_quintals": 17.5,
        "expected_district": "Solapur",
        "expected_lang": "en"
    },
    {
        "text": "60 crates banana in Jalgaon",
        "expected_crop": "Banana",
        "expected_qty": 60,
        "expected_unit": "Crates",
        "expected_quintals": 15.0,
        "expected_district": "Jalgaon",
        "expected_lang": "en"
    },
    {
        "text": "20 quintals green chilli in Kolhapur",
        "expected_crop": "Green Chilli",
        "expected_qty": 20,
        "expected_unit": "Quintals",
        "expected_quintals": 20.0,
        "expected_district": "Kolhapur",
        "expected_lang": "en"
    }
]

def main():
    print(f"Running MandiMitra Multilingual Auto-Detect Voice Precision Suite ({len(TEST_CASES)} cases)...")
    passed = 0
    failed = 0

    for idx, tc in enumerate(TEST_CASES, 1):
        payload = {"text": tc["text"], "sttSource": "test-suite"}
        try:
            resp = requests.post(URL, json=payload, timeout=5)
            if resp.status_code != 200:
                print(f"❌ Case {idx:02d}: HTTP {resp.status_code} on '{tc['text']}'")
                failed += 1
                continue
            
            data = resp.json()
            ext = data.get("extraction", {})

            crop = ext.get("crop")
            qty = ext.get("originalQuantity")
            unit = ext.get("originalUnit")
            q_q = ext.get("quantityQuintals")
            dist = ext.get("district")
            lang = ext.get("detectedLanguage")

            mismatches = []
            if crop != tc["expected_crop"]:
                mismatches.append(f"crop: {crop} != {tc['expected_crop']}")
            if qty != tc["expected_qty"]:
                mismatches.append(f"qty: {qty} != {tc['expected_qty']}")
            if unit != tc["expected_unit"]:
                mismatches.append(f"unit: {unit} != {tc['expected_unit']}")
            if q_q != tc["expected_quintals"]:
                mismatches.append(f"quintals: {q_q} != {tc['expected_quintals']}")
            if dist != tc["expected_district"]:
                mismatches.append(f"district: {dist} != {tc['expected_district']}")
            if lang != tc["expected_lang"]:
                mismatches.append(f"lang: {lang} != {tc['expected_lang']}")

            if mismatches:
                print(f"❌ Case {idx:02d} FAILED: '{tc['text']}' -> {', '.join(mismatches)}")
                failed += 1
            else:
                lang_display = ext.get("detectedLanguageDisplay", "")
                summary = ext.get("displaySummaryHi" if lang == "hi" else ("displaySummaryEn" if lang == "en" else "displaySummaryMr"))
                print(f"✅ Case {idx:02d} PASSED: [{lang_display}] '{tc['text']}' -> {summary}")
                passed += 1

        except Exception as e:
            print(f"❌ Case {idx:02d} EXCEPTION: {e}")
            failed += 1

    print("\n" + "="*60)
    print(f"TOTAL: {len(TEST_CASES)} | PASSED: {passed} | FAILED: {failed} | SUCCESS RATE: {passed/len(TEST_CASES)*100:.1f}%")
    print("="*60)
    if failed > 0:
        sys.exit(1)

if __name__ == "__main__":
    main()
