from flask_sqlalchemy import SQLAlchemy

# single SQLAlchemy instance for the whole app — do NOT pass app here
db = SQLAlchemy()

class Team(db.Model):
    __tablename__ = "teams"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String, nullable=False)
    wins = db.Column(db.Integer, default=0)
    losses = db.Column(db.Integer, default=0)
    win_pct = db.Column(db.Float, default=0.0)
    games_behind = db.Column(db.Float, default=0.0)
    games_played = db.Column(db.Integer, default=0)

    def __repr__(self):
        return f"<Team {self.name}: W-{self.wins} L-{self.losses} GB-{self.games_behind}> GP-{self.games_played}"

class Player(db.Model):
    __tablename__ = "players"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String, nullable=False)
    team_id = db.Column(db.Integer, db.ForeignKey('teams.id'))
    Singles = db.Column(db.Integer, default=0)
    Doubles = db.Column(db.Integer, default=0)
    Triples = db.Column(db.Integer, default=0)
    Dimes = db.Column(db.Integer, default=0)
    HRs = db.Column(db.Integer, default=0)
    Avg = db.Column(db.Float, default=0.0)
    GP = db.Column(db.Integer, default=0)
    AtBats = db.Column(db.Integer, default=0)
    hits = db.Column(db.Integer, nullable=False, default=0)

    team = db.relationship('Team', backref=db.backref('players', lazy=True))

    def __repr__(self):
        return f"<Player {self.name}: T-{self.team_id} S-{self.Singles} D-{self.Doubles} T-{self.Triples} HR-{self.HRs} Hits-{self.hits} Avg-{self.Avg:.3f}>"

class Result(db.Model):
    __tablename__ = "results"
    id = db.Column(db.Integer, primary_key=True)
    date = db.Column(db.Date, nullable=False)
    game_number = db.Column(db.Integer, nullable=False)
    team1_id = db.Column(db.Integer, db.ForeignKey('teams.id'), nullable=False)
    team2_id = db.Column(db.Integer, db.ForeignKey('teams.id'), nullable=False)
    team1_score = db.Column(db.Integer, nullable=False, default=0)
    team2_score = db.Column(db.Integer, nullable=False, default=0)

    # optional convenient relationships to Team
    team1 = db.relationship('Team', foreign_keys=[team1_id])
    team2 = db.relationship('Team', foreign_keys=[team2_id])

    def __repr__(self):
        return f"<Result {self.date} G#{self.game_number}: {self.team1_id} {self.team1_score} - {self.team2_id} {self.team2_score}>"