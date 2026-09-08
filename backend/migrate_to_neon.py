"""
migrate_to_neon.py — one-time script to load backend/data/*.json (the current
live data, since Cloud SQL is turned off) into a new Neon Postgres database.

Usage:
    Set TARGET_DATABASE_URI in backend/.env (see .env.example), then run:
        python migrate_to_neon.py

The script creates the schema on Neon (if not already present), loads
teams -> players -> results in FK-safe order, and resets the Postgres
identity sequences so future inserts don't collide with the loaded IDs.
"""

import os
import json
from datetime import date
from dotenv import load_dotenv

load_dotenv()

TARGET_URI = os.environ.get("TARGET_DATABASE_URI")

if not TARGET_URI:
    raise SystemExit("Set TARGET_DATABASE_URI (new Neon) in backend/.env")

from sqlalchemy import create_engine, text
from models import db, Team, Player, Result

target_engine = create_engine(TARGET_URI)

DATA_DIR = os.path.join(os.path.dirname(__file__), 'data')

TABLES_IN_ORDER = [
    ("teams", Team, "teams.json"),
    ("players", Player, "players.json"),
    ("results", Result, "results.json"),
]


def load_json(filename):
    with open(os.path.join(DATA_DIR, filename)) as f:
        return json.load(f)


def load_table(table_name, model, filename):
    rows = load_json(filename)
    if not rows:
        print(f"  {table_name}: 0 rows (nothing to load)")
        return

    if table_name == "results":
        for r in rows:
            r["date"] = date.fromisoformat(r["date"])

    table = model.__table__
    with target_engine.begin() as tgt:
        tgt.execute(table.delete())
        tgt.execute(table.insert(), rows)

    print(f"  {table_name}: loaded {len(rows)} rows")


def reset_sequence(table_name):
    with target_engine.begin() as tgt:
        tgt.execute(text(
            f"SELECT setval(pg_get_serial_sequence('{table_name}', 'id'), "
            f"COALESCE((SELECT MAX(id) FROM {table_name}), 1))"
        ))


print("Creating schema on Neon (if needed)...")
db.metadata.create_all(bind=target_engine)

print("Loading data from backend/data/*.json...")
for name, model, filename in TABLES_IN_ORDER:
    load_table(name, model, filename)

print("Resetting sequences...")
for name, _, _ in TABLES_IN_ORDER:
    reset_sequence(name)

print("Done. Verify row counts, then point the app at TARGET_DATABASE_URI.")
