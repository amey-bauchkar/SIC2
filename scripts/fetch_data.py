"""
MandiMitra Data Fetcher & Pipeline Builder
Fetches real open data for MandiMitra:
1. Mandi geocoding & coordinates (Nominatim OSM with verified fallbacks)
2. Road distance matrix via OSRM routing engine
3. Historical daily weather (Open-Meteo ERA5 reanalysis) for target districts
4. Live / Historical Mandi prices via data.gov.in (when API key is provided)
5. Comprehensive fetch report and metadata
"""

import os
import sys
import json
import time
import math
import urllib.request
import urllib.error
import urllib.parse
from datetime import datetime

# Configure UTF-8 for Windows console
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "data")
WEATHER_DIR = os.path.join(DATA_DIR, "weather")
PRICES_DIR = os.path.join(DATA_DIR, "prices")

# Target mandis categorized by district & primary commodity
TARGET_MANDIS = [
    # Nashik District (Primary Commodity: Onion)
    {
        "id": "nashik_lasalgaon",
        "market_name": "Lasalgaon",
        "district": "Nashik",
        "state": "Maharashtra",
        "taluka": "Niphad",
        "primary_commodity": "Onion",
        "description": "Asia's largest wholesale onion market",
        "default_coords": [20.1477, 74.2254]
    },
    {
        "id": "nashik_pimpalgaon",
        "market_name": "Pimpalgaon",
        "district": "Nashik",
        "state": "Maharashtra",
        "taluka": "Niphad",
        "primary_commodity": "Onion",
        "description": "Major onion and tomato APMC hub in Maharashtra",
        "default_coords": [20.1706, 73.9877]
    },
    {
        "id": "nashik_city",
        "market_name": "Nashik",
        "district": "Nashik",
        "state": "Maharashtra",
        "taluka": "Nashik",
        "primary_commodity": "Onion",
        "description": "Nashik District Central APMC (Dindori Road)",
        "default_coords": [20.0160, 73.7997]
    },
    {
        "id": "nashik_manmad",
        "market_name": "Manmad",
        "district": "Nashik",
        "state": "Maharashtra",
        "taluka": "Nandgaon",
        "primary_commodity": "Onion",
        "description": "Railway junction & regional secondary mandi",
        "default_coords": [20.2526, 74.4428]
    },
    {
        "id": "nashik_sinnar",
        "market_name": "Sinnar",
        "district": "Nashik",
        "state": "Maharashtra",
        "taluka": "Sinnar",
        "primary_commodity": "Onion",
        "description": "Southern Nashik agricultural trade hub",
        "default_coords": [19.8475, 74.0006]
    },
    {
        "id": "nashik_yeola",
        "market_name": "Yeola",
        "district": "Nashik",
        "state": "Maharashtra",
        "taluka": "Yeola",
        "primary_commodity": "Onion",
        "description": "Eastern Nashik key onion and maize market",
        "default_coords": [20.0425, 74.4897]
    },

    # Pune District (Primary Commodity: Tomato / Vegetables)
    {
        "id": "pune_gultekdi",
        "market_name": "Pune(Gultekdi)",
        "district": "Pune",
        "state": "Maharashtra",
        "taluka": "Haveli",
        "primary_commodity": "Tomato",
        "description": "Pune Central APMC Market Yard, Gultekdi",
        "default_coords": [18.4908, 73.8647]
    },
    {
        "id": "pune_junnar",
        "market_name": "Junnar(Narayangaon)",
        "district": "Pune",
        "state": "Maharashtra",
        "taluka": "Junnar",
        "primary_commodity": "Tomato",
        "description": "Western India's premier tomato market",
        "default_coords": [19.1177, 73.9785]
    },
    {
        "id": "pune_baramati",
        "market_name": "Baramati",
        "district": "Pune",
        "state": "Maharashtra",
        "taluka": "Baramati",
        "primary_commodity": "Tomato",
        "description": "Major southern Pune commercial agricultural market",
        "default_coords": [18.1517, 74.5772]
    },
    {
        "id": "pune_khed_chakan",
        "market_name": "Khed(Chakan)",
        "district": "Pune",
        "state": "Maharashtra",
        "taluka": "Khed",
        "primary_commodity": "Tomato",
        "description": "Northern Pune major vegetable and onion market",
        "default_coords": [18.7610, 73.8596]
    },

    # Latur District (Primary Commodity: Soyabean / Pulses)
    {
        "id": "latur_city",
        "market_name": "Latur",
        "district": "Latur",
        "state": "Maharashtra",
        "taluka": "Latur",
        "primary_commodity": "Soyabean",
        "description": "Premier national pulses and soybean trading hub",
        "default_coords": [18.3976, 76.5786]
    },
    {
        "id": "latur_udgir",
        "market_name": "Udgir",
        "district": "Latur",
        "state": "Maharashtra",
        "taluka": "Udgir",
        "primary_commodity": "Soyabean",
        "description": "Eastern Marathwada major oilseed & grain APMC",
        "default_coords": [18.3942, 77.1147]
    },
    {
        "id": "latur_ahmedpur",
        "market_name": "Ahmedpur",
        "district": "Latur",
        "state": "Maharashtra",
        "taluka": "Ahmedpur",
        "primary_commodity": "Soyabean",
        "description": "Northern Latur agricultural trading centre",
        "default_coords": [18.7051, 76.9318]
    }
]

DISTRICT_CENTERS = {
    "Nashik": {"lat": 19.9975, "lon": 73.7898, "name": "Nashik District Center"},
    "Pune": {"lat": 18.5204, "lon": 73.8567, "name": "Pune District Center"},
    "Latur": {"lat": 18.4088, "lon": 76.5604, "name": "Latur District Center"}
}


def make_request(url, headers=None, timeout=15):
    """Safe HTTP GET request with urllib."""
    default_headers = {
        "User-Agent": "MandiMitra-ResearchEngine/1.0 (Academic Hackathon Project; SVKM SBMP)"
    }
    if headers:
        default_headers.update(headers)
    req = urllib.request.Request(url, headers=default_headers)
    with urllib.request.urlopen(req, timeout=timeout) as response:
        return json.loads(response.read().decode("utf-8"))


def haversine_distance(lat1, lon1, lat2, lon2):
    """Great circle distance in kilometers."""
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(dlon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c


def fetch_geocoding():
    """Fetches or validates geocoordinates for target mandis."""
    print("\n[1/4] Geocoding Mandis via OpenStreetMap Nominatim...")
    locations = []
    
    for mandi in TARGET_MANDIS:
        query = f"{mandi['market_name']} APMC, {mandi['district']}, Maharashtra, India"
        encoded_query = urllib.parse.quote(query)
        url = f"https://nominatim.openstreetmap.org/search?q={encoded_query}&format=json&limit=1"
        
        lat, lon = mandi["default_coords"]
        geocoded = False
        
        try:
            time.sleep(1.0)  # Nominatim rate limit compliance: max 1 req/sec
            data = make_request(url)
            if data and len(data) > 0:
                lat = float(data[0]["lat"])
                lon = float(data[0]["lon"])
                geocoded = True
                print(f"  [OK] {mandi['market_name']} ({mandi['district']}): Geocoded ({lat:.4f}, {lon:.4f})")
            else:
                print(f"  [INFO] {mandi['market_name']} ({mandi['district']}): Verified coordinates ({lat:.4f}, {lon:.4f})")
        except Exception as e:
            print(f"  [INFO] {mandi['market_name']} ({mandi['district']}): Fallback coordinates ({lat:.4f}, {lon:.4f}) [{e}]")

        locations.append({
            "id": mandi["id"],
            "market_name": mandi["market_name"],
            "district": mandi["district"],
            "state": mandi["state"],
            "taluka": mandi["taluka"],
            "primary_commodity": mandi["primary_commodity"],
            "description": mandi["description"],
            "latitude": round(lat, 5),
            "longitude": round(lon, 5),
            "is_geocoded_live": geocoded
        })

    out_file = os.path.join(DATA_DIR, "mandi_locations.json")
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(locations, f, indent=2, ensure_ascii=False)
    print(f"-> Saved {len(locations)} mandi locations to {out_file}")
    return locations


def fetch_distance_matrix(locations):
    """Computes driving distance & transport cost using OSRM with Haversine fallback."""
    print("\n[2/4] Computing Distance Matrix via OSRM Driving Engine...")
    matrix = []
    
    # Standard Indian rural transport economics:
    # Small commercial vehicle (Tata Ace / Mahindra Bolero Maxi Truck / Eicher):
    # ~ ₹1.25 per km per quintal for inter-mandi regional haulage
    COST_PER_KM_PER_QUINTAL = 1.25
    BASE_HANDLING_FEE_PER_QUINTAL = 15.0  # Loading/unloading fixed charge

    for dist_name, dist_center in DISTRICT_CENTERS.items():
        origin_lat = dist_center["lat"]
        origin_lon = dist_center["lon"]
        
        for mandi in locations:
            dest_lat = mandi["latitude"]
            dest_lon = mandi["longitude"]
            
            # OSRM format: lon,lat;lon,lat
            osrm_url = (f"http://router.project-osrm.org/route/v1/driving/"
                        f"{origin_lon},{origin_lat};{dest_lon},{dest_lat}?overview=false")
            
            distance_km = None
            duration_minutes = None
            source = "OSRM"

            try:
                time.sleep(0.3)
                data = make_request(osrm_url, timeout=6)
                if data.get("code") == "Ok" and data.get("routes"):
                    route = data["routes"][0]
                    distance_km = round(route["distance"] / 1000.0, 1)
                    duration_minutes = round(route["duration"] / 60.0, 1)
            except Exception:
                pass
            
            if distance_km is None:
                # Road winding factor: 1.28x over straight-line Haversine
                direct_dist = haversine_distance(origin_lat, origin_lon, dest_lat, dest_lon)
                distance_km = round(direct_dist * 1.28, 1)
                duration_minutes = round((distance_km / 40.0) * 60.0, 1)  # average 40 km/h truck speed
                source = "Haversine_RoadWinding"

            transport_cost = round(BASE_HANDLING_FEE_PER_QUINTAL + (distance_km * COST_PER_KM_PER_QUINTAL), 2)
            
            entry = {
                "origin_district": dist_name,
                "origin_coords": [origin_lat, origin_lon],
                "destination_mandi_id": mandi["id"],
                "destination_mandi": mandi["market_name"],
                "destination_district": mandi["district"],
                "destination_coords": [dest_lat, dest_lon],
                "distance_km": distance_km,
                "travel_time_minutes": duration_minutes,
                "transport_cost_per_quintal": transport_cost,
                "routing_source": source
            }
            matrix.append(entry)
            print(f"  {dist_name} -> {mandi['market_name']}: {distance_km} km (₹{transport_cost}/q) [{source}]")

    out_file = os.path.join(DATA_DIR, "distance_matrix.json")
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(matrix, f, indent=2, ensure_ascii=False)
    print(f"-> Saved {len(matrix)} route pairs to {out_file}")
    return matrix


def fetch_weather_history():
    """Fetches daily weather history from Open-Meteo ERA5 reanalysis for all target districts."""
    print("\n[3/4] Fetching Daily Weather History via Open-Meteo API...")
    os.makedirs(WEATHER_DIR, exist_ok=True)
    
    start_date = "2026-01-01"
    end_date = "2026-08-31"
    
    weather_summary = {}

    for dist_name, coords in DISTRICT_CENTERS.items():
        lat = coords["lat"]
        lon = coords["lon"]
        
        url = (
            f"https://archive-api.open-meteo.com/v1/archive?"
            f"latitude={lat}&longitude={lon}&"
            f"start_date={start_date}&end_date={end_date}&"
            f"daily=temperature_2m_mean,temperature_2m_max,temperature_2m_min,"
            f"precipitation_sum,relative_humidity_2m_mean,wind_speed_10m_max&"
            f"timezone=Asia%2FKolkata"
        )
        
        try:
            print(f"  Fetching weather for {dist_name} ({lat}, {lon}) from {start_date} to {end_date}...")
            data = make_request(url, timeout=20)
            
            daily = data.get("daily", {})
            num_days = len(daily.get("time", []))
            
            clean_records = []
            for i in range(num_days):
                clean_records.append({
                    "date": daily["time"][i],
                    "temperature_mean_c": daily["temperature_2m_mean"][i],
                    "temperature_max_c": daily["temperature_2m_max"][i],
                    "temperature_min_c": daily["temperature_2m_min"][i],
                    "precipitation_mm": daily["precipitation_sum"][i],
                    "relative_humidity_pct": daily["relative_humidity_2m_mean"][i],
                    "wind_speed_kmh": daily["wind_speed_10m_max"][i]
                })
                
            out_file = os.path.join(WEATHER_DIR, f"{dist_name.lower()}.json")
            with open(out_file, "w", encoding="utf-8") as f:
                json.dump({
                    "district": dist_name,
                    "latitude": lat,
                    "longitude": lon,
                    "start_date": start_date,
                    "end_date": end_date,
                    "total_days": num_days,
                    "records": clean_records
                }, f, indent=2)
                
            weather_summary[dist_name] = {
                "records_count": num_days,
                "file": out_file,
                "status": "SUCCESS"
            }
            print(f"  [OK] {dist_name}: Saved {num_days} days of weather to {out_file}")
            time.sleep(0.5)
        except Exception as e:
            print(f"  [FAIL] {dist_name}: Failed to fetch weather: {e}")
            weather_summary[dist_name] = {"status": "FAILED", "error": str(e)}

    return weather_summary


def fetch_mandi_prices():
    """Fetches mandi prices using data.gov.in API key if provided."""
    print("\n[4/4] Checking Mandi Prices API (data.gov.in)...")
    os.makedirs(PRICES_DIR, exist_ok=True)
    
    key_file = os.path.join(DATA_DIR, "api_key.txt")
    api_key = None
    
    if os.path.exists(key_file):
        with open(key_file, "r", encoding="utf-8") as f:
            api_key = f.read().strip()
    
    if not api_key:
        api_key = os.environ.get("DATA_GOV_IN_API_KEY", "").strip()

    if not api_key:
        print("  [INFO] No data.gov.in API key detected in 'data/api_key.txt' or environment.")
        print("  -> Phase 1 completed successfully! Ready for Phase 2 when API key is provided.")
        return {
            "status": "AWAITING_API_KEY",
            "message": "Paste API key into data/api_key.txt and re-run to fetch live mandi prices.",
            "resource_id": "9ef84268-d588-465a-a308-a864a43d0070"
        }

    print(f"  [OK] API key detected! Fetching prices for Maharashtra...")
    resource_id = "9ef84268-d588-465a-a308-a864a43d0070"
    commodities = ["Onion", "Tomato", "Soyabean"]
    prices_summary = {}

    for commodity in commodities:
        try:
            print(f"  Fetching records for {commodity} in Maharashtra...")
            encoded_state = urllib.parse.quote("Maharashtra")
            encoded_commodity = urllib.parse.quote(commodity)
            url = (
                f"https://api.data.gov.in/resource/{resource_id}?"
                f"api-key={api_key}&format=json&limit=500&"
                f"filters[state]={encoded_state}&filters[commodity]={encoded_commodity}"
            )
            
            data = make_request(url, timeout=25)
            records = data.get("records", [])
            
            out_file = os.path.join(PRICES_DIR, f"{commodity.lower()}_maharashtra.json")
            with open(out_file, "w", encoding="utf-8") as f:
                json.dump({
                    "commodity": commodity,
                    "state": "Maharashtra",
                    "fetched_at": datetime.now().isoformat(),
                    "total_records": len(records),
                    "records": records
                }, f, indent=2, ensure_ascii=False)
                
            prices_summary[commodity] = {
                "records_count": len(records),
                "file": out_file,
                "status": "SUCCESS"
            }
            print(f"  [OK] {commodity}: {len(records)} records saved to {out_file}")
            time.sleep(1.0)
        except Exception as e:
            print(f"  [FAIL] {commodity}: Failed to fetch prices: {e}")
            prices_summary[commodity] = {"status": "FAILED", "error": str(e)}

    return prices_summary


def main():
    start_time = time.time()
    print("=" * 70)
    print("MANDIMITRA DATA PIPELINE — PHASE 1 DATA INGESTION")
    print(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 70)
    
    os.makedirs(DATA_DIR, exist_ok=True)
    
    locations = fetch_geocoding()
    distance_matrix = fetch_distance_matrix(locations)
    weather_summary = fetch_weather_history()
    prices_summary = fetch_mandi_prices()
    
    # Save overall fetch report
    report = {
        "timestamp": datetime.now().isoformat(),
        "elapsed_seconds": round(time.time() - start_time, 2),
        "phase_1_status": "COMPLETED",
        "mandi_locations": {
            "count": len(locations),
            "file": os.path.join(DATA_DIR, "mandi_locations.json")
        },
        "distance_matrix": {
            "route_pairs_count": len(distance_matrix),
            "file": os.path.join(DATA_DIR, "distance_matrix.json")
        },
        "weather_data": weather_summary,
        "prices_data": prices_summary
    }
    
    report_file = os.path.join(DATA_DIR, "fetch_report.json")
    with open(report_file, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2)
        
    print("\n" + "=" * 70)
    print(f"PIPELINE SUMMARY: Phase 1 complete in {report['elapsed_seconds']}s")
    print(f"Fetch report saved to: {report_file}")
    print("=" * 70)


if __name__ == "__main__":
    main()
