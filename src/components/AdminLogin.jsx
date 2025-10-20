import React, { useState, useEffect } from 'react';
import { fetchWithToken } from '../api';

const API_BASE = process.env.REACT_APP_API_URL || 'https://dartball-backend-654879525708.us-central1.run.app';
const DOWNLOAD_TOKEN = process.env.REACT_APP_DOWNLOAD_TOKEN || 'your-token-here'; // temporary hardcode for test

const AdminLogin = () => {
    // debug: show whether token was loaded (do NOT log the token value in public logs)
    useEffect(() => {
        console.log('DOWNLOAD_TOKEN present?', !!DOWNLOAD_TOKEN, 'length:', DOWNLOAD_TOKEN.length);
    }, []);

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

        const response = await fetch('https://dartball-backend-654879525708.us-central1.run.app/routes/admin/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
        });

        if (response.ok) {
            // Example: Redirect to admin dashboard or set authenticated state
            window.location.href = "/admin-dashboard"; // Change to your actual admin dashboard route
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

        const res = await fetch(`${API_BASE}/routes/admin/record`, {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                ...(DOWNLOAD_TOKEN ? { "X-Download-Token": DOWNLOAD_TOKEN } : {})
            },
            body: JSON.stringify({ team_id: teamId, wins, losses, games_behind: gamesBehind }),
        });

        if (res.ok) {
            fetch("https://dartball-backend-654879525708.us-central1.run.app/routes/teams")
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
        try {
            // include header unconditionally so we can see it in DevTools (value may be empty)
            const res = await fetch(`${API_BASE}/routes/admin/add_team`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Download-Token': DOWNLOAD_TOKEN
                },
                body: JSON.stringify({ name: newTeamName })
            });
            const text = await res.text();
            if (!res.ok) {
                setNewTeamMessage(`Error: ${res.status} ${text}`);
                console.error('add_team failed', res.status, text);
                return;
            }
            const data = JSON.parse(text);
            setNewTeamMessage(`Added: ${data.team?.name || 'ok'}`);
            setNewTeamName('');
            // refresh teams UI — quick reload; replace with state refetch if available
            window.location.reload();
            console.log('add_team response', data);
        } catch (err) {
            console.error('add_team exception', err);
            setNewTeamMessage('Request failed');
        }
    };

    // Handle add player
    const handleAddPlayer = async (e) => {
        e.preventDefault();
        setNewPlayerMessage('');
        try {
            const res = await fetchWithToken('/routes/admin/add_player', {
                method: 'POST',
                body: JSON.stringify({ name: newPlayerName, team_id: newPlayerTeamId })
            });
            const text = await res.text();
            if (!res.ok) {
                setNewPlayerMessage(`Error: ${res.status} ${text}`);
                return;
            }
            setNewPlayerMessage('Player added successfully!');
            setNewPlayerName('');
            setNewPlayerTeamId('');
            window.location.reload();
        } catch (err) {
            console.error('add player failed', err);
            setNewPlayerMessage('Request failed');
        }
    };

    useEffect(() => {
        fetch("https://dartball-backend-654879525708.us-central1.run.app/routes/teams")
            .then((res) => res.json())
            .then(setTeams);
    }, []);

    return (
        <div style={{ maxWidth: 600, margin: '2rem auto' }}>

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