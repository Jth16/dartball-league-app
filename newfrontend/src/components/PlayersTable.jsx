import React, { useEffect, useState, useRef } from "react";
import { fetchWithToken } from '../api';
import { printElement } from '../utils/print';
import PlayerSearch from './PlayerSearch';

const PlayersTable = () => {
    const [teams, setTeams] = useState([]);
    const [groupedPlayers, setGroupedPlayers] = useState([]);
    const containerRef = useRef(null);

    useEffect(() => {
        let mounted = true;

        const load = async () => {
            try {
                const teamsRes = await fetchWithToken('/routes/teams', { method: 'GET' });
                if (!teamsRes.ok) throw new Error(`teams fetch ${teamsRes.status}`);
                const teamsData = await teamsRes.json();
                if (!mounted) return;
                setTeams(teamsData);

                const groups = await Promise.all(teamsData.map(async (t) => {
                    try {
                        const res = await fetchWithToken(`/routes/players?team_id=${t.id}`, { method: 'GET' });
                        const players = res.ok ? await res.json() : [];
                        return { teamId: t.id, teamName: t.name, players };
                    } catch (err) {
                        console.error('fetch players for team failed', t.id, err);
                        return { teamId: t.id, teamName: t.name, players: [] };
                    }
                }));

                if (mounted) setGroupedPlayers(groups);
            } catch (err) {
                console.error('load teams/players failed', err);
                if (mounted) {
                    setTeams([]);
                    setGroupedPlayers([]);
                }
            }
        };

        load();
        return () => { mounted = false; };
    }, []);

    const fmtAvg = (v) => {
      if (typeof v === 'number') return v.toFixed(3).replace(/^0\./, '.');
      const n = Number(v);
      return Number.isFinite(n) ? n.toFixed(3).replace(/^0\./, '.') : 'N/A';
    };

    // reuse TeamsTable theme (dark + dark-orange accent)
    const containerStyle = {
      maxWidth: 1100,
      margin: "1.5rem auto",
      background: "linear-gradient(180deg, rgba(8,18,24,0.95) 0%, rgba(6,30,36,0.95) 100%)",
      color: "#e6f7ff",
      padding: "1.25rem",
      borderRadius: 14,
      boxShadow: "0 10px 30px rgba(2,6,8,0.6)",
      boxSizing: "border-box",
    };

    const teamHeaderStyle = {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 10
    };

    const teamTitleStyle = {
      margin: 0,
      color: "#fff",
      fontSize: "1.15rem",
      letterSpacing: "0.01em"
    };

    const accentBar = {
      height: 6,
      borderRadius: 6,
      background: "linear-gradient(90deg,#7a2b00,#c2410c,#ff8a00)",
      marginTop: 10,
      boxShadow: "0 6px 18px rgba(194,65,12,0.08)"
    };

    const tableWrap = { overflowX: "auto", borderRadius: 10 };

    const tableStyle = {
      width: "100%",
      minWidth: 520,
      borderCollapse: "separate",
      borderSpacing: "0 10px",
      fontSize: "0.95rem"
    };

    const thStyle = {
      padding: "8px 8px",
      textAlign: "left",
      background: "#222",
      color: "#fff",
      fontWeight: 700
    };

    const rowStyle = {
      background: "linear-gradient(180deg,#07101a 0%, #0b1520 100%)",
      color: "#fff",
      borderRadius: 8
    };

    const cellStyle = {
      padding: "10px 12px",
      verticalAlign: "middle"
    };

    return (
      <div ref={containerRef} data-printable style={containerStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ margin: "0 0 12px 0", color: "#fff" }}>All Players</h1>
          <button
            className="no-print"
            onClick={() => printElement(containerRef.current)}
            style={{ padding: '6px 10px', cursor: 'pointer', borderRadius: 6, border: 'none', background: '#c2410c', color: '#fff' }}
          >
            Print
          </button>
        </div>

        <div style={accentBar} />
        <div style={{ height: 12 }} />

        {/* Player search / quick stats shown at top of players page */}
        <PlayerSearch players={null} />

        {groupedPlayers.length === 0 ? (
            <p style={{ color: "#cbd5e1" }}>Loading teams and players…</p>
        ) : (
          groupedPlayers.map(group => (
            <section key={group.teamId} style={{ marginBottom: 28 }}>
              <div style={teamHeaderStyle}>
                <h2 style={teamTitleStyle}>{group.teamName}</h2>
                <div style={{ color: "#ffd7b0", fontSize: 13 }}>{group.players.length} players</div>
              </div>

              <div style={tableWrap}>
                <table style={tableStyle}>
                  <thead>
                    <tr>
                      <th style={{ ...thStyle, width: '40%' }}>Name</th>
                      <th style={{ ...thStyle, textAlign: 'center' }}>ABs</th>
                      <th style={{ ...thStyle, textAlign: 'center' }}>Hits</th>
                      <th style={{ ...thStyle, textAlign: 'center' }}>Avg</th>
                      <th style={{ ...thStyle, textAlign: 'center' }}>Singles</th>
                      <th style={{ ...thStyle, textAlign: 'center' }}>Doubles</th>
                      <th style={{ ...thStyle, textAlign: 'center' }}>Triples</th>
                      <th style={{ ...thStyle, textAlign: 'center' }}>Dimes</th>
                      <th style={{ ...thStyle, textAlign: 'center' }}>HRs</th>
                      <th style={{ ...thStyle, textAlign: 'center' }}>GP</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.players.map(player => (
                      <tr key={player.id} style={rowStyle}>
                        <td style={{ ...cellStyle, paddingLeft: 18 }}>{player.name}</td>
                        <td style={{ ...cellStyle, textAlign: 'center' }}>{player.AtBats ?? 0}</td>
                        <td style={{ ...cellStyle, textAlign: 'center' }}>{player.hits ?? 0}</td>
                        <td style={{ ...cellStyle, textAlign: 'center' }}>{player.Avg != null ? fmtAvg(player.Avg) : 'N/A'}</td>
                        <td style={{ ...cellStyle, textAlign: 'center' }}>{player.Singles ?? 0}</td>
                        <td style={{ ...cellStyle, textAlign: 'center' }}>{player.Doubles ?? 0}</td>
                        <td style={{ ...cellStyle, textAlign: 'center' }}>{player.Triples ?? 0}</td>
                        <td style={{ ...cellStyle, textAlign: 'center' }}>{player.Dimes ?? 0}</td>
                        <td style={{ ...cellStyle, textAlign: 'center' }}>{player.HRs ?? 0}</td>
                        <td style={{ ...cellStyle, textAlign: 'center' }}>{player.GP ?? 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ))
        )}
      </div>
    );
};

export default PlayersTable;