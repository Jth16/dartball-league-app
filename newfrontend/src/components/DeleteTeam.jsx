import React, { useState } from 'react';
import { fetchWithToken } from '../api';

const DeleteTeam = ({ teams, setTeams }) => {
  const [deleteTeamId, setDeleteTeamId] = useState('');
  const [message, setMessage] = useState('');

  // styles matched to AddPlayer inputs
  const inputStyle = {
    width: 320,
    padding: '6px 8px',
    textAlign: 'left',
    borderRadius: 6,
    border: '1px solid #cbd5e1',
    background: '#fff',
    fontSize: 14
  };

  const selectStyle = {
    ...inputStyle,
    appearance: 'none',
    WebkitAppearance: 'none',
    MozAppearance: 'none',
    backgroundImage: 'linear-gradient(45deg, transparent 50%, #000 50%), linear-gradient(135deg, #000 50%, transparent 50%)',
    backgroundPosition: 'calc(100% - 18px) calc(1em + 2px), calc(100% - 13px) calc(1em + 2px)',
    backgroundSize: '6px 6px, 6px 6px',
    backgroundRepeat: 'no-repeat'
  };

  const labelStyle = {
    fontSize: 12,
    marginBottom: 6,
    display: 'block',
    color: '#ffffff'
  };

  const fieldWrapStyle = {
    display: 'flex',
    flexDirection: 'column',
    marginBottom: 12
  };

  const btnStyle = {
    height: 36,
    padding: '0 14px',
    borderRadius: 8,
    border: 'none',
    background: '#c33',
    color: '#fff',
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'transform 120ms ease'
  };

  const msgStyle = {
    marginTop: 12,
    padding: '8px 12px',
    borderRadius: 8,
    color: '#0f172a',
    background: 'transparent'
  };

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
      <h2 style={{ color: '#fff' }}>Delete Team</h2>
      <form onSubmit={handleDelete}>
        <div style={fieldWrapStyle}>
          <label style={labelStyle}>Team to delete ( This will delete all players for the team as well)</label>
          <select value={deleteTeamId} onChange={e => setDeleteTeamId(e.target.value)} style={selectStyle}>
            <option value="">Select a team</option>
            {teams.map(t => <option key={t.id} value={t.id}>{t.name} (id: {t.id})</option>)}
          </select>
        </div>
        <button type="submit" style={btnStyle}>Delete Team</button>
        <div aria-live="polite">
          {message && <div style={msgStyle}>{message}</div>}
        </div>
      </form>
    </section>
  );
};

export default DeleteTeam;