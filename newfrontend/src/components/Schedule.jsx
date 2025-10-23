// filepath: c:\Source\VSCode Projects\dartball-league-app\newfrontend\src\components\Schedule.jsx
import React, { useEffect, useState } from 'react';

const Schedule = () => {
  const [rows, setRows] = useState([]);
  const [headers, setHeaders] = useState([]);

  // simple CSV parser that handles quoted fields
  const parseCSV = (text) => {
    const lines = text.split(/\r?\n/).filter(l => l.trim() !== '');
    if (lines.length === 0) return { headers: [], rows: [] };

    const parseLine = (line) => {
      const cells = [];
      let cur = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"' ) {
          if (inQuotes && line[i+1] === '"') { // escaped quote
            cur += '"';
            i++;
          } else {
            inQuotes = !inQuotes;
          }
          continue;
        }
        if (ch === ',' && !inQuotes) {
          cells.push(cur);
          cur = '';
          continue;
        }
        cur += ch;
      }
      cells.push(cur);
      return cells.map(c => c.trim());
    };

    const rawHeaders = parseLine(lines[0]);
    // determine indices to keep (exclude Game Day and Rep. columns)
    const exclude = ['Game Day', 'Rep.', 'Round'];
    const keepIdx = rawHeaders.map((h, i) => ({ h, i }))
      .filter(x => !exclude.includes(x.h))
      .map(x => x.i);

    const headers = keepIdx.map(i => rawHeaders[i]);

    const dataRows = lines.slice(1).map(l => parseLine(l).filter((_, idx) => keepIdx.includes(idx)));
    return { headers, rows: dataRows };
  };

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        // Prefer a filename with no spaces; encodeURI keeps spaces safe if you keep them.
        const url = encodeURI('/Newest-Darts-Schedule.csv'); // <- put this file into public/
        const res = await fetch(url, { cache: 'no-cache' });

        let text = '';
        if (res.ok) {
          text = await res.text();

          // detect if server returned HTML (index.html) instead of CSV
          const ct = (res.headers.get('content-type') || '').toLowerCase();
          if (ct.includes('html') || text.trim().startsWith('<')) {
            throw new Error(`Expected CSV but got HTML from ${url}`);
          }
        } else {
          throw new Error(`CSV fetch failed: ${res.status}`);
        }

        if (!mounted) return;
        const parsed = parseCSV(text);
        setHeaders(parsed.headers);
        setRows(parsed.rows);
      } catch (err) {
        console.error('load schedule failed', err);
        // fallback sample or empty state
        setHeaders(['Date','Round','6:30 PM (Board 1)','6:30 PM (Board 2)','7:30 PM (Board 1)','7:30 PM (Board 2)','Bye Team']);
        setRows([]);
      }
    };

    load();
    return () => { mounted = false; };
  }, []);

  // styles matching TeamsTable
  const containerStyle = {
    maxWidth: 1100,
    margin: "2rem auto",
    background: "rgba(29, 30, 31, 1)",
    color: "#fff",
    padding: "2rem",
    borderRadius: 16
  };

  const tableStyle = {
    width: '100%',
    borderCollapse: 'separate',
    borderSpacing: '0 12px',
    minWidth: 520
  };

  const thStyle = {
    padding: '5px',
    textAlign: 'center',
    background: 'rgba(29, 30, 31, 1)',
    color: '#fff',
    fontWeight: 700
  };

  const tdStyle = {
    padding: '10px',
    color: '#fff'
  };

  const rowStyle = {
    background: '#111',
    borderRadius: 6
  };

  const roundHeaderStyle = {
    padding: '8px 12px',
    background: '#0e2230',
    color: '#cbd5e1',
    fontWeight: 700,
    borderRadius: 6,
    textAlign: 'left'
  };

  // render rows; insert a round header when Round cell changes (we expect one of the kept headers to be 'Round')
  const roundIdx = headers.findIndex(h => /round/i.test(h));
  let lastRound = null;

  return (
    <div style={containerStyle}>
      <h1 style={{ marginBottom: "1rem" }}>Schedule</h1>

      <div style={{ overflowX: 'auto' }}>
        <table style={tableStyle}>
          <thead>
            <tr>
              {headers.map((h, idx) => (
                <th key={h + idx} style={thStyle}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={headers.length} style={{ padding: 12, color: '#cbd5e1' }}>No schedule available</td></tr>
            ) : rows.map((r, rowIndex) => {
              // check for round header insertion
              const roundVal = roundIdx >= 0 ? r[roundIdx] : null;
              const insertRoundHeader = roundVal && roundVal !== lastRound;
              lastRound = roundVal || lastRound;

              return (
                <React.Fragment key={rowIndex}>

                  <tr style={rowStyle}>
                    {r.map((cell, ci) => (
                      <td key={ci} style={{ ...tdStyle, textAlign: ci === 0 ? 'left' : 'center' }}>
                        {cell || '—'}
                      </td>
                    ))}
                  </tr>
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Schedule;
