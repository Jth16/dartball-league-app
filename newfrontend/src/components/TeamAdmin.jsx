import React, { useState, useRef, useEffect } from 'react';

const TeamAdmin = ({ apiBase, downloadToken, setTeams }) => {
  const [newTeamName, setNewTeamName] = useState('');
  const [message, setMessage] = useState({ text: '', type: '' }); // type: 'success' | 'error' | ''
  const msgTimerRef = useRef(null);

  useEffect(() => () => {
    if (msgTimerRef.current) clearTimeout(msgTimerRef.current);
  }, []);

  const clearMessageAfter = (ms = 3000) => {
    if (msgTimerRef.current) clearTimeout(msgTimerRef.current);
    msgTimerRef.current = setTimeout(() => setMessage({ text: '', type: '' }), ms);
  };

  const handleAddTeam = async (e) => {
    e.preventDefault();
    setMessage({ text: '', type: '' });
    try {
      const res = await fetch(`${apiBase}/routes/admin/add_team`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Download-Token': downloadToken || '' },
        body: JSON.stringify({ name: newTeamName }),
      });
      const text = await res.text();
      if (!res.ok) {
        setMessage({ text: `Error: ${res.status} ${text}`, type: 'error' });
        clearMessageAfter();
        return;
      }
      setMessage({ text: 'Team added', type: 'success' });
      clearMessageAfter(2500);
      setNewTeamName('');

      // refresh teams in parent if callback provided
      if (typeof setTeams === 'function') {
        try {
          const teamsRes = await fetch(`${apiBase}/routes/teams`);
          if (teamsRes.ok) setTeams(await teamsRes.json());
        } catch (err) {
          console.error('refresh teams after add', err);
        }
      }
    } catch (err) {
      console.error('add team', err);
      setMessage({ text: 'Request failed', type: 'error' });
      clearMessageAfter();
    }
  };

  // styles matched to RecordAdmin / UpdatePlayerRecord inputs
  const inputStyle = {
    width: 320,
    padding: '6px 8px',
    textAlign: 'left',
    borderRadius: 6,
    border: '1px solid #cbd5e1',
    background: '#fff',
    fontSize: 14
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
    color: message.type === 'success' ? '#064e3b' : (message.type === 'error' ? '#7f1d1d' : '#0f172a'),
    background: message.type === 'success' ? '#bbf7d0' : (message.type === 'error' ? '#fecaca' : 'transparent'),
    border: message.type ? '1px solid rgba(0,0,0,0.06)' : 'none'
  };

  return (
    <section>
      <h2 style={{ color: '#fff' }}>Add Team</h2>
      <form onSubmit={handleAddTeam}>
        <div style={fieldWrapStyle}>
          <label style={labelStyle}>New Team Name</label>
          <input
            value={newTeamName}
            onChange={e => setNewTeamName(e.target.value)}
            required
            style={inputStyle}
          />
        </div>
        <button type="submit" style={btnStyle}>Add Team</button>
        <div aria-live="polite">
          {message.text && <div style={msgStyle}>{message.text}</div>}
        </div>
      </form>
    </section>
  );
};

export default TeamAdmin;