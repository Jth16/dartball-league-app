import React, { useEffect, useState } from "react";

// Neon bar-sign header with a row of info "tubes" fed from the schedule CSV.
// Styles live in index.css under .neon-header (needs keyframes + media queries).

const DATE_RE = /"([A-Z][a-z]{2} \d{1,2}, \d{4}) \((\w{3})\)"/;

const parseSchedule = (text) => {
  const lines = text.split(/\r?\n/);
  const time = (lines[0].match(/(\d{1,2}:\d{2} [AP]M)/) || [])[1] || "";
  const nights = [];
  for (const line of lines.slice(1)) {
    const m = line.match(DATE_RE);
    if (m) nights.push({ date: new Date(m[1]) });
  }
  return { time, nights };
};

const fmtDay = (d) => d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

const HeaderImage = () => {
  const [info, setInfo] = useState(null);

  useEffect(() => {
    let mounted = true;
    fetch(encodeURI("/Newest-Darts-Schedule.csv"), { cache: "no-cache" })
      .then((res) => (res.ok ? res.text() : Promise.reject(new Error(`CSV fetch failed: ${res.status}`))))
      .then((text) => {
        if (!mounted || text.trim().startsWith("<")) return;
        const { time, nights } = parseSchedule(text);
        if (nights.length === 0) return;

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const next = nights.find((n) => n.date >= today);

        let label = "Next game night";
        if (next && next.date.getTime() === today.getTime()) label = "Tonight";

        setInfo({
          label: next ? label : "Season",
          when: next ? `${fmtDay(next.date)}${time ? ` · ${time}` : ""}` : "Complete",
        });
      })
      .catch((err) => console.error("header schedule load failed", err));
    return () => { mounted = false; };
  }, []);

  return (
    <header className="neon-header">
      <svg className="neon-dart" viewBox="0 0 120 24" fill="none" stroke="#e6f2ff" strokeWidth="2.2"
        strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M4 12h22M26 8l10 4-10 4M36 12h46M82 9h18l8 3-8 3H82z" />
        <path d="M100 9l14-7M100 15l14 7M106 12h10" />
      </svg>
      <h1 className="neon-title">LaBelle Dartball</h1>
      <div className="neon-sub">League</div>

      {info && (
        <div className="neon-strip">
          <div className="neon-tube amber"><small>{info.label}</small>{info.when}</div>
        </div>
      )}
    </header>
  );
};

export default HeaderImage;
