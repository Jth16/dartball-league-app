"""
export_to_json.py — one-time script to dump Cloud SQL tables to backend/data/*.json

Run via Cloud SQL Auth Proxy:
    1. Start proxy:  cloud-sql-proxy PROJECT:REGION:INSTANCE --port 5432
    2. Export:       SQLALCHEMY_DATABASE_URI="postgresql+psycopg2://USER:PASS@localhost:5432/DB" python export_to_json.py

Output files: backend/data/teams.json, players.json, results.json
"""

import os
import json

# ── DB connection ─────────────────────────────────────────────────────────────

uri = os.environ.get("SQLALCHEMY_DATABASE_URI")
if not uri:
    user = os.environ.get("DB_USER")
    password = os.environ.get("DB_PASS")
    dbname = os.environ.get("DB_NAME")
    conn_name = os.environ.get("CLOUD_SQL_CONNECTION_NAME") or os.environ.get("CLOUDSQL_INSTANCE")
    if user and password and dbname and conn_name:
        uri = f"postgresql+psycopg2://{user}:{password}@/{dbname}?host=/cloudsql/{conn_name}"
    else:
        raise SystemExit(
            "Set SQLALCHEMY_DATABASE_URI (or DB_USER / DB_PASS / DB_NAME / CLOUD_SQL_CONNECTION_NAME)"
        )

from sqlalchemy import create_engine, text

engine = create_engine(uri)

DATA_DIR = os.path.join(os.path.dirname(__file__), 'data')
os.makedirs(DATA_DIR, exist_ok=True)

# ── Export helpers ────────────────────────────────────────────────────────────

def export_table(table_name, out_file, row_transform=None):
    with engine.connect() as conn:
        rows = conn.execute(text(f"SELECT * FROM {table_name} ORDER BY id")).mappings().all()
    data = [dict(r) for r in rows]
    if row_transform:
        data = [row_transform(r) for r in data]
    path = os.path.join(DATA_DIR, out_file)
    with open(path, 'w') as f:
        json.dump(data, f, indent=2, default=str)
    print(f"  {out_file}: {len(data)} records → {path}")
    return data


def transform_team(row):
    return {
        "id": row["id"],
        "name": row["name"],
        "wins": int(row.get("wins") or 0),
        "losses": int(row.get("losses") or 0),
        "win_pct": float(row.get("win_pct") or 0.0),
        "games_behind": float(row.get("games_behind") or 0.0),
        "games_played": int(row.get("games_played") or 0),
    }


def transform_player(row):
    return {
        "id": row["id"],
        "name": row["name"],
        "team_id": row["team_id"],
        "Singles": int(row.get("Singles") or 0),
        "Doubles": int(row.get("Doubles") or 0),
        "Triples": int(row.get("Triples") or 0),
        "Dimes": int(row.get("Dimes") or 0),
        "HRs": int(row.get("HRs") or 0),
        "Avg": float(row.get("Avg") or 0.0),
        "GP": int(row.get("GP") or 0),
        "AtBats": int(row.get("AtBats") or 0),
        "hits": int(row.get("hits") or 0),
    }


def transform_result(row):
    date_val = row["date"]
    if hasattr(date_val, 'isoformat'):
        date_str = date_val.isoformat()
    else:
        date_str = str(date_val)
    return {
        "id": row["id"],
        "date": date_str,
        "game_number": int(row.get("game_number") or 0),
        "team1_id": row["team1_id"],
        "team2_id": row["team2_id"],
        "team1_score": int(row.get("team1_score") or 0),
        "team2_score": int(row.get("team2_score") or 0),
    }


# ── Run export ────────────────────────────────────────────────────────────────

print("Exporting database to JSON files...")
export_table("teams",   "teams.json",   transform_team)
export_table("players", "players.json", transform_player)
export_table("results", "results.json", transform_result)
print("Done. Set STORAGE_BACKEND=json and restart the server.")
