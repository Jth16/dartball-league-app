from flask import Blueprint, jsonify, request, current_app
from flask_cors import cross_origin
from models import db, Team, Player
import os, re, time
from sqlalchemy import text

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

# If you have auth/token checks, make sure preflight OPTIONS requests are not blocked.
@routes.before_app_request
def allow_preflight():
    if request.method == 'OPTIONS':
        # return empty 200 so Flask-CORS can attach proper CORS headers
        return ('', 200)

@routes.route("/routes/teams", methods=["GET"])
def get_teams():
    try:
        teams = Team.query.all()
        return jsonify([{"id": t.id, "name": t.name, "wins": getattr(t, "wins", 0), "losses": getattr(t, "losses", 0)} for t in teams])
    except Exception:
        current_app.logger.exception("get_teams failed")
        return jsonify({"error": "internal"}), 500

@routes.route('/routes/admin/add_team', methods=['POST', 'OPTIONS'])
@cross_origin(headers=['Content-Type','X-Download-Token'])
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
        new_team = Team(name=name, wins=0, losses=0, games_behind=0)
        db.session.add(new_team)
        db.session.commit()
        current_app.logger.info("add_team created id=%s name=%s", new_team.id, new_team.name)
        return jsonify({'message': 'Team added successfully', 'team': {'id': new_team.id, 'name': new_team.name}}), 201
    except Exception:
        current_app.logger.exception("add_team failed")
        db.session.rollback()
        return jsonify({'message': 'Internal server error'}), 500

@routes.route('/routes/admin/add_player', methods=['POST', 'OPTIONS'])
@cross_origin(headers=['Content-Type','X-Download-Token'])
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
        new_player = Player(name=name, team_id=team_id, Singles=0, Doubles=0, Triples=0, Dimes=0, HRs=0, Avg=0.0, GP=0, AtBats=0)
        db.session.add(new_player)
        db.session.commit()
        current_app.logger.info("add_player created id=%s name=%s team_id=%s", new_player.id, new_player.name, new_player.team_id)
        return jsonify({'message': 'Player added successfully', 'player': {'id': new_player.id, 'name': new_player.name, 'team_id': new_player.team_id}}), 201
    except Exception:
        current_app.logger.exception("add_player failed")
        db.session.rollback()
        return jsonify({'message': 'Internal server error'}), 500

@routes.route("/routes/admin/db_status", methods=["GET"])
def admin_db_status():
    # optional token protection (matches other admin routes)
    token = os.environ.get("DOWNLOAD_TOKEN")
    header = request.headers.get("X-Download-Token")
    if token and header != token:
        return ("", 403)

    uri = current_app.config.get("SQLALCHEMY_DATABASE_URI", "")
    # mask password in URI for safe logs/response
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
        # test a simple DB connection using the app's SQLAlchemy engine
        with db.engine.connect() as conn:
            conn.execute(text("SELECT 1"))
            db_ok = True
    except Exception as ex:
        error = str(ex)[:1000]

    return jsonify({
        "sqlalchemy_uri": masked,
        "cloud_sql_connection_name": cloud_conn,
        "cloudsql_socket_path": socket_path,
        "cloudsql_socket_exists": bool(socket_exists),
        "db_connect_ok": bool(db_ok),
        "last_error": error,
        "timestamp": time.time()
    })

@routes.route('/routes/admin/delete_team', methods=['DELETE', 'OPTIONS'])
@cross_origin(headers=['Content-Type', 'X-Download-Token'])
def delete_team():
    # short-circuit preflight
    if request.method == 'OPTIONS':
        return ('', 200)

    data = request.get_json(silent=True) or {}
    team_id = data.get('team_id') or request.args.get('team_id')
    if not team_id:
        return jsonify({'message': 'team_id is required'}), 400

    try:
        team = Team.query.get(int(team_id))
        if not team:
            return jsonify({'message': 'team not found'}), 404

        # delete related players (cascade if not configured)
        try:
            Player.query.filter_by(team_id=team.id).delete()
        except Exception:
            # continue; some schemas may cascade automatically
            current_app.logger.info("delete_team: no players deleted or cascade handled by DB")

        db.session.delete(team)
        db.session.commit()

        current_app.logger.info("delete_team removed id=%s name=%s", team.id, team.name)
        return jsonify({'message': 'Team deleted successfully', 'team_id': team.id}), 200

    except Exception as ex:
        current_app.logger.exception("delete_team failed: %s", ex)
        db.session.rollback()
        return jsonify({'message': 'Internal server error', 'error': str(ex)}), 500

@routes.route('/routes/admin/update_player', methods=['POST', 'OPTIONS'])
@cross_origin(headers=['Content-Type', 'X-Download-Token'])
def update_player():
    # allow preflight
    if request.method == 'OPTIONS':
        return ('', 200)

    data = request.get_json(silent=True) or {}
    player_id = data.get('player_id') or request.args.get('player_id')
    if not player_id:
        return jsonify({'message': 'player_id is required'}), 400

    try:
        player = Player.query.get(int(player_id))
        if not player:
            return jsonify({'message': 'player not found'}), 404

        # list of allowed updatable fields (adjust names to match your model)
        allowed_fields = [
            'name',
            'Singles', 'Doubles', 'Triples', 'Dimes', 'HRs',
            'GP', 'AtBats', 'Avg'
        ]

        updated = {}
        for key in allowed_fields:
            if key in data:
                val = data[key]
                # coerce numeric fields where appropriate
                if key in ('Singles', 'Doubles', 'Triples', 'Dimes', 'HRs', 'GP', 'AtBats'):
                    try:
                        val = int(val)
                    except Exception:
                        val = 0
                elif key == 'Avg':
                    try:
                        val = float(val)
                    except Exception:
                        val = 0.0
                setattr(player, key, val)
                updated[key] = val

        # Optionally recompute Avg if AtBats and hit counts are present in model logic.
        db.session.add(player)
        db.session.commit()

        current_app.logger.info("update_player updated id=%s fields=%s", player.id, list(updated.keys()))
        # serialize a minimal player object for response
        player_json = {k: getattr(player, k, None) for k in ['id', 'name', 'Singles', 'Doubles', 'Triples', 'Dimes', 'HRs', 'GP', 'AtBats', 'Avg']}
        return jsonify({'message': 'Player updated', 'player': player_json}), 200

    except Exception as ex:
        current_app.logger.exception("update_player failed: %s", ex)
        db.session.rollback()
        return jsonify({'message': 'Internal server error', 'error': str(ex)}), 500

