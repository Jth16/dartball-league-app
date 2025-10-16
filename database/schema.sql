CREATE TABLE teams (
    id Intger PRIMARY KEY AutoIncrement,
    name VARCHAR(100) NOT NULL,
    wins INT DEFAULT 0,
    losses INT DEFAULT 0,
    win_pct FLOAT DEFAULT 0.0,
    games_behind FLOAT DEFAULT 0.0,
    games_played INT DEFAULT 0
);

CREATE TABLE players (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL,
    team_id INTEGER,
    Singles INTEGER DEFAULT 0,
    Doubles INTEGER DEFAULT 0,
    Triples INTEGER DEFAULT 0,
    Dimes INTEGER DEFAULT 0,
    HRs INTEGER DEFAULT 0,
    Avg FLOAT DEFAULT 0.0,
    GP INTEGER DEFAULT 0,
    AtBats INTEGER DEFAULT 0,
    FOREIGN KEY (team_id) REFERENCES teams(id)
);