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

  // styles matched to TeamAdmin inputs
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
    background: 'linear-gradient(90deg, rgb(124 68 32), rgb(212 109 6))',
    color: '#042027',
    fontWeight: 700,
    boxShadow: '0 6px 18px rgba(6,182,212,0.18)',
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

  return (
    <section>
      <h2 style={{ color: '#fff' }}>Add New Player</h2>
      <form onSubmit={handleAddPlayer}>
        <div style={fieldWrapStyle}>
          <label style={labelStyle}>Player Name</label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            required
            style={inputStyle}
          />
        </div>
        <div style={fieldWrapStyle}>
          <label style={labelStyle}>Team</label>
          <select value={teamId} onChange={e => setTeamId(e.target.value)} required style={selectStyle}>
            <option value="">Select a team</option>
            {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
        <button type="submit" style={btnStyle}>Add Player</button>
        {message && <div aria-live="polite" style={msgStyle}>{message}</div>}
      </form>
    </section>
  );
};

export default AddPlayer;