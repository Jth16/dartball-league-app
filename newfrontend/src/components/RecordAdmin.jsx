import React, { useState, useRef, useEffect } from 'react';

const RecordAdmin = ({ teams, setTeams, apiBase, downloadToken }) => {
  const [teamId, setTeamId] = useState('');
  const [wins, setWins] = useState('');
  const [losses, setLosses] = useState('');
  const [processingAll, setProcessingAll] = useState(false);

  // flash message state + timer ref (like UpdatePlayerRecord)
  const [message, setMessage] = useState({ text: '', type: '' }); // type: 'success' | 'error' | ''
  const msgTimerRef = useRef(null);

  useEffect(() => () => {
    if (msgTimerRef.current) clearTimeout(msgTimerRef.current);
  }, []);

  const clearMessageAfter = (ms = 3000) => {
    if (msgTimerRef.current) clearTimeout(msgTimerRef.current);
    msgTimerRef.current = setTimeout(() => setMessage({ text: '', type: '' }), ms);
  };

  const calculateGamesBehind = (teamWins, teamLosses) => {
    if (!teams || teams.length === 0) return 0;
    const leader = teams.reduce((max, t) => (t.wins > max.wins ? t : max), teams[0]);
    return ((leader.wins - teamWins) + (teamLosses - leader.losses)) / 2;
  };

  // normalize api base (avoid double-slash) and new endpoint
  const base = (apiBase || '').replace(/\/$/, '');
  const recordEndpoint = `${base}/routes/admin/update_team_record`;

  const handleRecordSubmit = async (e) => {
    e.preventDefault();
    const gamesBehind = calculateGamesBehind(Number(wins), Number(losses));
    try {
      const res = await fetch(recordEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(downloadToken ? { 'X-Download-Token': downloadToken } : {}) },
        body: JSON.stringify({ team_id: teamId, wins, losses, games_behind: gamesBehind }),
      });
      const text = await res.text();
      if (!res.ok) {
        console.error('record submit failed', res.status, text);
        setMessage({ text: `Update failed (${res.status})`, type: 'error' });
        clearMessageAfter();
        return;
      }

      // success
      setMessage({ text: 'Record updated successfully', type: 'success' });
      clearMessageAfter(2500);

      // refresh teams and reset inputs to zeros
      const teamsRes = await fetch(`${base}/routes/teams`);
      if (teamsRes.ok) setTeams(await teamsRes.json());

      setTeamId('');
      setWins('0');    // default inputs to 0s after submit
      setLosses('0');
    } catch (err) {
      console.error('record submit', err);
      setMessage({ text: 'Update failed (network)', type: 'error' });
      clearMessageAfter();
    }
  };

  // Calculate games behind for every team and update via API
  const calculateGamesBehindAll = async () => {
    if (!teams || teams.length === 0) return;
    setProcessingAll(true);
    try {
      // find leader from current teams
      const leader = teams.reduce((max, t) => (t.wins > max.wins ? t : max), teams[0]);
      const updates = teams.map(t => {
        const gb = ((leader.wins - Number(t.wins)) + (Number(t.losses) - leader.losses)) / 2;
        return fetch(recordEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...(downloadToken ? { 'X-Download-Token': downloadToken } : {}) },
          body: JSON.stringify({ team_id: t.id, wins: t.wins, losses: t.losses, games_behind: gb })
        }).then(r => ({ ok: r.ok, id: t.id })).catch(err => ({ ok: false, id: t.id, err }));
      });

      await Promise.all(updates);

      // refresh teams data
      const teamsRes = await fetch(`${base}/routes/teams`);
      if (teamsRes.ok) setTeams(await teamsRes.json());

      setMessage({ text: 'All GBs calculated', type: 'success' });
      clearMessageAfter(2500);
    } catch (err) {
      console.error('calculateGamesBehindAll', err);
      setMessage({ text: 'Calc all failed', type: 'error' });
      clearMessageAfter();
    } finally {
      setProcessingAll(false);
    }
  };

  // styles matched to UpdatePlayerRecord inputs
  const inputStyle = {
    width: 120,
    padding: '6px 8px',
    textAlign: 'center',
    borderRadius: 6,
    border: '1px solid #cbd5e1',
    background: '#fff',
    fontSize: 14
  };

  const selectStyle = {
    ...inputStyle,
    width: 240,
    textAlign: 'left',
    paddingLeft: 10,
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
    transition: 'transform 120ms ease',
    marginBottom: 12
  };

  const smallBtnStyle = {
    ...btnStyle,
    padding: '0 10px',
    height: 34,
    marginBottom: 12
  };

  const msgStyle = {
    marginTop: 10,
    padding: '8px 12px',
    borderRadius: 8,
    color: message.type === 'success' ? '#064e3b' : (message.type === 'error' ? '#7f1d1d' : '#0f172a'),
    background: message.type === 'success' ? '#bbf7d0' : (message.type === 'error' ? '#fecaca' : 'transparent'),
    border: message.type ? '1px solid rgba(0,0,0,0.06)' : 'none'
  };

  return (
    <section>
      <h2 style={{ color: '#fff' }}>Update Team Record</h2>
      <form onSubmit={handleRecordSubmit} style={{ maxWidth: 560 }}>
        <div style={fieldWrapStyle}>
          <label style={labelStyle}>Team</label>
          <select value={teamId} onChange={e => setTeamId(e.target.value)} required style={selectStyle}>
            <option value="">Select a team</option>
            {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
          <div style={{ ...fieldWrapStyle, flex: '0 0 auto' }}>
            <label style={labelStyle}>Wins</label>
            <input type="number" value={wins} onChange={e => setWins(e.target.value)} required style={inputStyle} />
          </div>

          <div style={{ ...fieldWrapStyle, flex: '0 0 auto' }}>
            <label style={labelStyle}>Losses</label>
            <input type="number" value={losses} onChange={e => setLosses(e.target.value)} required style={inputStyle} />
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button type="submit" style={btnStyle}>Submit Record</button>
       
          </div>
        </div>
      </form>

      {/* flash message */}
      <div aria-live="polite">
        {message.text && <div style={msgStyle}>{message.text}</div>}
      </div>
    </section>
  );
};

export default RecordAdmin;