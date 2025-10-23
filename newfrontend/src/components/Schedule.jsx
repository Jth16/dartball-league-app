// filepath: c:\Source\VSCode Projects\dartball-league-app\newfrontend\src\components\Schedule.jsx
import React, { useEffect, useRef, useState } from 'react';
import { printElement } from '../utils/print';

const Schedule = () => {
  const containerRef = useRef(null);
  const tableRef = useRef(null);
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

  // Styles aligned with PlayersTable / TeamsTable theme (dark + dark-orange accent)
  const containerStyle = {
    maxWidth: 1100,
    margin: "2rem auto",
    background: "linear-gradient(180deg, rgba(8,18,24,0.95) 0%, rgba(6,30,36,0.95) 100%)",
    color: "#e6f7ff",
    padding: "1.5rem",
    borderRadius: 14,
    boxShadow: "0 10px 30px rgba(2,6,8,0.6)",
    boxSizing: "border-box"
  };

  const headerRowStyle = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12
  };

  const titleStyle = {
    margin: 0,
    color: "#fff",
    fontSize: "2rem",
    fontWeight: 700
  };

  const accentBar = {
    height: 6,
    borderRadius: 6,
    background: "linear-gradient(90deg,#7a2b00,#c2410c,#ff8a00)",
    marginTop: 10,
    boxShadow: "0 6px 18px rgba(194,65,12,0.08)"
  };

  const tableWrapStyle = {
    overflowX: "auto",
    borderRadius: 10,
    marginTop: 12
  };

  const tableStyle = {
    width: "100%",
    minWidth: 660,
    borderCollapse: "separate",
    borderSpacing: "0 10px",
    fontSize: "0.95rem",
    tableLayout: "fixed", // ensure header columns align with body
  };

  const thStyle = {
    padding: "8px 8px",
    textAlign: "center",
    color: "#ffe8d0",
    fontWeight: 700,
    background: "#222",
    boxSizing: "border-box"
  };

  // row style used for schedule rows
  const rowStyle = {
    background: "linear-gradient(180deg,#07101a 0%, #0b1520 100%)",
    color: "#fff",
    borderRadius: 8,
    boxShadow: "inset 0 -1px 0 rgba(255,255,255,0.02)",
    boxSizing: "border-box"
  };

  const cellStyle = {
    padding: "12px 14px",
    verticalAlign: "middle",
    boxSizing: "border-box",
    wordBreak: "break-word"
  };

  const dateCellStyle = {
    ...cellStyle,
    width: 160,
    fontWeight: 700,
    color: "#e6f7ff"
  };

  const roundHeaderStyle = {
    padding: "10px 12px",
    background: "#0e2230",
    color: "#cbd5e1",
    fontWeight: 700,
    borderRadius: 8,
    textAlign: "center"
  };

  // render rows; insert a round header when Round cell changes (we expect one of the kept headers to be 'Round')
  const roundIdx = headers.findIndex(h => /round/i.test(h));
  let lastRound = null;

  return (
    <div style={containerStyle} ref={containerRef} data-printable>
      <div style={headerRowStyle}>
        <h1 style={titleStyle}>Labelle Dartball 2025 Schedule</h1>
        <button
          className="no-print"
           onClick={() => printElement(containerRef.current, { fontSize: '11px', cellPadding: '4px' })}
          style={{
            padding: '6px 10px',
            cursor: 'pointer',
            borderRadius: 6,
            border: 'none',
            background: '#c2410c',
            color: '#fff',
            fontWeight: 700
          }}
        >
          Print
        </button>
      </div>

      <div style={accentBar} />

      <div style={{ height: 12 }} />

      <div style={tableWrapStyle}>
        <table style={tableStyle}>
          {/* colgroup gives the browser exact column widths so TH and TD align */}
          <colgroup>
            <col style={{ width: 160 }} />
            <col />
            <col />
            <col />
            <col style={{ width: 120 }} />
          </colgroup>
           <thead>
             <tr>
               <th style={thStyle}>Date</th>
               <th style={{ ...thStyle }}>6:30 PM Bd. 1</th>
               <th style={{ ...thStyle }}>6:30 PM Bd. 2</th>
               <th style={{ ...thStyle }}>7:30 PM Bd. 1</th>
               <th style={{ ...thStyle }}>7:30 PM Bd. 2</th>
               <th style={{ ...thStyle }}>Bye Team</th>
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

                   {insertRoundHeader && (
                     <tr><td colSpan="5" style={roundHeaderStyle}>Round {roundVal}</td></tr>
                   )}

                   <tr style={rowStyle}>
                     {r.map((cell, ci) => (
                       <td key={ci} style={{ ...dateCellStyle, textAlign: ci === 0 ? 'center' : 'center' }}>
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
