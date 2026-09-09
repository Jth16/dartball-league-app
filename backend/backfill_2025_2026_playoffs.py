"""
backfill_2025_2026_playoffs.py — one-time script to backfill playoff series
results for the "2025-2026 Season" archive.

Playoff games were never recorded through the normal results flow (they only
ever existed as hardcoded JSX in newfrontend/src/components/Home.jsx and
Playoffs.jsx), so archive_season() had nothing to copy for them. This adds
the 7 playoff-series rows (series win-loss, not individual games) by hand,
transcribed from those two components. The 3rd place game (BBD vs KGB) is
omitted — no score exists anywhere in the code for it.

Usage: set TARGET_DATABASE_URI in backend/.env, then run:
    python backfill_2025_2026_playoffs.py
"""

import os
from datetime import date
from dotenv import load_dotenv

load_dotenv()

TARGET_URI = os.environ.get("TARGET_DATABASE_URI")
if not TARGET_URI:
    raise SystemExit("Set TARGET_DATABASE_URI in backend/.env")

from flask import Flask
from models import db, ArchivedResult

app = Flask(__name__)
app.config["SQLALCHEMY_DATABASE_URI"] = TARGET_URI
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
db.init_app(app)

SEASON = "2025-2026 Season"

# (date, round_label, team1, score1, team2, score2) — transcribed from the
# Playoffs.jsx bracket + Home.jsx recap headlines/tables.
SERIES = [
    (date(2026, 3, 16), "Round 1", "BBD", 3, "Labelle Firehall", 0),
    (date(2026, 3, 16), "Round 1", "Softball Dad's", 3, "Prince of Dartness", 1),
    (date(2026, 3, 16), "Round 1", "Tipsy Tossers", 3, "Hillbillies", 1),
    (date(2026, 3, 16), "Round 1", "KGB", 3, "The Old & the New", 2),
    (date(2026, 3, 18), "Semifinal", "Tipsy Tossers", 3, "KGB", 2),
    (date(2026, 3, 18), "Semifinal", "Softball Dad's", 3, "BBD", 2),
    (date(2026, 3, 21), "Championship", "Softball Dad's", 4, "Tipsy Tossers", 2),
]

with app.app_context():
    existing = ArchivedResult.query.filter_by(season=SEASON).filter(ArchivedResult.round_label.isnot(None)).count()
    if existing:
        raise SystemExit(f"{existing} playoff rows already exist for {SEASON!r} — aborting to avoid duplicates")

    for i, (d, round_label, t1, s1, t2, s2) in enumerate(SERIES, start=1):
        db.session.add(ArchivedResult(
            season=SEASON, date=d, game_number=i, round_label=round_label,
            team1_name=t1, team1_score=s1, team2_name=t2, team2_score=s2,
        ))
    db.session.commit()
    print(f"Inserted {len(SERIES)} playoff series rows for {SEASON!r}")
