from flask import Blueprint, jsonify, request, current_app
from flask_cors import cross_origin
import os, re, time
import storage

routes = Blueprint("routes", __name__)


# simple request logging
@routes.before_app_request
def _log_request():
    try:
        current_app.logger.info("Incoming request: %s %s from %s args=%s json_keys=%s",
                                request.method, request.path, request.remote_addr,
                                dict(request.args),
                                list(request.get_json(silent=True).keys()) if request.get_json(silent=True) else None)
    except Exception:
        current_app.logger.exception("request logging failed")


@routes.before_app_request
def allow_preflight():
    if request.method == 'OPTIONS':
        return ('', 200)


@routes.route("/routes/teams", methods=["GET"])
def get_teams():
    try:
        teams = storage.get_teams()
        result = []
        for t in teams:
            result.append({
                "id": t["id"],
                "name": t["name"],
                "wins": t.get("wins", 0),
                "losses": t.get("losses", 0),
                "games_played": t.get("games_played", 0),
                "win_pct": round(float(t.get("win_pct") or 0), 3),
            })
        return jsonify(result)
    except Exception:
        current_app.logger.exception("get_teams failed")
        return jsonify({"error": "internal"}), 500


@routes.route('/routes/admin/add_team', methods=['POST', 'OPTIONS'])
@cross_origin(headers=['Content-Type', 'X-Download-Token'])
def add_team():
    if request.method == 'OPTIONS':
        return ('', 200)
    data = request.json or {}
    current_app.logger.info("add_team called payload=%s remote=%s", data, request.remote_addr)
    name = data.get('name')
    if not name:
        current_app.logger.warning("add_team missing name")
        return jsonify({'message': 'Team name is required'}), 400
    try:
        new_team = storage.add_team(name)
        current_app.logger.info("add_team created id=%s name=%s", new_team['id'], new_team['name'])
        return jsonify({'message': 'Team added successfully', 'team': {'id': new_team['id'], 'name': new_team['name']}}), 201
    except Exception:
        current_app.logger.exception("add_team failed")
        return jsonify({'message': 'Internal server error'}), 500


@routes.route('/routes/admin/add_player', methods=['POST', 'OPTIONS'])
@cross_origin(headers=['Content-Type', 'X-Download-Token'])
def add_player():
    if request.method == 'OPTIONS':
        return ('', 200)
    data = request.json or {}
    current_app.logger.info("add_player called payload=%s remote=%s", data, request.remote_addr)
    name = data.get('name')
    team_id = data.get('team_id')
    if not name or not team_id:
        current_app.logger.warning("add_player missing name/team_id")
        return jsonify({'message': 'Player name and team are required'}), 400
    try:
        new_player = storage.add_player(name, int(team_id))
        current_app.logger.info("add_player created id=%s name=%s team_id=%s",
                                new_player['id'], new_player['name'], new_player['team_id'])
        return jsonify({'message': 'Player added successfully',
                        'player': {'id': new_player['id'], 'name': new_player['name'],
                                   'team_id': new_player['team_id']}}), 201
    except Exception:
        current_app.logger.exception("add_player failed")
        return jsonify({'message': 'Internal server error'}), 500


@routes.route("/routes/admin/db_status", methods=["GET"])
def admin_db_status():
    token = os.environ.get("DOWNLOAD_TOKEN")
    header = request.headers.get("X-Download-Token")
    if token and header != token:
        return ("", 403)

    backend = storage.STORAGE_BACKEND

    if backend == 'json':
        file_status = storage.json_status()
        return jsonify({
            "storage_backend": "json",
            "data_dir": storage.DATA_DIR,
            "files": file_status,
            "timestamp": time.time(),
        })

    # SQL mode
    from models import db
    from sqlalchemy import text

    uri = current_app.config.get("SQLALCHEMY_DATABASE_URI", "")
    try:
        masked = re.sub(r"(://[^:]+:)([^@]+)(@)", r"\1****\3", uri)
    except Exception:
        masked = uri

    cloud_conn = os.environ.get("CLOUD_SQL_CONNECTION_NAME") or os.environ.get("CLOUDSQL_INSTANCE") or ""
    socket_path = f"/cloudsql/{cloud_conn}" if cloud_conn else None
    socket_exists = socket_path and os.path.exists(socket_path)

    db_ok = False
    error = None
    try:
        with db.engine.connect() as conn:
            conn.execute(text("SELECT 1"))
            db_ok = True
    except Exception as ex:
        error = str(ex)[:1000]

    return jsonify({
        "storage_backend": "sql",
        "sqlalchemy_uri": masked,
        "cloud_sql_connection_name": cloud_conn,
        "cloudsql_socket_path": socket_path,
        "cloudsql_socket_exists": bool(socket_exists),
        "db_connect_ok": bool(db_ok),
        "last_error": error,
        "timestamp": time.time(),
    })


@routes.route('/routes/admin/delete_team', methods=['DELETE', 'OPTIONS'])
@cross_origin(headers=['Content-Type', 'X-Download-Token'])
def delete_team():
    if request.method == 'OPTIONS':
        return ('', 200)

    data = request.get_json(silent=True) or {}
    team_id = data.get('team_id') or request.args.get('team_id')
    if not team_id:
        return jsonify({'message': 'team_id is required'}), 400

    try:
        result = storage.delete_team(int(team_id))
        if result is None:
            return jsonify({'message': 'team not found'}), 404
        current_app.logger.info("delete_team removed id=%s", team_id)
        return jsonify({'message': 'Team deleted successfully', 'team_id': int(team_id)}), 200
    except Exception as ex:
        current_app.logger.exception("delete_team failed: %s", ex)
        return jsonify({'message': 'Internal server error', 'error': str(ex)}), 500


@routes.route('/routes/admin/update_player', methods=['POST', 'OPTIONS'])
@cross_origin(headers=['Content-Type', 'X-Download-Token'])
def update_player():
    if request.method == 'OPTIONS':
        return ('', 200)

    data = request.get_json(silent=True) or {}
    player_id = data.get('player_id') or request.args.get('player_id')
    if not player_id:
        return jsonify({'message': 'player_id is required'}), 400

    def to_int(v):
        try:
            return int(v)
        except Exception:
            return 0

    increments = {
        'Singles': to_int(data.get('Singles', 0)),
        'Doubles': to_int(data.get('Doubles', 0)),
        'Triples': to_int(data.get('Triples', 0)),
        'Dimes':   to_int(data.get('Dimes', 0)),
        'HRs':     to_int(data.get('HRs', 0)),
        'AtBats':  to_int(data.get('AtBats', 0)),
    }
    if 'name' in data:
        increments['name'] = data['name']

    try:
        player = storage.update_player(int(player_id), increments)
        if player is None:
            return jsonify({'message': 'player not found'}), 404
        current_app.logger.info("update_player updated id=%s hits=%s atbats=%s gp=%s",
                                player['id'], player.get('hits'), player.get('AtBats'), player.get('GP'))
        return jsonify({'message': 'Player updated', 'player': player}), 200
    except Exception as ex:
        current_app.logger.exception("update_player failed: %s", ex)
        return jsonify({'message': 'Internal server error', 'error': str(ex)}), 500


@routes.route('/routes/admin/update_team_record', methods=['POST', 'OPTIONS'])
@cross_origin(headers=['Content-Type', 'X-Download-Token'])
def update_team_record():
    if request.method == 'OPTIONS':
        return ('', 200)

    data = request.get_json(silent=True) or {}
    current_app.logger.info("update_team_record called payload=%s remote=%s", data, request.remote_addr)

    team_id = data.get('team_id') or request.args.get('team_id')
    if not team_id:
        current_app.logger.warning("update_team_record missing team_id")
        return jsonify({'message': 'team_id is required'}), 400

    def to_int(v):
        try:
            return int(v)
        except Exception:
            return 0

    wins_inc = to_int(data.get('wins', 0))
    losses_inc = to_int(data.get('losses', 0))
    games_behind = data.get('games_behind')
    try:
        if games_behind is not None:
            games_behind = float(games_behind)
    except Exception:
        current_app.logger.warning("update_team_record invalid games_behind value=%s", games_behind)
        games_behind = None

    try:
        team = storage.update_team_record(int(team_id), wins_inc, losses_inc, games_behind)
        if team is None:
            current_app.logger.warning("update_team_record team not found id=%s", team_id)
            return jsonify({'message': 'team not found'}), 404

        current_app.logger.info("update_team_record updated id=%s wins=%s losses=%s gp=%s win_pct=%s gb=%s",
                                team.get('id'), team.get('wins'), team.get('losses'),
                                team.get('games_played'), team.get('win_pct'), team.get('games_behind'))
        return jsonify({'message': 'Team record updated', 'team': team}), 200
    except Exception as ex:
        current_app.logger.exception("update_team_record failed: %s", ex)
        return jsonify({'message': 'Internal server error', 'error': str(ex)}), 500


@routes.route('/routes/players', methods=['GET', 'OPTIONS'])
@cross_origin(headers=['Content-Type', 'X-Download-Token'])
def get_players():
    if request.method == 'OPTIONS':
        return ('', 200)

    try:
        team_id = request.args.get('team_id', None)
        if team_id:
            try:
                team_id = int(team_id)
            except ValueError:
                return jsonify({'message': 'invalid team_id'}), 400

        players = storage.get_players(team_id=team_id)
        return jsonify(players), 200
    except Exception as ex:
        current_app.logger.exception("get_players failed: %s", ex)
        return jsonify({'message': 'Internal server error', 'error': str(ex)}), 500


@routes.route('/routes/players/search', methods=['GET', 'OPTIONS'])
@cross_origin(headers=['Content-Type', 'X-Download-Token'])
def search_players():
    if request.method == 'OPTIONS':
        return ('', 200)

    try:
        q = (request.args.get('q') or '').strip()
        team_id = request.args.get('team_id', None)
        if team_id:
            try:
                team_id = int(team_id)
            except ValueError:
                return jsonify({'message': 'invalid team_id'}), 400
        try:
            limit = int(request.args.get('limit') or 200)
        except Exception:
            limit = 200

        players = storage.search_players(q, team_id=team_id, limit=limit)
        return jsonify(players), 200
    except Exception as ex:
        current_app.logger.exception("search_players failed: %s", ex)
        return jsonify({'message': 'Internal server error', 'error': str(ex)}), 500


@routes.route('/routes/results/batch', methods=['POST', 'OPTIONS'])
@cross_origin(headers=['Content-Type', 'X-Download-Token'])
def create_results_batch():
    if request.method == 'OPTIONS':
        return ('', 200)

    data = request.get_json(silent=True) or {}
    current_app.logger.info("create_results_batch payload=%s remote=%s", data, request.remote_addr)

    required = ['date', 'team1_id', 'team2_id', 'games']
    missing = [k for k in required if k not in data]
    if missing:
        return jsonify({'message': 'missing fields', 'fields': missing}), 400

    # parse date
    date_raw = str(data.get('date', '')).strip()
    parsed_date = None
    for fmt in ('%Y-%m-%d', '%m/%d/%Y', '%m-%d-%Y'):
        try:
            from datetime import datetime
            parsed_date = datetime.strptime(date_raw, fmt).date()
            break
        except Exception:
            continue
    if parsed_date is None:
        try:
            parsed_date = __import__('datetime').datetime.fromisoformat(date_raw).date()
        except Exception:
            return jsonify({'message': 'invalid date format', 'value': date_raw}), 400

    try:
        team1_id = int(data['team1_id'])
        team2_id = int(data['team2_id'])
    except Exception as ex:
        return jsonify({'message': 'invalid team ids', 'error': str(ex)}), 400

    if team1_id == team2_id:
        return jsonify({'message': 'team1_id and team2_id must be different'}), 400

    # verify teams exist
    t1 = storage.get_team_by_id(team1_id)
    t2 = storage.get_team_by_id(team2_id)
    if not t1 or not t2:
        return jsonify({'message': 'one or both teams not found'}), 400

    games = data.get('games')
    if not isinstance(games, list) or len(games) == 0:
        return jsonify({'message': 'games must be a non-empty array'}), 400
    if len(games) > 20:
        return jsonify({'message': 'too many games in batch'}), 400

    validated_games = []
    for g in games:
        if not isinstance(g, dict):
            return jsonify({'message': 'each game must be an object'}), 400
        if 'game_number' not in g or 'team1_score' not in g or 'team2_score' not in g:
            return jsonify({'message': 'game objects must include game_number, team1_score, team2_score', 'game': g}), 400
        try:
            validated_games.append({
                'game_number': int(g['game_number']),
                'team1_score': int(g['team1_score']),
                'team2_score': int(g['team2_score']),
            })
        except Exception as ex:
            return jsonify({'message': 'invalid numeric fields in game', 'error': str(ex), 'game': g}), 400

    try:
        created = storage.add_results(parsed_date, team1_id, team2_id, validated_games)
        return jsonify({'created': created}), 201
    except Exception as ex:
        current_app.logger.exception("create_results_batch failed")
        return jsonify({'message': 'Internal server error', 'error': str(ex)}), 500


@routes.route('/routes/results', methods=['GET', 'OPTIONS'])
@cross_origin(headers=['Content-Type', 'X-Download-Token'])
def get_results():
    if request.method == 'OPTIONS':
        return ('', 200)

    try:
        date_q = request.args.get('date')
        team_id = request.args.get('team_id')
        try:
            limit = int(request.args.get('limit') or 500)
        except Exception:
            limit = 500

        parsed_date = None
        if date_q:
            for fmt in ('%Y-%m-%d', '%m/%d/%Y', '%m-%d-%Y'):
                try:
                    from datetime import datetime
                    parsed_date = datetime.strptime(date_q.strip(), fmt).date()
                    break
                except Exception:
                    continue
            if parsed_date is None:
                try:
                    parsed_date = __import__('datetime').datetime.fromisoformat(date_q.strip()).date()
                except Exception:
                    return jsonify({'message': 'invalid date format', 'value': date_q}), 400

        if team_id:
            try:
                team_id = int(team_id)
            except Exception:
                return jsonify({'message': 'invalid team_id'}), 400

        results = storage.get_results(date=parsed_date, team_id=team_id, limit=limit)
        return jsonify(results), 200
    except Exception as ex:
        current_app.logger.exception("get_results failed: %s", ex)
        return jsonify({'message': 'Internal server error', 'error': str(ex)}), 500
