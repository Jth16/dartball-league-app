import React, { useState, useEffect } from 'react';

const AdminLogin = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [teams, setTeams] = useState([]);
    const [teamId, setTeamId] = useState('');
    const [wins, setWins] = useState('');
    const [losses, setLosses] = useState('');
    const [newTeamName, setNewTeamName] = useState('');
    const [newTeamMessage, setNewTeamMessage] = useState('');

    // New player state
    const [newPlayerName, setNewPlayerName] = useState('');
    const [newPlayerTeamId, setNewPlayerTeamId] = useState('');
    const [newPlayerMessage, setNewPlayerMessage] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');

        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
        });

        if (response.ok) {
            // Handle successful login (e.g., redirect to admin dashboard)
        } else {
            setError('Invalid username or password');
        }
    };

    // Calculate games behind using standard baseball logic
    // GB = ((leaderWins - teamWins) + (teamLosses - leaderLosses)) / 2
    const calculateGamesBehind = (teamWins, teamLosses) => {
        if (teams.length === 0) return 0;
        const leader = teams.reduce((max, t) => (t.wins > max.wins ? t : max), teams[0]);
        return ((leader.wins - teamWins) + (teamLosses - leader.losses)) / 2;
    };

    const handleRecordSubmit = async (e) => {
        e.preventDefault();
        const gamesBehind = calculateGamesBehind(Number(wins), Number(losses));

        const res = await fetch("https://dartball-backend-669423444851.us-central1.run.app/routes/admin/record", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ team_id: teamId, wins, losses, games_behind: gamesBehind }),
        });

        if (res.ok) {
            fetch("https://dartball-backend-669423444851.us-central1.run.app/routes/teams")
                .then((res) => res.json())
                .then(setTeams);
            // Clear input fields after successful submit
            setTeamId('');
            setWins('');
            setLosses('');
        }
    };

    const handleAddTeam = async (e) => {
        e.preventDefault();
        setNewTeamMessage('');
        const res = await fetch("https://dartball-backend-669423444851.us-central1.run.app/routes/admin/add_team", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: newTeamName }),
        });
        const data = await res.json();
        if (res.ok) {
            setNewTeamMessage('Team added successfully!');
            setNewTeamName('');
            fetch("https://dartball-backend-669423444851.us-central1.run.app/routes/teams")
                .then((res) => res.json())
                .then(setTeams);
        } else {
            setNewTeamMessage(data.message || 'Failed to add team');
        }
    };

    // Handle add player
    const handleAddPlayer = async (e) => {
        e.preventDefault();
        setNewPlayerMessage('');
        const res = await fetch("https://dartball-backend-669423444851.us-central1.run.app/routes/admin/add_player", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: newPlayerName, team_id: newPlayerTeamId }),
        });
        const data = await res.json();
        if (res.ok) {
            setNewPlayerMessage('Player added successfully!');
            setNewPlayerName('');
            setNewPlayerTeamId('');
        } else {
            setNewPlayerMessage(data.message || 'Failed to add player');
        }
    };

    useEffect(() => {
        fetch("https://dartball-backend-669423444851.us-central1.run.app/routes/teams")
            .then((res) => res.json())
            .then(setTeams);
    }, []);

    return (
        <div>
            <h2>Admin Login</h2>
            <form onSubmit={handleLogin}>
                <div>
                    <label>Username:</label>
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label>Password:</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>
                {error && <p style={{ color: 'red' }}>{error}</p>}
                <button type="submit">Login</button>
            </form>

            <h2>Record Admin</h2>
            <form onSubmit={handleRecordSubmit}>
                <div>
                    <label>Team:</label>
                    <select
                        value={teamId}
                        onChange={(e) => setTeamId(e.target.value)}
                        required
                    >
                        <option value="">Select a team</option>
                        {teams.map((team) => (
                            <option key={team.id} value={team.id}>
                                {team.name}
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <label>Wins:</label>
                    <input
                        type="number"
                        value={wins}
                        onChange={(e) => setWins(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label>Losses:</label>
                    <input
                        type="number"
                        value={losses}
                        onChange={(e) => setLosses(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label>Games Behind:</label>
                    <input
                        type="number"
                        value={calculateGamesBehind(Number(wins), Number(losses))}
                        readOnly
                        style={{ background: "#eee", color: "#333" }}
                    />
                </div>
                <button type="submit">Submit Record</button>
            </form>

            <h2>Team Admin</h2>
            <form onSubmit={handleAddTeam}>
                <div>
                    <label>New Team Name:</label>
                    <input
                        type="text"
                        value={newTeamName}
                        onChange={(e) => setNewTeamName(e.target.value)}
                        required
                    />
                </div>
                <button type="submit">Add Team</button>
                {newTeamMessage && <p>{newTeamMessage}</p>}
            </form>

            <h2>Add New Player</h2>
            <form onSubmit={handleAddPlayer}>
                <div>
                    <label>Player Name:</label>
                    <input
                        type="text"
                        value={newPlayerName}
                        onChange={(e) => setNewPlayerName(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label>Team:</label>
                    <select
                        value={newPlayerTeamId}
                        onChange={(e) => setNewPlayerTeamId(e.target.value)}
                        required
                    >
                        <option value="">Select a team</option>
                        {teams.map((team) => (
                            <option key={team.id} value={team.id}>
                                {team.name}
                            </option>
                        ))}
                    </select>
                </div>
                <button type="submit">Add Player</button>
                {newPlayerMessage && <p>{newPlayerMessage}</p>}
            </form>
        </div>
    );
};

export default AdminLogin;