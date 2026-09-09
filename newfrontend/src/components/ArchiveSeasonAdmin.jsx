import React, { useState } from 'react';
import { fetchWithToken } from '../api';

const inputStyle = {
  width: 320,
  padding: '6px 8px',
  textAlign: 'left',
  borderRadius: 6,
  border: '1px solid #cbd5e1',
  background: '#fff',
  fontSize: 14
};

const labelStyle = { fontSize: 12, marginBottom: 6, display: 'block', color: '#ffffff' };
const fieldWrapStyle = { display: 'flex', flexDirection: 'column', marginBottom: 12 };

const btnStyle = {
  height: 36,
  padding: '0 14px',
  borderRadius: 8,
  border: 'none',
  background: '#c33',
  color: '#fff',
  fontWeight: 700,
  cursor: 'pointer'
};

const msgStyle = { marginTop: 12, padding: '8px 12px', borderRadius: 8, color: '#fff' };

const ArchiveSeasonAdmin = () => {
  const [season, setSeason] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const handleArchive = async (e) => {
    e.preventDefault();
    if (!season.trim()) { setMessage('Enter a season label first'); return; }
    if (confirmText !== 'ARCHIVE') { setMessage('Type ARCHIVE in the confirm box to proceed'); return; }
    if (!window.confirm(
      `This will move ALL current teams, players, and results into the "${season}" archive, ` +
      `then permanently clear the live tables so the site is ready for a new season. Continue?`
    )) return;

    setBusy(true);
    setMessage('');
    try {
      const res = await fetchWithToken('/routes/admin/archive_season', {
        method: 'POST',
        body: JSON.stringify({ season: season.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage(`Error: ${res.status} ${data.message || ''}`);
        return;
      }
      setMessage(
        `Archived ${data.counts.teams} teams, ${data.counts.players} players, ` +
        `${data.counts.results} results under "${data.season}". Live tables are now empty.`
      );
      setSeason('');
      setConfirmText('');
    } catch (err) {
      console.error('archive season', err);
      setMessage('Request failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section>
      <h2 style={{ color: '#fff' }}>Archive Season</h2>
      <p style={{ color: '#cbd5e1', fontSize: 13, maxWidth: 480 }}>
        Moves all current teams, players, and results into an archive (visible on the Past Seasons page),
        then clears the live tables so the site is ready for a new season. This cannot be undone from here.
      </p>
      <form onSubmit={handleArchive}>
        <div style={fieldWrapStyle}>
          <label style={labelStyle}>Season label (e.g. "2026-2027 Season")</label>
          <input style={inputStyle} value={season} onChange={e => setSeason(e.target.value)} placeholder="2026-2027 Season" />
        </div>
        <div style={fieldWrapStyle}>
          <label style={labelStyle}>Type ARCHIVE to confirm</label>
          <input style={inputStyle} value={confirmText} onChange={e => setConfirmText(e.target.value)} placeholder="ARCHIVE" />
        </div>
        <button type="submit" style={btnStyle} disabled={busy}>{busy ? 'Archiving…' : 'Archive & Clear Season'}</button>
        <div aria-live="polite">
          {message && <div style={msgStyle}>{message}</div>}
        </div>
      </form>
    </section>
  );
};

export default ArchiveSeasonAdmin;
