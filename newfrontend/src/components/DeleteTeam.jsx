import React, { useState } from 'react';
import { fetchWithToken } from '../api';

const DeleteTeam = ({ teams, setTeams }) => {
  const [deleteTeamId, setDeleteTeamId] = useState('');
  const [message, setMessage] = useState('');

  const handleDelete = async (e) => {
    e.preventDefault();
    if (!deleteTeamId) { setMessage('Select a team'); return; }
    if (!window.confirm('Delete team and all related data?')) return;
    setMessage('');
    try {
      const res = await fetchWithToken('/routes/admin/delete_team', {
        method: 'DELETE',
        body: JSON.stringify({ team_id: deleteTeamId }),
      });
      const text = await res.text();
      if (!res.ok) { setMessage(`Error: ${res.status} ${text}`); return; }
      setMessage('Team deleted');
      setDeleteTeamId('');

      if (typeof setTeams === 'function') {
        try {
          const teamsRes = await fetchWithToken('/routes/teams', { method: 'GET' });
          if (teamsRes.ok) setTeams(await teamsRes.json());
        } catch (err) {
          console.error('refresh teams after delete', err);
        }
      }
    } catch (err) {
      console.error('delete team', err);
      setMessage('Request failed');
    }
  };

  return (
    <section>
      <h2>Delete Team</h2>
      <form onSubmit={handleDelete}>
        <div>
          <label>Team to delete</label>
          <select value={deleteTeamId} onChange={e => setDeleteTeamId(e.target.value)}>
            <option value="">Select a team</option>
            {teams.map(t => <option key={t.id} value={t.id}>{t.name} (id: {t.id})</option>)}
          </select>
        </div>
        <button type="submit" style={{ background: '#c33', color: '#fff' }}>Delete Team</button>
        {message && <p>{message}</p>}
      </form>
    </section>
  );
};

export default DeleteTeam;