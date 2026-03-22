import React, { useEffect, useState } from 'react';
import { fetchWithToken } from '../api';

const Playoffs = () => {
    const [teams, setTeams] = useState([]);

    useEffect(() => {
        const fetchStandings = async () => {
            try {
                const [teamsResp, resultsResp] = await Promise.all([
                    fetchWithToken('/routes/teams', { method: 'GET' }),
                    fetchWithToken('/routes/results?limit=10000', { method: 'GET' })
                ]);

                if (!teamsResp.ok) throw new Error(`Teams HTTP ${teamsResp.status}`);
                if (!resultsResp.ok) throw new Error(`Results HTTP ${resultsResp.status}`);

                const teamsData = await teamsResp.json();
                const resultsData = await resultsResp.json();

                const nameMap = {};
                (Array.isArray(teamsData) ? teamsData : []).forEach(t => {
                    nameMap[String(t.id)] = t.name || t.team_name || `Team ${t.id}`;
                });

                const stats = {};
                const addTeamIfMissing = (id) => {
                    const key = String(id);
                    if (!stats[key]) stats[key] = { id: key, wins: 0, losses: 0, games_played: 0 };
                    return stats[key];
                };

                (Array.isArray(resultsData) ? resultsData : []).forEach(r => {
                    const t1 = String(r.team1_id);
                    const t2 = String(r.team2_id);
                    const s1 = Number(r.team1_score) || 0;
                    const s2 = Number(r.team2_score) || 0;

                    const st1 = addTeamIfMissing(t1);
                    const st2 = addTeamIfMissing(t2);

                    st1.games_played += 1;
                    st2.games_played += 1;

                    if (s1 > s2) { st1.wins += 1; st2.losses += 1; }
                    else if (s2 > s1) { st2.wins += 1; st1.losses += 1; }
                });

                const rows = Object.values(stats).map(s => {
                    const winPct = s.games_played > 0 ? (s.wins / s.games_played) * 100 : 0;
                    return { ...s, win_pct: winPct, name: nameMap[s.id] ?? `Team ${s.id}` };
                });

                rows.sort((a, b) => {
                    if (b.win_pct !== a.win_pct) return b.win_pct - a.win_pct;
                    return (b.wins || 0) - (a.wins || 0);
                });

                setTeams(rows);
            } catch (err) {
                console.error('fetchStandings failed', err);
            }
        };
        fetchStandings();
    }, []);

    const seedName = (n) => teams[n - 1]?.name || `Seed ${n}`;

    /* ── Matchup card ── */
    const Matchup = ({ topLabel, topName, bottomLabel, bottomName, title, time, topScore, bottomScore, width = 155 }) => {
        const topWon = topScore != null && bottomScore != null && topScore > bottomScore;
        const bottomWon = topScore != null && bottomScore != null && bottomScore > topScore;
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <div style={{
                    background: 'linear-gradient(180deg, #0d1b2a 0%, #0b1520 100%)',
                    border: '1px solid #1e3a50',
                    borderRadius: 6,
                    width,
                    flexShrink: 0,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                }}>
                    {title && (
                        <div style={{
                            background: 'linear-gradient(90deg, #7a2b00, #c2410c)',
                            color: '#fff',
                            fontSize: '0.6rem',
                            fontWeight: 'bold',
                            padding: '3px 8px',
                            textAlign: 'center',
                            letterSpacing: '0.5px',
                            textTransform: 'uppercase',
                            borderRadius: '5px 5px 0 0',
                        }}>
                            {title}
                        </div>
                    )}
                    <div style={{
                        padding: '6px 10px',
                        borderBottom: '1px solid #1e3a50',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        opacity: bottomWon ? 0.45 : 1,
                    }}>
                        <span style={{ color: '#ff9800', fontSize: '0.7rem', fontWeight: 'bold', minWidth: 16 }}>{topLabel}</span>
                        <span style={{ fontSize: '0.8rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>{topName}</span>
                        {topScore != null && <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: topWon ? '#fff' : '#7a8fa0', minWidth: 12, textAlign: 'right' }}>{topScore}</span>}
                    </div>
                    <div style={{
                        padding: '6px 10px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        opacity: topWon ? 0.45 : 1,
                    }}>
                        <span style={{ color: '#ff9800', fontSize: '0.7rem', fontWeight: 'bold', minWidth: 16 }}>{bottomLabel}</span>
                        <span style={{ fontSize: '0.8rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>{bottomName}</span>
                        {bottomScore != null && <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: bottomWon ? '#fff' : '#7a8fa0', minWidth: 12, textAlign: 'right' }}>{bottomScore}</span>}
                    </div>
                </div>
                {time && (
                    <div style={{ fontSize: '0.65rem', color: '#7a8fa0', textAlign: 'center', paddingLeft: 2 }}>{time}</div>
                )}
            </div>
        );
    };

    /* ── Bracket connector: joins two slots → result ── */
    const BracketPair = ({ slot1, slot2, result, gap = 16 }) => (
        <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
                {slot1}
                <div style={{ height: gap }} />
                {slot2}
            </div>
            {/* Vertical bar + bottom arm */}
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                width: 24,
                alignSelf: 'stretch',
                flexShrink: 0,
            }}>
                <div style={{ flex: 1, borderRight: '2px solid #555', borderBottom: '2px solid #555' }} />
                <div style={{ flex: 1, borderRight: '2px solid #555' }} />
            </div>
            {/* Horizontal line to result */}
            <div style={{ width: 24, height: 0, borderTop: '2px solid #555', flexShrink: 0 }} />
            {result}
        </div>
    );

    if (teams.length < 9) {
        return (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
                <h1 style={{ margin: 0, color: '#fff', fontSize: '1.5rem' }}>Playoffs</h1>
                <p style={{ color: '#888' }}>Loading standings...</p>
            </div>
        );
    }

    return (
        <div style={{
            maxWidth: 1100,
            margin: '2rem auto',
            background: 'linear-gradient(180deg, rgba(8,18,24,0.95) 0%, rgba(6,30,36,0.95) 100%)',
            color: '#e6f7ff',
            padding: '1.5rem',
            borderRadius: 14,
            boxShadow: '0 10px 30px rgba(2,6,8,0.6)',
        }}>
            <h1 style={{ margin: 0, color: '#fff', fontSize: '1.5rem', letterSpacing: '0.02em' }}>Playoffs</h1>
            <p style={{ color: '#888', marginTop: 4, marginBottom: 12, fontSize: '0.8rem' }}> *Player must have played in at least 32 games to be eligble for the playoffs</p>
            <div style={{
                height: 6, borderRadius: 6, marginTop: 12,
                background: 'linear-gradient(90deg,#7a2b00,#c2410c,#ff8a00)',
                boxShadow: '0 6px 18px rgba(194,65,12,0.08)',
            }} />

            {/* ── Playoff Bracket ── */}
            <h3 style={{ color: '#ff9800', margin: '0 0 0.75rem' }}>Playoff Bracket</h3>
            <div style={{ overflowX: 'auto', paddingBottom: '1rem' }}>
                <BracketPair
                    slot1={
                        <BracketPair
                            slot1={
                                <Matchup
                                    title="Round 1"
                                    topLabel="#1"
                                    topName={seedName(1)}
                                    bottomLabel="#8"
                                    bottomName={seedName(9)}
                                    topScore={3}
                                    bottomScore={0}
                                    time="Mar 16 · 6:30 PM Bd. 1"
                                />
                            }
                            slot2={
                                <Matchup
                                    title="Round 1"
                                    topLabel="#4"
                                    topName={seedName(4)}
                                    bottomLabel="#5"
                                    bottomName={seedName(5)}
                                    topScore={1}
                                    bottomScore={3}
                                    time="Mar 16 · 7:30 PM Bd. 2"
                                />
                            }
                            result={
                                <Matchup
                                    title="Semifinal 1"
                                    topLabel="#1"
                                    topName={seedName(1)}
                                    bottomLabel="#5"
                                    bottomName={seedName(5)}
                                    topScore={2}
                                    bottomScore={3}
                                    time="Mar 18 · 6:30 PM Bd. 1"
                                />
                            }
                        />
                    }
                    slot2={
                        <BracketPair
                            slot1={
                                <Matchup
                                    title="Round 1"
                                    topLabel="#2"
                                    topName={seedName(2)}
                                    bottomLabel="#7"
                                    bottomName={seedName(7)}
                                    topScore={3}
                                    bottomScore={2}
                                    time="Mar 16 · 6:30 PM Bd. 2"
                                />
                            }
                            slot2={
                                <Matchup
                                    title="Round 1"
                                    topLabel="#3"
                                    topName={seedName(3)}
                                    bottomLabel="#6"
                                    bottomName={seedName(6)}
                                    topScore={1}
                                    bottomScore={3}
                                    time="Mar 16 · 7:30 PM Bd. 1"
                                />
                            }
                            result={
                                <Matchup
                                    title="Semifinal 2"
                                    topLabel="#2"
                                    topName={seedName(2)}
                                    bottomLabel="#6"
                                    bottomName={seedName(6)}
                                    topScore={2}
                                    bottomScore={3}
                                    time="Mar 18 · 6:30 PM Bd. 2"
                                />
                            }
                        />
                    }
                    result={
                        <div style={{ position: 'relative', alignSelf: 'stretch', width: 170, flexShrink: 0 }}>
                            <Matchup
                                title="3rd Place"
                                topLabel="#1"
                                topName={seedName(1)}
                                bottomLabel="#2"
                                bottomName={seedName(2)}
                                time="Mar 21 · 6:00 PM"
                                width={170}
                            />
                            <div style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: 0 }}>
                                <Matchup
                                    title="Championship"
                                    topLabel="#5"
                                    topName={seedName(5)}
                                    bottomLabel="#6"
                                    bottomName={seedName(6)}
                                    topScore={4}
                                    bottomScore={2}
                                    time="Mar 21 · 7:00 PM"
                                    width={170}
                                />
                            </div>
                        </div>
                    }
                    gap={40}
                />
            </div>

             {/* ── Play-in Result ── */}
            <h3 style={{ color: '#ff9800', margin: '0 0 0.75rem', fontSize: '1.0rem' }}>Play-in Result (Best of 3)</h3>
            <div style={{ display: 'flex', gap: 12, alignItems: 'stretch', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                {[
                    { seed: 8, games: 1, winner: false },
                    { seed: 9, games: 2, winner: true },
                ].map(({ seed, games, winner }) => (
                    <div key={seed} style={{
                        background: winner ? 'linear-gradient(180deg, #2a1a0e, #1a0f05)' : 'linear-gradient(180deg, #0d1b2a, #0b1520)',
                        border: `1px solid ${winner ? '#ff9800' : '#1e3a50'}`,
                        borderRadius: 8,
                        padding: '4px 8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 14,
                        minWidth: 200,
                    }}>
                        <span style={{ color: '#ff9800', fontWeight: 'bold', fontSize: '0.8rem' }}>#{seed}</span>
                        <span style={{ fontSize: '0.9rem', flex: 1 }}>{seedName(seed)}</span>
                        <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: winner ? '#fff' : '#7a8fa0' }}>{games}</span>
                        {winner && <span style={{ fontSize: '0.7rem', color: '#ff9800', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Winner</span>}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Playoffs;
