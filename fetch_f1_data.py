#!/usr/bin/env python3
"""
F1 Telemetry Data Fetcher
Fetches telemetry data via FastF1 and saves as JSON for the web app.
Usage: python fetch_f1_data.py [--year 2025] [--gp "Bahrain Grand Prix"] [--session "R"]
"""

import argparse
import gzip
import json
import os
import sys
from pathlib import Path

try:
    import fastf1
    import fastf1.plotting
    import numpy as np
    import pandas as pd
except ImportError as e:
    print(f"Missing dependency: {e}")
    print("Install: pip install fastf1 numpy pandas")
    sys.exit(1)

# Cache setup
CACHE_DIR = Path(__file__).parent / ".f1cache"
CACHE_DIR.mkdir(exist_ok=True)
fastf1.Cache.enable_cache(str(CACHE_DIR))

# Output directory (Next.js public folder)
OUTPUT_DIR = Path(__file__).parent / "public" / "data" / "telemetry"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# 2025-2026 Team Colors (F1 official)
TEAM_COLORS = {
    "McLaren": "#FF8000",
    "Ferrari": "#E8002D",
    "Red Bull Racing": "#3671C6",
    "Mercedes": "#27F4D2",
    "Aston Martin": "#229971",
    "Alpine": "#0093CC",
    "Williams": "#64C4FF",
    "Haas F1 Team": "#B6BABD",
    "RB": "#6692FF",
    "Kick Sauber": "#52E252",
    # 2026 names
    "Red Bull": "#3671C6",
    "Cadillac": "#E5D07B",
    "Audi": "#C8002F",
    "Racing Bulls": "#6692FF",
}

# 2025-2026 Driver Grid
DRIVER_GRID = {
    # 2025
    "NOR": {"name": "Lando Norris", "team": "McLaren", "number": 4},
    "PIA": {"name": "Oscar Piastri", "team": "McLaren", "number": 81},
    "LEC": {"name": "Charles Leclerc", "team": "Ferrari", "number": 16},
    "HAM": {"name": "Lewis Hamilton", "team": "Ferrari", "number": 44},
    "VER": {"name": "Max Verstappen", "team": "Red Bull Racing", "number": 1},
    "PER": {"name": "Sergio Perez", "team": "Red Bull Racing", "number": 11},
    "RUS": {"name": "George Russell", "team": "Mercedes", "number": 63},
    "ANT": {"name": "Kimi Antonelli", "team": "Mercedes", "number": 12},
    "ALO": {"name": "Fernando Alonso", "team": "Aston Martin", "number": 14},
    "STR": {"name": "Lance Stroll", "team": "Aston Martin", "number": 18},
    "GAS": {"name": "Pierre Gasly", "team": "Alpine", "number": 10},
    "OCO": {"name": "Esteban Ocon", "team": "Alpine", "number": 31},
    "ALB": {"name": "Alexander Albon", "team": "Williams", "number": 23},
    "SAI": {"name": "Carlos Sainz", "team": "Williams", "number": 55},
    "HUL": {"name": "Nico Hulkenberg", "team": "Kick Sauber", "number": 27},
    "BOT": {"name": "Valtteri Bottas", "team": "Kick Sauber", "number": 77},
    "BEA": {"name": "Oliver Bearman", "team": "Haas F1 Team", "number": 87},
    "HAD": {"name": "Isack Hadjar", "team": "RB", "number": 6},
    "LAW": {"name": "Liam Lawson", "team": "RB", "number": 30},
    "TSU": {"name": "Yuki Tsunoda", "team": "RB", "number": 22},
    # 2026
    "BOR": {"name": "Gabriel Bortoleto", "team": "Audi", "number": 5},
    "IWA": {"name": "Ayumu Iwasa", "team": "Red Bull", "number": 36},
    "COL": {"name": "Franco Colapinto", "team": "Alpine", "number": 43},
}


def get_team_color(team_name):
    """Get official F1 team color."""
    for key, color in TEAM_COLORS.items():
        if key.lower() in team_name.lower() or team_name.lower() in key.lower():
            return color
    return "#888888"


def get_session_schedule(year):
    """Get available GPs for a year."""
    try:
        schedule = fastf1.get_event_schedule(year)
        if "EventFormat" in schedule.columns:
            schedule = schedule[schedule["EventFormat"] != "testing"]
        gps = []
        for _, row in schedule.iterrows():
            gps.append({
                "name": row["EventName"],
                "country": row.get("Country", ""),
                "round": int(row.get("RoundNumber", 0)),
            })
        return gps
    except Exception as e:
        print(f"Error fetching schedule: {e}")
        return []


def fetch_session_data(year, gp_name, session_type):
    """Fetch lap data and telemetry for a session."""
    print(f"Fetching {year} {gp_name} {session_type}...")

    try:
        session = fastf1.get_session(year, gp_name, session_type)
        session.load(telemetry=True, laps=True, weather=False)
    except Exception as e:
        print(f"Warning: Session load with telemetry failed, trying without: {e}")
        try:
            session.load(telemetry=False, laps=True, weather=False)
        except Exception as e2:
            print(f"Error loading session: {e2}")
            return None

    try:
        laps = session.laps
    except Exception as e:
        print(f"Error accessing laps: {e}")
        return None

    if laps is None or laps.empty:
        print("No laps data available")
        return None

    # Get unique drivers
    drivers = laps["Driver"].unique()

    result = {
        "year": year,
        "gp": gp_name,
        "session": session_type,
        "circuit": session.event.get("CircuitShortName", gp_name),
        "drivers": [],
        "laps": [],
        "corners": [],
    }

    # Get circuit corners and rotation
    try:
        circuit_info = session.get_circuit_info()
        if circuit_info is not None and hasattr(circuit_info, 'corners'):
            for _, corner in circuit_info.corners.iterrows():
                result["corners"].append({
                    "number": str(corner.get("Number", "")),
                    "distance": float(corner.get("Distance", 0)),
                    "x": float(corner.get("X", 0)),
                    "y": float(corner.get("Y", 0)),
                    "angle": float(corner.get("Angle", 0)),
                })
        result["trackRotation"] = float(circuit_info.rotation) if hasattr(circuit_info, 'rotation') else 0
    except Exception as e:
        print(f"  Warning: Could not get circuit info: {e}")
        result["trackRotation"] = 0

    for driver_code in drivers:
        driver_laps = laps.pick_drivers(driver_code)
        if driver_laps.empty:
            continue

        # Get driver info
        try:
            driver_info = session.get_driver(driver_code)
            full_name = driver_info.get("FullName", driver_code)
            team_name = driver_info.get("TeamName", "Unknown")
            headshot_url = driver_info.get("HeadshotUrl", "")
        except Exception:
            full_name = driver_code
            team_name = "Unknown"
            headshot_url = ""

        team_color = get_team_color(team_name)

        driver_entry = {
            "code": driver_code,
            "name": full_name,
            "team": team_name,
            "color": team_color,
            "headshot": headshot_url,
        }
        result["drivers"].append(driver_entry)

        # Process laps
        for _, lap in driver_laps.iterlaps():
            lap_time = lap["LapTime"]
            if pd.isna(lap_time):
                continue

            tyre_life = lap.get("TyreLife", 0)
            lap_data = {
                "driver": driver_code,
                "lapNumber": int(lap["LapNumber"]),
                "lapTime": lap_time.total_seconds(),
                "isFastest": False,
                "compound": str(lap.get("Compound", "")) if lap.get("Compound") is not None else "",
                "tyreLife": int(tyre_life) if tyre_life is not None and str(tyre_life) != "nan" else 0,
                "telemetry": None,
            }

            # Check if fastest
            try:
                fastest = driver_laps.pick_fastest()
                if int(lap["LapNumber"]) == int(fastest["LapNumber"]):
                    lap_data["isFastest"] = True
            except Exception:
                pass

            # Get telemetry (sampled to reduce JSON size)
            try:
                tel = lap.get_telemetry()
                if tel is None or tel.empty:
                    continue
                if not tel.empty:
                    # Sample to reduce file size (160 points per lap)
                    sample_rate = max(1, len(tel) // 160)
                    indices = np.arange(0, len(tel), sample_rate)
                    sampled = tel.iloc[indices]

                    lap_data["telemetry"] = {
                        "distance": sampled["Distance"].round(1).tolist(),
                        "speed": sampled["Speed"].astype(int).tolist(),
                        "throttle": sampled["Throttle"].astype(int).tolist(),
                        "brake": sampled["Brake"].astype(int).tolist(),
                        "rpm": sampled["RPM"].astype(int).tolist(),
                        "gear": sampled["nGear"].astype(int).tolist(),
                        "drs": sampled["DRS"].astype(int).tolist() if "DRS" in sampled.columns else [0] * len(sampled),
                        "x": sampled["X"].round(1).tolist() if "X" in sampled.columns else [],
                        "y": sampled["Y"].round(1).tolist() if "Y" in sampled.columns else [],
                    }
            except Exception as e:
                print(f"  Warning: Could not get telemetry for {driver_code} L{lap['LapNumber']}: {e}")

            result["laps"].append(lap_data)

    return result


def fetch_available_sessions(year, gp_name):
    """Get available session types for a GP."""
    sessions = []
    for stype in ["FP1", "FP2", "FP3", "Q", "S", "SQ", "R"]:
        try:
            session = fastf1.get_session(year, gp_name, stype)
            # Just check if session exists by trying to get event info
            sessions.append(stype)
        except Exception:
            pass
    return sessions


def save_data(data, filename):
    """Save data as gzip-compressed JSON."""
    filepath = OUTPUT_DIR / filename
    with gzip.open(filepath, "wt", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, separators=(",", ":"))
    size_kb = filepath.stat().st_size / 1024
    print(f"Saved: {filepath} ({size_kb:.1f} KB gzipped)")
    return filepath


def build_index():
    """Build index.json from existing JSON/gzip files in the telemetry directory."""
    files = list(OUTPUT_DIR.glob("*.json.gz")) + list(OUTPUT_DIR.glob("*.json"))
    sessions = []
    for f in files:
        if f.name == "index.json":
            continue
        try:
            if f.suffix == ".gz":
                with gzip.open(f, "rt", encoding="utf-8") as fh:
                    data = json.load(fh)
            else:
                with open(f, "r", encoding="utf-8") as fh:
                    data = json.load(fh)
            sessions.append({
                "filename": f.name,
                "year": data.get("year"),
                "gp": data.get("gp"),
                "session": data.get("session"),
                "circuit": data.get("circuit", ""),
                "drivers": [d["code"] for d in data.get("drivers", [])],
                "lapCount": len(data.get("laps", [])),
            })
        except Exception as e:
            print(f"Warning: Could not read {f.name}: {e}")

    sessions.sort(key=lambda x: (x.get("year", 0), x.get("gp", "")))

    index_path = OUTPUT_DIR / "index.json"
    with open(index_path, "w", encoding="utf-8") as fh:
        json.dump({"sessions": sessions}, fh, ensure_ascii=False, indent=2)

    print(f"Index built: {len(sessions)} sessions -> {index_path}")
    return sessions


def main():
    parser = argparse.ArgumentParser(description="Fetch F1 telemetry data")
    parser.add_argument("--year", type=int, default=2025, help="Season year")
    parser.add_argument("--gp", type=str, help="Grand Prix name (e.g., 'Bahrain Grand Prix')")
    parser.add_argument("--session", type=str, help="Session type (FP1, FP2, FP3, Q, S, SQ, R)")
    parser.add_argument("--list-gps", action="store_true", help="List available GPs")
    parser.add_argument("--list-sessions", action="store_true", help="List available sessions for a GP")
    parser.add_argument("--fetch-all", action="store_true", help="Fetch all available data for a GP")
    parser.add_argument("--build-index", action="store_true", help="Build index.json from cached data")
    args = parser.parse_args()

    if args.build_index:
        build_index()
        return

    if args.list_gps:
        gps = get_session_schedule(args.year)
        print(f"\nAvailable GPs for {args.year}:")
        for gp in gps:
            print(f"  {gp['round']:2d}. {gp['name']} ({gp['country']})")
        return

    if args.list_sessions:
        if not args.gp:
            print("Error: --gp is required with --list-sessions")
            return
        sessions = fetch_available_sessions(args.year, args.gp)
        print(f"\nAvailable sessions for {args.year} {args.gp}:")
        for s in sessions:
            print(f"  - {s}")
        return

    if args.gp and args.session:
        data = fetch_session_data(args.year, args.gp, args.session)
        if data:
            filename = f"{args.year}_{args.gp.replace(' ', '_')}_{args.session}.json.gz"
            save_data(data, filename)
            print(f"\nDone! Fetched {len(data['drivers'])} drivers, {len(data['laps'])} laps")
            build_index()
        return

    if args.gp and args.fetch_all:
        sessions = fetch_available_sessions(args.year, args.gp)
        for s in sessions:
            data = fetch_session_data(args.year, args.gp, s)
            if data:
                filename = f"{args.year}_{args.gp.replace(' ', '_')}_{s}.json.gz"
                save_data(data, filename)
        build_index()
        return

    # Default: show usage
    parser.print_help()
    print("\nExamples:")
    print(f"  python {__file__} --year 2025 --list-gps")
    print(f"  python {__file__} --year 2025 --gp 'Bahrain Grand Prix' --list-sessions")
    print(f"  python {__file__} --year 2025 --gp 'Bahrain Grand Prix' --session R")
    print(f"  python {__file__} --year 2025 --gp 'Bahrain Grand Prix' --fetch-all")


if __name__ == "__main__":
    main()
