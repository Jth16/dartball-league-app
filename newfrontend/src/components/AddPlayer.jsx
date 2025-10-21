import React, { useState } from 'react';
import { fetchWithToken } from '../api';

const AddPlayer = ({ teams, onPlayerAdded }) => {
  const [name, setName] = useState('');
  const [teamId, setTeamId] = useState('');
  const [message, setMessage] = useState('');

  const handleAddPlayer = async (e) => {
    e.preventDefault();
    setMessage('');
    try {
      const res = await fetchWithToken('/routes/admin/add_player', {
        method: 'POST',
        body: JSON.stringify({ name, team_id: teamId }),
      });
      const text = await res.text();
      if (!res.ok) {
        setMessage(`Error: ${res.status} ${text}`);
        return;
      }
      setMessage('Player added');
      setName(''); setTeamId('');

      // callback to parent to refresh without navigation
      if (typeof onPlayerAdded === 'function') onPlayerAdded();
    } catch (err) {
      console.error('add player', err);
      setMessage('Request failed');
    }
  };

  return (
    <section>
      <h2>Add New Player</h2>
      <form onSubmit={handleAddPlayer}>
        <div>
          <label>Player Name</label>
          <input value={name} onChange={e => setName(e.target.value)} required />
        </div>
        <div>
          <label>Team</label>
          <select value={teamId} onChange={e => setTeamId(e.target.value)} required>
            <option value="">Select a team</option>
            {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
        <button type="submit">Add Player</button>
        {message && <p>{message}</p>}
      </form>
    </section>
  );
};

export default AddPlayer;