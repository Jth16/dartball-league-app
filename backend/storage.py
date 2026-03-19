"""
storage.py — unified CRUD abstraction for teams, players, and results.

Set STORAGE_BACKEND=json  to use JSON files in backend/data/*.json.
Set STORAGE_BACKEND=sql   (or omit) to use SQLAlchemy / PostgreSQL.
"""

import os
import json
import threading

STORAGE_BACKEND = os.environ.get('STORAGE_BACKEND', 'sql')
DATA_DIR = os.path.join(os.path.dirname(__file__), 'data')

# single in-process lock; protects all JSON file reads+writes
_lock = threading.Lock()


# ── JSON helpers ──────────────────────────────────────────────────────────────

def _load(entity):
    with open(os.path.join(DATA_DIR, f'{entity}.json')) as f:
        return json.load(f)


def _save(entity, data):
    with open(os.path.join(DATA_DIR, f'{entity}.json'), 'w') as f:
        json.dump(data, f, indent=2, default=str)


def _next_id(records):
    return max((r['id'] for r in records), default=0) + 1


# ── Teams ─────────────────────────────────────────────────────────────────────

def get_teams():
    if STORAGE_BACKEND == 'json':
        with _lock:
            return list(_load('teams'))
    from models import Team
    return [_team_dict(t) for t in Team.query.all()]


def get_team_by_id(team_id):
    if STORAGE_BACKEND == 'json':
        with _lock:
            teams = _load('teams')
        return next((t for t in teams if t['id'] == team_id), None)
    from models import Team
    t = Team.query.get(team_id)
    return _team_dict(t) if t else None


def add_team(name):
    if STORAGE_BACKEND == 'json':
        with _lock:
            teams = _load('teams')
            new_team = {
                'id': _next_id(teams), 'name': name,
                'wins': 0, 'losses': 0,
                'win_pct': 0.0, 'games_behind': 0.0, 'games_played': 0,
            }
            teams.append(new_team)
            _save('teams', teams)
        return new_team
    from models import db, Team
    t = Team(name=name, wins=0, losses=0, games_behind=0)
    db.session.add(t)
    db.session.commit()
    return {'id': t.id, 'name': t.name}


def update_team_record(team_id, wins_inc, losses_inc, games_behind=None):
    """Increment wins/losses and recompute win_pct/games_played. Returns updated team dict or None."""
    if STORAGE_BACKEND == 'json':
        with _lock:
            teams = _load('teams')
            team = next((t for t in teams if t['id'] == team_id), None)
            if team is None:
                return None
            team['wins'] = (team.get('wins') or 0) + wins_inc
            team['losses'] = (team.get('losses') or 0) + losses_inc
            team['games_played'] = (team.get('games_played') or 0) + wins_inc + losses_inc
            gp = team['games_played']
            team['win_pct'] = round(float(team['wins']) / gp * 100.0, 3) if gp > 0 else 0.0
            if games_behind is not None:
                team['games_behind'] = float(games_behind)
            _save('teams', teams)
        return team
    from models import db, Team
    team = Team.query.get(team_id)
    if team is None:
        return None
    team.wins = (team.wins or 0) + wins_inc
    team.losses = (team.losses or 0) + losses_inc
    team.games_played = (team.games_played or 0) + wins_inc + losses_inc
    gp = team.games_played or 0
    team.win_pct = float(team.wins) / gp * 100.0 if gp > 0 else 0.0
    if games_behind is not None:
        team.games_behind = float(games_behind)
    db.session.add(team)
    db.session.commit()
    return _team_dict(team)


def delete_team(team_id):
    """Remove team and cascade-delete its players. Returns deleted team dict or None."""
    if STORAGE_BACKEND == 'json':
        with _lock:
            teams = _load('teams')
            team = next((t for t in teams if t['id'] == team_id), None)
            if team is None:
                return None
            _save('teams', [t for t in teams if t['id'] != team_id])
            players = _load('players')
            _save('players', [p for p in players if p.get('team_id') != team_id])
        return team
    from models import db, Team, Player
    team = Team.query.get(team_id)
    if team is None:
        return None
    Player.query.filter_by(team_id=team.id).delete()
    db.session.delete(team)
    db.session.commit()
    return {'id': team_id}


def _team_dict(t):
    return {
        'id': t.id, 'name': t.name,
        'wins': t.wins or 0, 'losses': t.losses or 0,
        'win_pct': t.win_pct or 0.0,
        'games_behind': t.games_behind or 0.0,
        'games_played': t.games_played or 0,
    }


# ── Players ───────────────────────────────────────────────────────────────────

def get_players(team_id=None, limit=500):
    if STORAGE_BACKEND == 'json':
        with _lock:
            players = _load('players')
        if team_id is not None:
            players = [p for p in players if p.get('team_id') == team_id]
        players.sort(key=lambda p: p['id'])
        return players[:limit]
    from models import Player
    q = Player.query
    if team_id is not None:
        q = q.filter_by(team_id=team_id)
    return [_player_dict(p) for p in q.order_by(Player.id).all()]


def search_players(q_str, team_id=None, limit=200):
    if STORAGE_BACKEND == 'json':
        with _lock:
            players = _load('players')
        if team_id is not None:
            players = [p for p in players if p.get('team_id') == team_id]
        if q_str:
            players = [p for p in players if q_str.lower() in (p.get('name') or '').lower()]
        players.sort(key=lambda p: p['id'])
        return players[:limit]
    from models import Player
    q = Player.query
    if team_id is not None:
        q = q.filter_by(team_id=int(team_id))
    if q_str:
        q = q.filter(Player.name.ilike(f'%{q_str}%'))
    return [_player_dict(p) for p in q.order_by(Player.id).limit(limit).all()]


def add_player(name, team_id):
    if STORAGE_BACKEND == 'json':
        with _lock:
            players = _load('players')
            new_player = {
                'id': _next_id(players), 'name': name, 'team_id': team_id,
                'Singles': 0, 'Doubles': 0, 'Triples': 0, 'Dimes': 0, 'HRs': 0,
                'Avg': 0.0, 'GP': 0, 'AtBats': 0, 'hits': 0,
            }
            players.append(new_player)
            _save('players', players)
        return new_player
    from models import db, Player
    p = Player(name=name, team_id=team_id, Singles=0, Doubles=0, Triples=0,
               Dimes=0, HRs=0, Avg=0.0, GP=0, AtBats=0)
    db.session.add(p)
    db.session.commit()
    return {'id': p.id, 'name': p.name, 'team_id': p.team_id}


def update_player(player_id, increments):
    """Apply incremental stat updates to a player.

    increments: dict with optional int keys Singles, Doubles, Triples, Dimes, HRs, AtBats
                and optional str key 'name'.
    Increments GP by 1 per call. Recomputes hits and Avg.
    Returns updated player dict or None if not found.
    """
    if STORAGE_BACKEND == 'json':
        with _lock:
            players = _load('players')
            player = next((p for p in players if p['id'] == player_id), None)
            if player is None:
                return None
            for field in ('Singles', 'Doubles', 'Triples', 'Dimes', 'HRs', 'AtBats'):
                player[field] = (player.get(field) or 0) + increments.get(field, 0)
            hits_inc = sum(increments.get(f, 0) for f in ('Singles', 'Doubles', 'Triples', 'HRs'))
            player['hits'] = (player.get('hits') or 0) + hits_inc
            player['GP'] = (player.get('GP') or 0) + 1
            ab = player.get('AtBats') or 0
            player['Avg'] = round(float(player['hits']) / ab, 3) if ab > 0 else 0.0
            if 'name' in increments:
                player['name'] = increments['name']
            _save('players', players)
        return player
    from models import db, Player
    player = Player.query.get(player_id)
    if player is None:
        return None
    for field in ('Singles', 'Doubles', 'Triples', 'Dimes', 'HRs', 'AtBats'):
        setattr(player, field, (getattr(player, field, 0) or 0) + increments.get(field, 0))
    hits_inc = sum(increments.get(f, 0) for f in ('Singles', 'Doubles', 'Triples', 'HRs'))
    player.hits = (player.hits or 0) + hits_inc
    player.GP = (player.GP or 0) + 1
    ab = player.AtBats or 0
    player.Avg = float(player.hits) / ab if ab > 0 else 0.0
    if 'name' in increments:
        player.name = increments['name']
    db.session.add(player)
    db.session.commit()
    return _player_dict(player)


def _player_dict(p):
    return {
        'id': p.id, 'name': p.name, 'team_id': p.team_id,
        'Singles': p.Singles, 'Doubles': p.Doubles, 'Triples': p.Triples,
        'Dimes': p.Dimes, 'HRs': p.HRs, 'GP': p.GP,
        'AtBats': p.AtBats, 'Avg': p.Avg, 'hits': p.hits or 0,
    }


# ── Results ───────────────────────────────────────────────────────────────────

def get_results(date=None, team_id=None, limit=500):
    """Return enriched result dicts including team1_name and team2_name.

    date: Python date object or None (routes.py handles parsing / error responses).
    """
    if STORAGE_BACKEND == 'json':
        date_str = date.isoformat() if date else None
        with _lock:
            results = list(_load('results'))
            teams = _load('teams')
        teams_map = {t['id']: t.get('name', f"Team {t['id']}") for t in teams}
        if date_str:
            results = [r for r in results if r.get('date') == date_str]
        if team_id is not None:
            results = [r for r in results
                       if r.get('team1_id') == team_id or r.get('team2_id') == team_id]
        # date descending, game_number ascending
        results.sort(key=lambda r: (r.get('date', ''), -r.get('game_number', 0)), reverse=True)
        results = results[:limit]
        return [
            {**r,
             'team1_name': teams_map.get(r.get('team1_id')),
             'team2_name': teams_map.get(r.get('team2_id'))}
            for r in results
        ]
    from models import Team, Result
    q = Result.query
    if date is not None:
        q = q.filter(Result.date == date)
    if team_id is not None:
        q = q.filter((Result.team1_id == team_id) | (Result.team2_id == team_id))
    rows = q.order_by(Result.date.desc(), Result.game_number.asc()).limit(limit).all()
    teams_map = {t.id: (t.name or f"Team {t.id}") for t in Team.query.all()}
    return [
        {
            'id': r.id,
            'date': r.date.isoformat() if r.date else None,
            'game_number': r.game_number,
            'team1_id': r.team1_id,
            'team1_name': teams_map.get(r.team1_id),
            'team2_id': r.team2_id,
            'team2_name': teams_map.get(r.team2_id),
            'team1_score': r.team1_score,
            'team2_score': r.team2_score,
        }
        for r in rows
    ]


def add_results(date, team1_id, team2_id, games):
    """Append result records for a matchup.

    date:   Python date object.
    games:  list of dicts with game_number, team1_score, team2_score.
    Returns list of created record dicts.
    """
    date_str = date.isoformat()
    if STORAGE_BACKEND == 'json':
        with _lock:
            results = _load('results')
            created = []
            for g in games:
                new_result = {
                    'id': _next_id(results),
                    'date': date_str,
                    'game_number': g['game_number'],
                    'team1_id': team1_id,
                    'team2_id': team2_id,
                    'team1_score': g['team1_score'],
                    'team2_score': g['team2_score'],
                }
                results.append(new_result)
                created.append(dict(new_result))
            _save('results', results)
        return created
    from models import db, Result
    to_create = [
        Result(
            date=date,
            game_number=g['game_number'],
            team1_id=team1_id,
            team2_id=team2_id,
            team1_score=g['team1_score'],
            team2_score=g['team2_score'],
        )
        for g in games
    ]
    db.session.add_all(to_create)
    db.session.commit()
    return [
        {
            'id': r.id,
            'date': r.date.isoformat(),
            'game_number': r.game_number,
            'team1_id': r.team1_id,
            'team2_id': r.team2_id,
            'team1_score': r.team1_score,
            'team2_score': r.team2_score,
        }
        for r in to_create
    ]


# ── Admin / health ────────────────────────────────────────────────────────────

def json_status():
    """Return file existence and record counts for each JSON data file."""
    status = {}
    for entity in ('teams', 'players', 'results'):
        path = os.path.join(DATA_DIR, f'{entity}.json')
        try:
            with open(path) as f:
                data = json.load(f)
            status[entity] = {'exists': True, 'count': len(data)}
        except Exception as e:
            status[entity] = {'exists': False, 'error': str(e)}
    return status
