import os
import json

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "data")
MANDIS_FILE = os.path.join(DATA_DIR, "mandi_locations_all.json")
OUT_FILE = os.path.join(BASE_DIR, "src", "data-pipeline", "registry.ts")

with open(MANDIS_FILE, "r", encoding="utf-8") as f:
    mandis = json.load(f)

lines = [
    "/**",
    " * MandiMitra Data Pipeline: Regional APMC Market Registry",
    f" * Complete state-wide registry of all {len(mandis)} major Maharashtra APMC mandis.",
    " * ",
    " * OWNER: Amay (Team Lead)",
    " */",
    "",
    "import { Market } from '../contracts/domain';",
    "",
    "export const MAHARASHTRA_MANDIS: Market[] = ["
]

for m in mandis:
    lines.append("  {")
    lines.append(f"    id: '{m['id']}',")
    lines.append(f"    name: '{m['market_name']}',")
    lines.append(f"    state: 'Maharashtra',")
    lines.append(f"    district: '{m['district']}',")
    lines.append(f"    lat: {m['latitude']},")
    lines.append(f"    lon: {m['longitude']}")
    lines.append("  },")

lines.append("];")
lines.append("")
lines.append("export function findMarketById(id: string): Market | undefined {")
lines.append("  return MAHARASHTRA_MANDIS.find(m => m.id === id || m.name.toLowerCase().includes(id.toLowerCase()));")
lines.append("}")
lines.append("")
lines.append("export function getAllMarkets(): Market[] {")
lines.append("  return [...MAHARASHTRA_MANDIS];")
lines.append("}")
lines.append("")

content = "\n".join(lines)
with open(OUT_FILE, "w", encoding="utf-8") as f:
    f.write(content)

print(f"[OK] Successfully synced {len(mandis)} Maharashtra mandis to {OUT_FILE}")
