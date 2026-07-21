#!/usr/bin/env python3
"""Bake OpenStreetMap street geometry into site/data/map.json for the
Three.js route walkthrough. Map data (c) OpenStreetMap contributors, ODbL —
credited on the public site.

Usage: py -3.12 tools/bake_map.py <raw-overpass.json>
"""
import json
import math
import sys
from pathlib import Path

# Scene origin (mid-route) and projection scale: meters -> scene units (1u = 10m)
LAT0, LON0 = 28.6215, 77.2115
M_PER_DEG_LAT = 110_574.0
M_PER_DEG_LON = 111_320.0 * math.cos(math.radians(LAT0))
UNITS_PER_M = 0.1

MAJOR = {"trunk", "primary", "secondary"}

# Anchors: real OSM coordinates where found; others are approximate public
# landmarks (the public tier generalizes locations by design).
LANDMARKS = [
    {"id": "jm",       "name": "Jantar Mantar protest site", "lat": 28.62553, "lon": 77.21579},
    {"id": "park",     "name": "Park Hotel area",            "lat": 28.62815, "lon": 77.21825, "approx": True},
    {"id": "patel",    "name": "Patel Chowk",                "lat": 28.62295, "lon": 77.21406},
    {"id": "ps",       "name": "Parliament Street PS",       "lat": 28.62060, "lon": 77.21230, "approx": True},
    {"id": "shastri",  "name": "Shastri Bhawan",             "lat": 28.61608, "lon": 77.21543},
    {"id": "rail",     "name": "Rail Bhavan",                "lat": 28.61586, "lon": 77.21139},
    {"id": "sansad",   "name": "Parliament",                 "lat": 28.61700, "lon": 77.20880, "approx": True},
]

# March route: Jantar Mantar -> Sansad Marg -> toward Parliament.
ROUTE_ANCHORS = [
    (28.62553, 77.21579),  # protest site
    (28.62440, 77.21400),  # Jantar Mantar Rd / Sansad Marg junction
    (28.62295, 77.21406),  # Patel Chowk
    (28.62060, 77.21230),  # Parliament Street PS stretch
    (28.61850, 77.21060),  # Sansad Marg lower stretch
    (28.61700, 77.20880),  # Parliament approach
]


def project(lat, lon):
    x = (lon - LON0) * M_PER_DEG_LON * UNITS_PER_M
    z = -(lat - LAT0) * M_PER_DEG_LAT * UNITS_PER_M  # north = -z (three.js)
    return round(x, 1), round(z, 1)


def simplify(points, min_gap_units=1.2):
    """Drop points closer than min_gap to the previous kept point."""
    if len(points) <= 2:
        return points
    kept = [points[0]]
    for p in points[1:-1]:
        dx = p[0] - kept[-1][0]
        dz = p[1] - kept[-1][1]
        if dx * dx + dz * dz >= min_gap_units * min_gap_units:
            kept.append(p)
    kept.append(points[-1])
    return kept


def building_height(tags):
    """Rough extrusion height in scene units (1u = 10m)."""
    try:
        if tags.get("height"):
            return round(float(str(tags["height"]).split()[0]) * UNITS_PER_M, 2)
        if tags.get("building:levels"):
            return round(float(tags["building:levels"]) * 3.5 * UNITS_PER_M, 2)
    except ValueError:
        pass
    name = (tags.get("name") or "").lower()
    if "samrat yantra" in name:
        return 2.7  # 27 m gnomon
    if "yantra" in name:
        return 1.2
    if "sabha" in name or "parliament" in name:
        return 2.4
    return 0.8


def main():
    paths = [p for p in sys.argv[1:] if Path(p).is_file()]
    if not paths:
        sys.exit("usage: bake_map.py <raw-overpass.json> [more.json ...]")

    roads, parks, buildings = [], [], []
    total_pts = 0
    seen_ways = set()
    for path in paths:
        raw = json.loads(Path(path).read_text(encoding="utf-8"))
        for el in raw.get("elements", []):
            if el.get("type") != "way" or "geometry" not in el or el["id"] in seen_ways:
                continue
            seen_ways.add(el["id"])
            tags = el.get("tags", {})
            pts = simplify([project(g["lat"], g["lon"]) for g in el["geometry"]])
            if len(pts) < 2:
                continue
            if tags.get("highway"):
                roads.append({"w": 2 if tags["highway"] in MAJOR else 1, "pts": pts})
                total_pts += len(pts)
            elif tags.get("building"):
                if len(pts) >= 3:
                    buildings.append({"h": building_height(tags), "pts": pts})
            elif tags.get("leisure") in ("park", "garden") or tags.get("landuse") in ("grass", "recreation_ground"):
                if len(pts) >= 3:
                    parks.append({"pts": pts})

    out = {
        "attribution": "Map data (c) OpenStreetMap contributors (ODbL). Stylized; locations approximate.",
        "unitsPerMeter": UNITS_PER_M,
        "roads": roads,
        "parks": parks,
        "buildings": buildings,
        "landmarks": [
            {**{k: lm[k] for k in ("id", "name") if k in lm},
             "approx": lm.get("approx", False),
             "xz": list(project(lm["lat"], lm["lon"]))}
            for lm in LANDMARKS
        ],
        "route": [list(project(la, lo)) for la, lo in ROUTE_ANCHORS],
    }

    dest = Path(__file__).resolve().parent.parent / "site" / "data" / "map.json"
    dest.write_text(json.dumps(out, separators=(",", ":")), encoding="utf-8")
    print(f"{len(roads)} roads ({total_pts} pts), {len(parks)} parks, "
          f"{len(buildings)} buildings, {len(out['landmarks'])} landmarks -> {dest}")


if __name__ == "__main__":
    main()
