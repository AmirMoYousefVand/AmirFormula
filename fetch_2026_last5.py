#!/usr/bin/env python3
"""
Download last 5 qualifying sessions from 2026 season (as of Sep 1, 2026).
GP: Austrian, British, Belgian, Hungarian, Dutch
Sessions: FP1, FP2, FP3, Q, SQ
"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fetch_f1_data import (
    fetch_session_data, save_data, build_index,
    enrich_with_best_sectors, OUTPUT_DIR
)

LAST_5_GPS = [
    "Austrian Grand Prix",
    "British Grand Prix",
    "Belgian Grand Prix",
    "Hungarian Grand Prix",
    "Dutch Grand Prix",
]

SESSIONS = ["FP1", "FP2", "FP3", "Q", "SQ"]
YEAR = 2026


def progress(current, total, label=""):
    if total == 0:
        return
    pct = int(current / total * 100)
    bar_len = 30
    filled = int(bar_len * current / total)
    bar = "█" * filled + "░" * (bar_len - filled)
    print(f"\r  [{bar}] {pct:3d}%  {label:40s}", end="", flush=True)
    if current >= total:
        print()


def main():
    total_sessions = len(LAST_5_GPS) * len(SESSIONS)
    results = []

    print(f"Fetching {len(LAST_5_GPS)} GPs × {len(SESSIONS)} sessions\n")

    for gp in LAST_5_GPS:
        print(f"▶ {gp} ({YEAR})")
        for session in SESSIONS:
            try:
                data = fetch_session_data(YEAR, gp, session)
                if data:
                    filename = f"{YEAR}_{gp.replace(' ', '_')}_{session}.json.gz"
                    save_data(data, filename)
                    results.append((gp, session, len(data['drivers']), len(data['laps'])))
                else:
                    results.append((gp, session, 0, 0))
            except Exception:
                results.append((gp, session, 0, 0))

    ok = sum(1 for r in results if r[2] > 0)
    print(f"\n{'━' * 50}")
    print(f"  Downloaded: {ok}/{total_sessions} sessions")

    # Enrich phase with progress bar
    files = list(OUTPUT_DIR.glob("*.json.gz"))
    total_steps = len(files) + 1

    def on_enrich(i, total, fname):
        progress(i, total_steps, f"Enriching: {fname}")

    print(f"\n  Enriching + building colors ({len(files)} files)...\n")
    enrich_with_best_sectors(callback=on_enrich)
    progress(total_steps - 1, total_steps, "Building index.json")
    build_index()
    progress(total_steps, total_steps, "Done")

    print(f"\n{'━' * 50}")
    print(f"  {'GP':30s} {'Sess':4s} {'Drv':4s} {'Laps':5s}")
    print(f"  {'─' * 48}")
    for gp, sess, drv, laps in results:
        if drv > 0:
            print(f"  {gp:30s} {sess:4s} {drv:4d} {laps:5d}")
        else:
            print(f"  {gp:30s} {sess:4s} {'—':>4s} {'—':>5s}")
    print(f"{'━' * 50}\n  All done! 🏁")


if __name__ == "__main__":
    main()
