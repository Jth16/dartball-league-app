from flask import Blueprint, jsonify, request
from models import Player, Team, db

routes = Blueprint('routes', __name__)

@routes.route('/routes/teams', methods=['GET'])
def get_teams():
    teams = Team.query.all()
    return jsonify([{
        'id': team.id,
        'name': team.name,
        'wins': team.wins,
        'losses': team.losses,
        'games_behind': team.games_behind,
        'games_played': team.games_played
    } for team in teams])

@routes.route('/routes/admin/login', methods=['POST'])
def admin_login():
    data = request.json
    # Implement authentication logic here
    return jsonify({'message': 'Login successful'}), 200

@routes.route('/routes/admin/record', methods=['POST'])
def submit_record():
    data = request.json
    team_id = data.get('team_id')
    wins = int(data.get('wins', 0))
    losses = int(data.get('losses', 0))
    games_behind = float(data.get('games_behind', 0))

    team = Team.query.get(team_id)
    if team:
        team.wins = getattr(team, 'wins', 0) + wins
        team.losses = getattr(team, 'losses', 0) + losses
        team.games_behind = games_behind
        team.games_played = getattr(team, 'games_played', 0) + wins + losses
        # Calculate win percentage
        team.win_pct = team.wins / team.games_played if team.games_played > 0 else 0
        db.session.commit()
        return jsonify({
            'message': 'Record updated successfully',
            'games_played': team.games_played,
            'win_pct': team.win_pct
        }), 200
    return jsonify({'message': 'Team not found'}), 404
   

@routes.route('/routes/admin/add_team', methods=['POST'])
def add_team():
    data = request.json
    name = data.get('name')
    if not name:
        return jsonify({'message': 'Team name is required'}), 400

    new_team = Team(name=name, wins=0, losses=0, games_behind=0)
    db.session.add(new_team)
    db.session.commit()
    return jsonify({'message': 'Team added successfully', 'team': {
        'id': new_team.id,
        'name': new_team.name,
        'wins': new_team.wins,
        'losses': new_team.losses,
        'games_behind': new_team.games_behind
    }}), 201


@routes.route('/routes/players', methods=['GET'])
def get_players():
    team_id = request.args.get('team_id')
    if not team_id:
        return jsonify([])

    players = db.session.execute(
        db.select(Team).where(Team.id == int(team_id))
    ).scalars().first()
    if not players:
        return jsonify([])

    players = db.session.execute(
        db.select(Player).where(Player.team_id == int(team_id))
    ).scalars().all()

    return jsonify([
        {
            'id': p.id,
            'name': p.name,
            'Singles': p.Singles,
            'Doubles': p.Doubles,
            'Triples': p.Triples,
            'Dimes': p.Dimes,
            'HRs': p.HRs,
            'Avg': p.Avg,
            'GP': p.GP,
            'AtBats': p.AtBats
        } for p in players
    ])


@routes.route('/routes/admin/add_player', methods=['POST'])
def add_player():
    data = request.json
    name = data.get('name')
    team_id = data.get('team_id')

    if not name or not team_id:
        return jsonify({'message': 'Player name and team are required'}), 400

    new_player = Player(
        name=name,
        team_id=team_id,
        Singles=0,
        Doubles=0,
        Triples=0,
        Dimes=0,
        HRs=0,
        Avg=0.0,
        GP=0,
        AtBats=0
    )
    db.session.add(new_player)
    db.session.commit()
    return jsonify({'message': 'Player added successfully', 'player': {
        'id': new_player.id,
        'name': new_player.name,
        'team_id': new_player.team_id
    }}), 201

