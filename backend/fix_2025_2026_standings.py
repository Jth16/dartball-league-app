"""
fix_2025_2026_standings.py — one-time correction for the "2025-2026 Season"
archive.

archive_season() originally copied Team.wins/losses/win_pct/games_played
verbatim, but those stored fields were stale (only 33-36 games recorded)
compared to the true 96-game season reflected in the results table — the
live site never trusted those stored fields either; TeamsTable.jsx always
recomputes standings from results. This recomputes archived_teams for
2025-2026 Season from the already-archived regular-season game log
(archived_results where round_label IS NULL) and updates the rows in place.

Usage: set TARGET_DATABASE_URI in backend/.env, then run:
    python fix_2025_2026_standings.py
"""

import os
from dotenv import load_dotenv

load_dotenv()

TARGET_URI = os.environ.get("TARGET_DATABASE_URI")
if not TARGET_URI:
    raise SystemExit("Set TARGET_DATABASE_URI in backend/.env")

from flask import Flask
from models import db, ArchivedTeam, ArchivedResult

app = Flask(__name__)
app.config["SQLALCHEMY_DATABASE_URI"] = TARGET_URI
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
db.init_app(app)

SEASON = "2025-2026 Season"

with app.app_context():
    results = ArchivedResult.query.filter_by(season=SEASON).filter(ArchivedResult.round_label.is_(None)).all()
    print(f"Recomputing standings from {len(results)} regular-season games...")

    stats = {}
    for r in results:
        for name in (r.team1_name, r.team2_name):
            stats.setdefault(name, {'wins': 0, 'losses': 0, 'games_played': 0})
        stats[r.team1_name]['games_played'] += 1
        stats[r.team2_name]['games_played'] += 1
        s1, s2 = r.team1_score or 0, r.team2_score or 0
        if s1 > s2:
            stats[r.team1_name]['wins'] += 1
            stats[r.team2_name]['losses'] += 1
        elif s2 > s1:
            stats[r.team2_name]['wins'] += 1
            stats[r.team1_name]['losses'] += 1

    for s in stats.values():
        gp = s['games_played']
        s['win_pct'] = (s['wins'] / gp * 100.0) if gp > 0 else 0.0

    leader = max(stats.values(), key=lambda s: (s['win_pct'], s['wins']))
    for s in stats.values():
        s['games_behind'] = ((leader['wins'] - s['wins']) + (s['losses'] - leader['losses'])) / 2.0

    teams = ArchivedTeam.query.filter_by(season=SEASON).all()
    for t in teams:
        s = stats.get(t.name)
        if s is None:
            print(f"  WARNING: no results found for archived team {t.name!r} — leaving as-is")
            continue
        t.wins, t.losses, t.games_played = s['wins'], s['losses'], s['games_played']
        t.win_pct, t.games_behind = s['win_pct'], s['games_behind']
        print(f"  {t.name:22s} W{t.wins:3d} L{t.losses:3d} GP{t.games_played:3d} pct{t.win_pct:.3f} gb{t.games_behind:.1f}")

    db.session.commit()
    print("Done.")
