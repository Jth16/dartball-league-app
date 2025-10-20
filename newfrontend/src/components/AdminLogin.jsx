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

    // Delete team state
    const [deleteTeamId, setDeleteTeamId] = useState('');
    const [deleteTeamMessage, setDeleteTeamMessage] = useState('');

    // player update state
    const [playersForTeam, setPlayersForTeam] = useState([]);
    const [selectedPlayerId, setSelectedPlayerId] = useState('');
    const [playerStats, setPlayerStats] = useState({
        Singles: '',
        Doubles: '',
        Triples: '',
        Dimes: '',
        HRs: '',
        GP: '',
        AtBats: '',
        Avg: ''
    });
    const [updateMessage, setUpdateMessage] = useState('');

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

    const handleDeleteTeam = async (e) => {
        e.preventDefault();
        if (!deleteTeamId) {
            setDeleteTeamMessage('Select a team to delete.');
            return;
        }
        // use window.confirm to avoid ESLint no-restricted-globals
        if (!window.confirm('Delete team and all related data? This cannot be undone.')) return;

        setDeleteTeamMessage('');
        try {
            const res = await fetchWithToken('/routes/admin/delete_team', {
                method: 'DELETE',
                body: JSON.stringify({ team_id: deleteTeamId })
            });
            const text = await res.text();
            if (!res.ok) {
                setDeleteTeamMessage(`Error: ${res.status} ${text}`);
                console.error('delete_team failed', res.status, text);
                return;
            }
            setDeleteTeamMessage('Team deleted');
            setDeleteTeamId('');
            // refresh teams list
            const teamsRes = await fetchWithToken('/routes/teams', { method: 'GET' });
            const teamsData = teamsRes.ok ? await teamsRes.json() : [];
            setTeams(teamsData);
        } catch (err) {
            console.error('delete_team exception', err);
            setDeleteTeamMessage('Request failed');
        }
    };

    useEffect(() => {
        (async () => {
            try {
                const res = await fetchWithToken('/routes/teams', { method: 'GET' });
                if (res.ok) {
                    const data = await res.json();
                    setTeams(data);
                } else {
                    setTeams([]);
                }
            } catch (err) {
                console.error('initial teams fetch failed', err);
                setTeams([]);
            }
        })();
    }, []);

    // load players when a team is selected for the player-update UI
    const handleTeamForPlayersChange = async (teamId) => {
        setPlayersForTeam([]);
        setSelectedPlayerId('');
        setPlayerStats({
            Singles: '',
            Doubles: '',
            Triples: '',
            Dimes: '',
            HRs: '',
            GP: '',
            AtBats: '',
            Avg: ''
        });
        if (!teamId) return;
        try {
            const res = await fetchWithToken(`/routes/players?team_id=${teamId}`, { method: 'GET' });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            setPlayersForTeam(data);
        } catch (err) {
            console.error('fetch players failed', err);
            setPlayersForTeam([]);
        }
    };

    const handlePlayerSelect = (playerId) => {
        setSelectedPlayerId(playerId);
        const p = playersForTeam.find(pl => String(pl.id) === String(playerId));
        if (p) {
            setPlayerStats({
                Singles: p.Singles ?? '',
                Doubles: p.Doubles ?? '',
                Triples: p.Triples ?? '',
                Dimes: p.Dimes ?? '',
                HRs: p.HRs ?? '',
                GP: p.GP ?? '',
                AtBats: p.AtBats ?? '',
                Avg: p.Avg ?? ''
            });
        } else {
            setPlayerStats({
                Singles: '',
                Doubles: '',
                Triples: '',
                Dimes: '',
                HRs: '',
                GP: '',
                AtBats: '',
                Avg: ''
            });
        }
        setUpdateMessage('');
    };

    const handlePlayerStatChange = (field, value) => {
        setPlayerStats(prev => ({ ...prev, [field]: value }));
    };

    const handleUpdatePlayer = async (e) => {
        e.preventDefault();
        setUpdateMessage('');
        if (!selectedPlayerId) {
            setUpdateMessage('Select a player to update');
            return;
        }
        try {
            const payload = { player_id: selectedPlayerId };
            // include only fields with values (allow zero values)
            Object.keys(playerStats).forEach(k => {
                const v = playerStats[k];
                if (v !== '' && v !== null && v !== undefined) payload[k] = v;
            });

            const res = await fetchWithToken('/routes/admin/update_player', {
                method: 'POST',
                body: JSON.stringify(payload)
            });
            const text = await res.text();
            if (!res.ok) {
                setUpdateMessage(`Error: ${res.status} ${text}`);
                console.error('update_player failed', res.status, text);
                return;
            }
            const data = JSON.parse(text);
            setUpdateMessage('Player updated');
            // refresh players list for the selected team
            if (playersForTeam.length && selectedPlayerId) {
                const teamId = playersForTeam[0]?.team_id || ''; // if players include team_id
                if (teamId) await handleTeamForPlayersChange(teamId);
                else {
                    // fallback: reload players for whichever team is selected in the teams list UI
                    // (no-op here)
                }
            }
        } catch (err) {
            console.error('update player exception', err);
            setUpdateMessage('Request failed');
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
            boxSizing: 'border-box'
        }}>
            <div style={{ maxWidth: 600, width: '100%', margin: 0 }}>
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

                <h2>Delete Team</h2>
                <form onSubmit={handleDeleteTeam}>
                    <div>
                        <label>Team to delete:</label>
                        <select value={deleteTeamId} onChange={(e) => setDeleteTeamId(e.target.value)}>
                            <option value="">Select a team</option>
                            {teams.map((team) => (
                                <option key={team.id} value={team.id}>{team.name} (id: {team.id})</option>
                            ))}
                        </select>
                    </div>
                    <button type="submit" style={{ marginTop: 8, background: '#c33', color: '#fff' }}>Delete Team</button>
                    {deleteTeamMessage && <p>{deleteTeamMessage}</p>}
                </form>

                <h2>Update Player Record</h2>
                <div>
                    <label>Team:</label>
                    <select onChange={(e) => handleTeamForPlayersChange(e.target.value)} defaultValue="">
                        <option value="">Select team</option>
                        {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                </div>

                <div style={{ marginTop: 8 }}>
                    <label>Player:</label>
                    <select value={selectedPlayerId} onChange={(e) => handlePlayerSelect(e.target.value)}>
                        <option value="">Select player</option>
                        {playersForTeam.map(p => <option key={p.id} value={p.id}>{p.name} (id:{p.id})</option>)}
                    </select>
                </div>

                {selectedPlayerId && (
                    <form onSubmit={handleUpdatePlayer} style={{ marginTop: 12 }}>
                        <div>
                            <label>Singles</label>
                            <input type="number" value={playerStats.Singles} onChange={e => handlePlayerStatChange('Singles', e.target.value)} />
                        </div>
                        <div>
                            <label>Doubles</label>
                            <input type="number" value={playerStats.Doubles} onChange={e => handlePlayerStatChange('Doubles', e.target.value)} />
                        </div>
                        <div>
                            <label>Triples</label>
                            <input type="number" value={playerStats.Triples} onChange={e => handlePlayerStatChange('Triples', e.target.value)} />
                        </div>
                        <div>
                            <label>Dimes</label>
                            <input type="number" value={playerStats.Dimes} onChange={e => handlePlayerStatChange('Dimes', e.target.value)} />
                        </div>
                        <div>
                            <label>HRs</label>
                            <input type="number" value={playerStats.HRs} onChange={e => handlePlayerStatChange('HRs', e.target.value)} />
                        </div>
                        <div>
                            <label>GP</label>
                            <input type="number" value={playerStats.GP} onChange={e => handlePlayerStatChange('GP', e.target.value)} />
                        </div>
                        <div>
                            <label>AtBats</label>
                            <input type="number" value={playerStats.AtBats} onChange={e => handlePlayerStatChange('AtBats', e.target.value)} />
                        </div>
                        <div>
                            <label>Avg</label>
                            <input type="number" step="0.001" value={playerStats.Avg} onChange={e => handlePlayerStatChange('Avg', e.target.value)} />
                        </div>
                        <button type="submit" style={{ marginTop: 8 }}>Update Player</button>
                        {updateMessage && <p>{updateMessage}</p>}
                    </form>
                )}
            </div>
        </div>
    );
};

export default AdminLogin;