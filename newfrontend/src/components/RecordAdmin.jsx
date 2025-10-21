
import React, { useState } from 'react';

const RecordAdmin = ({ teams, setTeams, apiBase, downloadToken }) => {
  const [teamId, setTeamId] = useState('');
  const [wins, setWins] = useState('');
  const [losses, setLosses] = useState('');

  const calculateGamesBehind = (teamWins, teamLosses) => {
    if (!teams || teams.length === 0) return 0;
    const leader = teams.reduce((max, t) => (t.wins > max.wins ? t : max), teams[0]);
    return ((leader.wins - teamWins) + (teamLosses - leader.losses)) / 2;
  };

  const handleRecordSubmit = async (e) => {
    e.preventDefault();
    const gamesBehind = calculateGamesBehind(Number(wins), Number(losses));
    try {
      const res = await fetch(`${apiBase}/routes/admin/record`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(downloadToken ? { 'X-Download-Token': downloadToken } : {}) },
        body: JSON.stringify({ team_id: teamId, wins, losses, games_behind: gamesBehind }),
      });
      if (res.ok) {
        const teamsRes = await fetch(`${apiBase}/routes/teams`);
        if (teamsRes.ok) setTeams(await teamsRes.json());
        setTeamId(''); setWins(''); setLosses('');
      }
    } catch (err) {
      console.error('record submit', err);
    }
  };

  return (
    <section>
      <h2>Record Admin</h2>
      <form onSubmit={handleRecordSubmit}>
        <div>
          <label>Team</label>
          <select value={teamId} onChange={e => setTeamId(e.target.value)} required>
            <option value="">Select a team</option>
            {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
        <div>
          <label>Wins</label>
          <input type="number" value={wins} onChange={e => setWins(e.target.value)} required />
        </div>
        <div>
          <label>Losses</label>
          <input type="number" value={losses} onChange={e => setLosses(e.target.value)} required />
        </div>
        <div>
          <label>Games Behind</label>
          <input type="number" value={calculateGamesBehind(Number(wins), Number(losses))} readOnly />
        </div>
        <button type="submit">Submit Record</button>
      </form>
    </section>
  );
};

export default RecordAdmin;