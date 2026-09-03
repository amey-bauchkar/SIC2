"""
MandiMitra — Multi-Year Weather Anomaly Engine (Open-Meteo ERA5)
Fetches historical monsoon seasons (June to August) for 2024, 2025, and 2026:
- Nashik (North Maharashtra Onion Capital)
- Pune (Western Maharashtra Tomato Capital)
Computes:
- Historical normal rainfall (mm)
- 2026 Monsoon departure / anomaly (%)
- Severe rainfall days count (>30mm in 24 hours) which disrupt rural mandi transportation
"""

import os
import sys
import json
import time
import urllib.request
from datetime import datetime

# Windows console encoding safeguard
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WEATHER_DIR = os.path.join(BASE_DIR, "data", "weather")

CENTERS = {
    "Nashik": {"lat": 19.9975, "lon": 73.7898},
    "Pune": {"lat": 18.5204, "lon": 73.8567}
}

YEARS = [2024, 2025, 2026]


def make_request(url):
    req = urllib.request.Request(url, headers={
        "User-Agent": "MandiMitra-ResearchEngine/1.0 (Academic Hackathon Project; SVKM SBMP)"
    })
    with urllib.request.urlopen(req, timeout=20) as resp:
        return json.loads(resp.read().decode("utf-8"))


def fetch_and_compute_anomalies():
    print("=" * 75)
    print("MANDIMITRA — MULTI-YEAR WEATHER ANOMALY ENGINE (2024–2026)")
    print(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 75)

    os.makedirs(WEATHER_DIR, exist_ok=True)
    results = {}

    for district, coords in CENTERS.items():
        lat = coords["lat"]
        lon = coords["lon"]
        district_data = {}

        print(f"\n[Processing {district}] Fetching 2024, 2025, 2026 Monsoon Seasons (June 1 - August 31)...")

        for yr in YEARS:
            start_d = f"{yr}-06-01"
            end_d = f"{yr}-08-31"

            url = (
                f"https://archive-api.open-meteo.com/v1/archive?"
                f"latitude={lat}&longitude={lon}&start_date={start_d}&end_date={end_d}&"
                f"daily=temperature_2m_mean,precipitation_sum,relative_humidity_2m_mean&"
                f"timezone=Asia%2FKolkata"
            )

            try:
                data = make_request(url)
                precip = data.get("daily", {}).get("precipitation_sum", [])
                temps = data.get("daily", {}).get("temperature_2m_mean", [])

                total_rain = round(sum(precip), 1)
                mean_temp = round(sum(temps) / len(temps), 1) if temps else None
                heavy_rain_days = sum(1 for p in precip if p is not None and p >= 30.0)

                district_data[str(yr)] = {
                    "monsoon_total_rain_mm": total_rain,
                    "mean_monsoon_temp_c": mean_temp,
                    "heavy_rain_days_gt_30mm": heavy_rain_days
                }
                print(f"  {district} {yr}: Total Monsoon Rain = {total_rain} mm | Heavy Rain Days = {heavy_rain_days}")
                time.sleep(0.5)
            except Exception as e:
                print(f"  [FAIL] Failed for {district} {yr}: {e}")

        # Compute Normal Baseline (Average of 2024 & 2025)
        r24 = district_data.get("2024", {}).get("monsoon_total_rain_mm", 0)
        r25 = district_data.get("2025", {}).get("monsoon_total_rain_mm", 0)
        r26 = district_data.get("2026", {}).get("monsoon_total_rain_mm", 0)

        normal_rain = round((r24 + r25) / 2.0, 1) if (r24 and r25) else r26
        departure_pct = round(((r26 - normal_rain) / normal_rain) * 100.0, 1) if normal_rain else 0.0

        anomaly_status = "NORMAL"
        if departure_pct >= 20.0:
            anomaly_status = "EXCESS_MONSOON"
        elif departure_pct <= -20.0:
            anomaly_status = "DEFICIENT_MONSOON"

        results[district] = {
            "historical_normal_rain_mm": normal_rain,
            "monsoon_2026_rain_mm": r26,
            "departure_from_normal_pct": departure_pct,
            "anomaly_classification": anomaly_status,
            "market_impact_signal": (
                "Supply disruption risk high (excess moisture leads to storage rotting & transport delays)"
                if anomaly_status == "EXCESS_MONSOON" else
                "Dry spell accelerates maturity; supply normal to low"
                if anomaly_status == "DEFICIENT_MONSOON" else
                "Standard seasonal supply flows expected"
            ),
            "yearly_breakdown": district_data
        }

    out_file = os.path.join(WEATHER_DIR, "monsoon_rainfall_anomalies.json")
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump({
            "source": "Open-Meteo Historical ERA5 Reanalysis",
            "metric": "June-August Monsoon Seasonality Anomaly",
            "generated_at": datetime.now().isoformat(),
            "districts": results
        }, f, indent=2)

    print(f"\n[OK] Saved multi-year weather anomalies to {out_file}")


if __name__ == "__main__":
    fetch_and_compute_anomalies()
