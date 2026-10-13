#!/usr/bin/env python3
"""Optional historical NBA game-loader for a reproducible *real* ML experiment.

Reads only a few seasons of finished regular-season NBA team-game logs from a
community-maintained, no-key DuckDB catalog, and writes local CSV training rows.
Requires `pip install duckdb`; the game itself needs no Python dependencies.
No external data is committed to the repo. Availability and reuse rights are
controlled by the original data providers, not COURTSIDE AI.
"""
import argparse
import csv
import json
from datetime import datetime, timezone
from pathlib import Path

SOURCE = "https://basketball-data.billmill.org/nba/nba.duckdb"
SQL = """
SELECT CAST(h.game_date AS VARCHAR) AS date,
       CAST(h.team_id AS VARCHAR) AS home_team,
       CAST(a.team_id AS VARCHAR) AS away_team,
       CAST(h.pts AS INTEGER) AS home_score,
       CAST(a.pts AS INTEGER) AS away_score
FROM nba.team_game_logs h
JOIN nba.team_game_logs a
  ON h.game_id = a.game_id AND h.season = a.season
 AND h.team_id <> a.team_id
WHERE h.home IS TRUE AND a.home IS FALSE
  AND h.season BETWEEN ? AND ?
  AND a.season BETWEEN ? AND ?
  AND h.game_id LIKE '002%'
  AND h.pts IS NOT NULL AND a.pts IS NOT NULL
ORDER BY h.game_date, h.game_id
"""


def validate_rows(rows):
    clean = []
    seen = set()
    for row in rows:
        day, home, away, hp, ap = row
        if not day or not home or not away or home == away:
            raise ValueError("Invalid fixture team/date fields")
        if int(hp) < 0 or int(ap) < 0 or int(hp) == int(ap):
            raise ValueError("Invalid completed NBA result")
        key = (day, home, away)
        if key in seen:
            raise ValueError("Duplicate completed game entry")
        seen.add(key)
        clean.append([str(day), str(home), str(away), int(hp), int(ap)])
    return clean


def download(out_path, start_season=2024, end_season=2026):
    try:
        import duckdb
    except ImportError as exc:
        raise RuntimeError("Install the free Python dependency: pip install duckdb") from exc
    if start_season > end_season:
        raise ValueError("start_season cannot exceed end_season")
    db = duckdb.connect()
    try:
        db.execute(f"ATTACH '{SOURCE}' AS nba (READ_ONLY)")
        records = db.execute(SQL, [start_season, end_season, start_season, end_season]).fetchall()
        teams = db.execute('SELECT CAST(team_id AS VARCHAR), full_name, nba_abbrev FROM nba.team_seasons WHERE season = ? AND is_nba IS TRUE ORDER BY full_name',[min(end_season,2026)]).fetchall()
    finally:
        db.close()
    rows = validate_rows(records)
    if not rows:
        raise ValueError("Public dataset returned zero completed regular-season games")
    out_path = Path(out_path)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    with out_path.open("w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["date", "home_team", "away_team", "home_score", "away_score"])
        writer.writerows(rows)
    meta = {
        "source": SOURCE,
        "upstream": "https://github.com/llimllib/nba_data",
        "description": "Community-maintained NBA team game logs, original stats from NBA",
        "downloaded_utc": datetime.now(timezone.utc).isoformat(),
        "start_season": start_season,
        "end_season": end_season,
        "row_count": len(rows),
        "data_note": "Public access is not a license grant. Use subject to upstream and NBA terms."
    }
    out_path.with_suffix(".teams.json").write_text(json.dumps(
        {team_id: {"name": name, "abbr": abbr} for team_id, name, abbr in teams}, indent=2
    ), encoding="utf-8")
    out_path.with_suffix(".provenance.json").write_text(json.dumps(meta,indent=2)+"\n",encoding="utf-8")
    return meta


if __name__ == "__main__":
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--output", default="ml/local/nba-games.csv")
    p.add_argument("--start-season", type=int, default=2024)
    p.add_argument("--end-season", type=int, default=2026)
    args = p.parse_args()
    print(json.dumps(download(args.output,args.start_season,args.end_season),indent=2))
