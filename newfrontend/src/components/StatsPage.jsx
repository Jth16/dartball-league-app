import React, { useEffect, useState, Suspense } from 'react';
import PlayersTable from './PlayersTable';
import ResultLeaders from './ResultLeaders';

const placeholderStyle = { padding: 18, color: '#9fb0bd' };

const Btn = ({ active, onClick, children }) => {
  const base = {
    padding: '10px 18px',
    borderRadius: 10,
    border: active ? '1px solid rgba(255,145,64,0.95)' : '1px solid rgba(255,255,255,0.06)',
    background: active ? 'linear-gradient(90deg, rgba(194,65,12,0.18), rgba(255,138,0,0.08))' : 'rgba(255,255,255,0.02)',
    color: active ? '#fff' : '#e6f7ff',
    cursor: 'pointer',
    fontWeight: 800,
    letterSpacing: '0.02em',
    boxShadow: active ? '0 6px 20px rgba(194,65,12,0.14)' : '0 4px 12px rgba(0,0,0,0.25)',
    transition: 'transform 120ms ease, box-shadow 160ms ease',
    transform: 'translateY(0)',
    minWidth: 96,
    textTransform: 'uppercase',
    fontSize: 15
  };

  return (
    <button
      onClick={onClick}
      onMouseDown={(e) => e.currentTarget.style.transform = 'translateY(1px)'}
      onMouseUp={(e) => e.currentTarget.style.transform = 'translateY(0)'}
      style={base}
      aria-pressed={active}
    >
      {children}
    </button>
  );
};

const StatsPage = () => {
  const [view, setView] = useState('leaders'); // 'leaders' | 'players' | 'games'
  const [LeadersComp, setLeadersComp] = useState(null);

  useEffect(() => {
    // dynamic import so build doesn't fail if Leaders component isn't present yet
    let mounted = true;
    import('./Leaders')
      .then(mod => { if (mounted) setLeadersComp(() => mod.default || mod); })
      .catch(() => { if (mounted) setLeadersComp(() => () => <div style={placeholderStyle}>Leaders component not found.</div>); });
    return () => { mounted = false; };
  }, []);

  const renderContent = () => {
    if (view === 'players') return <PlayersTable />;
    if (view === 'games') return <ResultLeaders />;
    // leaders
    if (LeadersComp) {
      return (
        <Suspense fallback={<div style={placeholderStyle}>Loading leaders…</div>}>
          <LeadersComp />
        </Suspense>
      );
    }
    return <div style={placeholderStyle}>Loading leaders…</div>;
  };

  return (
    <div style={{ maxWidth: 1200, margin: '1.5rem auto', padding: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 12 }}>
       
        <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <Btn active={view === 'leaders'} onClick={() => setView('leaders')}>Leaders</Btn>
            <Btn active={view === 'players'} onClick={() => setView('players')}>Players</Btn>
            <Btn active={view === 'games'} onClick={() => setView('games')}>Games</Btn>
          </div>
        </div>

      </div>

      <div>
        {renderContent()}
      </div>
    </div>
  );
};

export default StatsPage;