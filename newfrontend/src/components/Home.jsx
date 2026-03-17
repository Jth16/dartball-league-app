import React, { useEffect, useRef, useState } from 'react';
import Playoffs from './Playoffs';

const Home = (props) => {
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' && window.matchMedia ? window.matchMedia('(max-width:600px)').matches : false);
  const fbRef = useRef(null);

  useEffect(() => {
    const mq = window.matchMedia('(max-width:600px)');
    const handler = (e) => setIsMobile(e.matches);
    if (mq.addEventListener) mq.addEventListener('change', handler);
    else mq.addListener(handler);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener('change', handler);
      else mq.removeListener(handler);
    };
  }, []);

  const container = {
    maxWidth: 1100,
    margin: '2rem auto',
    padding: '1.5rem',
    borderRadius: 14,
    background: 'linear-gradient(180deg, rgba(8,18,24,0.95) 0%, rgba(6,30,36,0.95) 100%)',
    color: '#e6f7ff',
    boxShadow: '0 10px 30px rgba(2,6,8,0.6)',
    boxSizing: 'border-box'
  };

  const title = { margin: 0, fontSize: isMobile ? '1.4rem' : '1.6rem', color: '#fff' };
  const lead = { color: '#ffd7b0', marginTop: 8, marginBottom: 16, fontSize: isMobile ? '1.05rem' : undefined };
  const blurb = {
    background: 'linear-gradient(180deg,#07101a 0%, #0b1520 100%)',
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
    color: '#e6f7ff',
    boxShadow: 'inset 0 -1px 0 rgba(255,255,255,0.02)'
  };

  const accentBar = {
    height: 6,
    borderRadius: 6,
    background: 'linear-gradient(90deg,#7a2b00,#c2410c,#ff8a00)',
    margin: '14px 0'
  };

  const small = { color: '#cbd5e1', fontSize: isMobile ? 16 : 14, lineHeight: 1.45 };

  useEffect(() => {
    // load SDK once
    const id = 'facebook-jssdk';
    if (!document.getElementById(id)) {
      const script = document.createElement('script');
      script.id = id;
      script.src = 'https://connect.facebook.net/en_US/sdk.js#xfbml=1&version=v17.0';
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
      script.onload = () => {
        try {
          if (window.FB && fbRef.current) window.FB.XFBML.parse(fbRef.current);
        } catch (e) { /* ignore */ }
      };
      return;
    }

    if (window.FB && fbRef.current) {
      try { window.FB.XFBML.parse(fbRef.current); } catch (e) { /* ignore */ }
    }
  }, []);

  const handleRulesClick = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (typeof props?.onNavigate === 'function') {
      props.onNavigate('rules');
    } else {
      // fallback to event if prop not provided
      window.dispatchEvent(new CustomEvent('navigate', { detail: { page: 'rules' } }));
    }
  };

  return (
    <main style={container} data-page="home">
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={title}>Welcome to Labelle Dartball League</h1>
          <div style={lead}>Standings, leaders and the full schedule for the current season.</div>
        </div>
      </header>

      <div style={accentBar} />

      <section style={{ marginTop: 6 }}>
        <div style={blurb}>
          <h3 style={{ margin: '0 0 8px 0' }}>Latest News</h3>
         
          <p style={small}>Entry to the Firehall will be either through the Truck Room or the Bar. The Main Hall doors will be closed on Dartball Night.</p>
          <p style={small}>Please plan accordingly and arrive early to avoid any issues.</p>
          <p style={small}><strong>Reminder:</strong> There is NO smoking/vaping in the hall. Smoking/Vaping is permitted in the Bar area only</p>
          
          <div style={{ borderLeft: '3px solid #c2410c', paddingLeft: 12, marginBottom: 14 }}>
            <p style={{ color: '#ff9800', fontSize: isMobile ? 13 : 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 4px 0' }}>Round 1 Recap · Mar 16</p>
            <p style={{ color: '#fff', fontSize: isMobile ? 17 : 15, fontWeight: 700, margin: '0 0 8px 0' }}>KGB Survives Thriller to Advance Past The Old & the New</p>
            <p style={small}>In the most dramatic series of the first round, #2 KGB edged out #7 The Old & the New in a hard-fought five-game series. The Old & the New came out swinging, taking Game 1 convincingly <strong>9–4</strong> and silencing the second seed early. KGB responded with back-to-back wins — a tight <strong>4–1</strong> victory in Game 2 followed by a dominant <strong>10–5</strong> performance in Game 3 to take control of the series.</p>
            <p style={small}>But The Old & the New refused to go quietly, clawing back with a gutsy <strong>4–3</strong> win in Game 4 to force a deciding fifth game. With everything on the line, KGB rose to the moment and shut the door with an <strong>8–3</strong> victory to close out the series 3–2 and advance to the semifinals.</p>
            <table style={{ borderCollapse: 'collapse', width: '100%', marginTop: 10, fontSize: isMobile ? 14 : 12 }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', color: '#ff9800', padding: '3px 8px', borderBottom: '1px solid #1e3a50' }}>Game</th>
                  <th style={{ textAlign: 'center', color: '#ff9800', padding: '3px 8px', borderBottom: '1px solid #1e3a50' }}>KGB</th>
                  <th style={{ textAlign: 'center', color: '#ff9800', padding: '3px 8px', borderBottom: '1px solid #1e3a50' }}>Old & New</th>
                  <th style={{ textAlign: 'left', color: '#ff9800', padding: '3px 8px', borderBottom: '1px solid #1e3a50' }}>Winner</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { game: 'Game 1', kgb: 4, otn: 9, winner: 'The Old & the New' },
                  { game: 'Game 2', kgb: 4, otn: 1, winner: 'KGB' },
                  { game: 'Game 3', kgb: 10, otn: 5, winner: 'KGB' },
                  { game: 'Game 4', kgb: 3, otn: 4, winner: 'The Old & the New' },
                  { game: 'Game 5', kgb: 8, otn: 3, winner: 'KGB' },
                ].map(({ game, kgb, otn, winner }) => (
                  <tr key={game}>
                    <td style={{ padding: '3px 8px', color: '#cbd5e1' }}>{game}</td>
                    <td style={{ padding: '3px 8px', textAlign: 'center', fontWeight: kgb > otn ? 700 : 400, color: kgb > otn ? '#fff' : '#7a8fa0' }}>{kgb}</td>
                    <td style={{ padding: '3px 8px', textAlign: 'center', fontWeight: otn > kgb ? 700 : 400, color: otn > kgb ? '#fff' : '#7a8fa0' }}>{otn}</td>
                    <td style={{ padding: '3px 8px', color: '#cbd5e1' }}>{winner}</td>
                  </tr>
                ))}
                <tr style={{ borderTop: '1px solid #1e3a50' }}>
                  <td style={{ padding: '4px 8px', color: '#ff9800', fontWeight: 700 }}>Series</td>
                  <td style={{ padding: '4px 8px', textAlign: 'center', color: '#fff', fontWeight: 700 }}>3</td>
                  <td style={{ padding: '4px 8px', textAlign: 'center', color: '#7a8fa0', fontWeight: 700 }}>2</td>
                  <td style={{ padding: '4px 8px', color: '#ff9800', fontWeight: 700 }}>KGB wins</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div style={{ borderLeft: '3px solid #c2410c', paddingLeft: 12, marginBottom: 14 }}>
            <p style={{ color: '#ff9800', fontSize: isMobile ? 13 : 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 4px 0' }}>Round 1 Recap · Mar 16</p>
            <p style={{ color: '#fff', fontSize: isMobile ? 17 : 15, fontWeight: 700, margin: '0 0 8px 0' }}>BBD Rolls Through Labelle Firehall in Dominant Sweep</p>
            <p style={small}>#1 seed BBD wasted no time asserting themselves as the team to beat, dispatching #8 Labelle Firehall in a clean three-game sweep. BBD set the tone immediately with a dominant <strong>10–2</strong> victory in Game 1, leaving no doubt about the talent gap. They kept the pressure on in Game 2, winning a tighter <strong>3–1</strong> contest before closing out the series with a <strong>6–3</strong> victory in Game 3. Labelle Firehall — who earned their spot by winning the play-in — had no answers for BBD's offense across all three games.</p>
            <table style={{ borderCollapse: 'collapse', width: '100%', marginTop: 10, fontSize: isMobile ? 14 : 12 }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', color: '#ff9800', padding: '3px 8px', borderBottom: '1px solid #1e3a50' }}>Game</th>
                  <th style={{ textAlign: 'center', color: '#ff9800', padding: '3px 8px', borderBottom: '1px solid #1e3a50' }}>BBD</th>
                  <th style={{ textAlign: 'center', color: '#ff9800', padding: '3px 8px', borderBottom: '1px solid #1e3a50' }}>Labelle</th>
                  <th style={{ textAlign: 'left', color: '#ff9800', padding: '3px 8px', borderBottom: '1px solid #1e3a50' }}>Winner</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { game: 'Game 1', bbd: 10, lf: 2, winner: 'BBD' },
                  { game: 'Game 2', bbd: 3, lf: 1, winner: 'BBD' },
                  { game: 'Game 3', bbd: 6, lf: 3, winner: 'BBD' },
                ].map(({ game, bbd, lf, winner }) => (
                  <tr key={game}>
                    <td style={{ padding: '3px 8px', color: '#cbd5e1' }}>{game}</td>
                    <td style={{ padding: '3px 8px', textAlign: 'center', fontWeight: bbd > lf ? 700 : 400, color: bbd > lf ? '#fff' : '#7a8fa0' }}>{bbd}</td>
                    <td style={{ padding: '3px 8px', textAlign: 'center', fontWeight: lf > bbd ? 700 : 400, color: lf > bbd ? '#fff' : '#7a8fa0' }}>{lf}</td>
                    <td style={{ padding: '3px 8px', color: '#cbd5e1' }}>{winner}</td>
                  </tr>
                ))}
                <tr style={{ borderTop: '1px solid #1e3a50' }}>
                  <td style={{ padding: '4px 8px', color: '#ff9800', fontWeight: 700 }}>Series</td>
                  <td style={{ padding: '4px 8px', textAlign: 'center', color: '#fff', fontWeight: 700 }}>3</td>
                  <td style={{ padding: '4px 8px', textAlign: 'center', color: '#7a8fa0', fontWeight: 700 }}>0</td>
                  <td style={{ padding: '4px 8px', color: '#ff9800', fontWeight: 700 }}>BBD wins</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div style={{ borderLeft: '3px solid #c2410c', paddingLeft: 12, marginBottom: 14 }}>
            <p style={{ color: '#ff9800', fontSize: isMobile ? 13 : 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 4px 0' }}>Round 1 Recap · Mar 16</p>
            <p style={{ color: '#fff', fontSize: isMobile ? 17 : 15, fontWeight: 700, margin: '0 0 8px 0' }}>Tipsy Tossers Rally Past Hillbillies to Advance</p>
            <p style={small}>The Hillbillies came out firing in Game 1, shutting out the Tipsy Tossers <strong>2–0</strong> and drawing first blood. But the Tossers flipped the script completely in Games 2 and 3 — edging out a <strong>2–1</strong> win before exploding for a dominant <strong>12–3</strong> blowout that made a statement to the rest of the bracket. The Hillbillies couldn't recover, falling <strong>3–1</strong> in Game 4 as Tipsy Tossers closed out the series 3–1 and punched their ticket to the semifinals.</p>
            <table style={{ borderCollapse: 'collapse', width: '100%', marginTop: 10, fontSize: isMobile ? 14 : 12 }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', color: '#ff9800', padding: '3px 8px', borderBottom: '1px solid #1e3a50' }}>Game</th>
                  <th style={{ textAlign: 'center', color: '#ff9800', padding: '3px 8px', borderBottom: '1px solid #1e3a50' }}>Hillbillies</th>
                  <th style={{ textAlign: 'center', color: '#ff9800', padding: '3px 8px', borderBottom: '1px solid #1e3a50' }}>Tipsy Tossers</th>
                  <th style={{ textAlign: 'left', color: '#ff9800', padding: '3px 8px', borderBottom: '1px solid #1e3a50' }}>Winner</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { game: 'Game 1', hb: 2, tt: 0, winner: 'Hillbillies' },
                  { game: 'Game 2', hb: 1, tt: 2, winner: 'Tipsy Tossers' },
                  { game: 'Game 3', hb: 3, tt: 12, winner: 'Tipsy Tossers' },
                  { game: 'Game 4', hb: 1, tt: 3, winner: 'Tipsy Tossers' },
                ].map(({ game, hb, tt, winner }) => (
                  <tr key={game}>
                    <td style={{ padding: '3px 8px', color: '#cbd5e1' }}>{game}</td>
                    <td style={{ padding: '3px 8px', textAlign: 'center', fontWeight: hb > tt ? 700 : 400, color: hb > tt ? '#fff' : '#7a8fa0' }}>{hb}</td>
                    <td style={{ padding: '3px 8px', textAlign: 'center', fontWeight: tt > hb ? 700 : 400, color: tt > hb ? '#fff' : '#7a8fa0' }}>{tt}</td>
                    <td style={{ padding: '3px 8px', color: '#cbd5e1' }}>{winner}</td>
                  </tr>
                ))}
                <tr style={{ borderTop: '1px solid #1e3a50' }}>
                  <td style={{ padding: '4px 8px', color: '#ff9800', fontWeight: 700 }}>Series</td>
                  <td style={{ padding: '4px 8px', textAlign: 'center', color: '#7a8fa0', fontWeight: 700 }}>1</td>
                  <td style={{ padding: '4px 8px', textAlign: 'center', color: '#fff', fontWeight: 700 }}>3</td>
                  <td style={{ padding: '4px 8px', color: '#ff9800', fontWeight: 700 }}>Tipsy Tossers win</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div style={{ borderLeft: '3px solid #c2410c', paddingLeft: 12, marginBottom: 14 }}>
            <p style={{ color: '#ff9800', fontSize: isMobile ? 13 : 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 4px 0' }}>Round 1 Recap · Mar 16</p>
            <p style={{ color: '#fff', fontSize: isMobile ? 17 : 15, fontWeight: 700, margin: '0 0 8px 0' }}>Softball Dads Grind Out Three Tight Wins to Upset Prince of Dartness</p>
            <p style={small}>Prince of Dartness looked like the clear favorites after a commanding <strong>11–3</strong> blowout in Game 1, but Softball Dads refused to be swept aside. They answered with a <strong>3–1</strong> win in Game 2 to even the series, then delivered back-to-back nail-biters — winning Game 3 <strong>5–4</strong> and Game 4 <strong>5–4</strong> — to close out the series 3–1. Three consecutive one-run victories is a testament to the Dads' composure under pressure, and they now advance to the semifinals as one of the most dangerous teams left in the bracket.</p>
            <table style={{ borderCollapse: 'collapse', width: '100%', marginTop: 10, fontSize: isMobile ? 14 : 12 }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', color: '#ff9800', padding: '3px 8px', borderBottom: '1px solid #1e3a50' }}>Game</th>
                  <th style={{ textAlign: 'center', color: '#ff9800', padding: '3px 8px', borderBottom: '1px solid #1e3a50' }}>Softball Dads</th>
                  <th style={{ textAlign: 'center', color: '#ff9800', padding: '3px 8px', borderBottom: '1px solid #1e3a50' }}>Pr. of Dartness</th>
                  <th style={{ textAlign: 'left', color: '#ff9800', padding: '3px 8px', borderBottom: '1px solid #1e3a50' }}>Winner</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { game: 'Game 1', sd: 3, pod: 11, winner: 'Prince of Dartness' },
                  { game: 'Game 2', sd: 3, pod: 1, winner: 'Softball Dads' },
                  { game: 'Game 3', sd: 5, pod: 4, winner: 'Softball Dads' },
                  { game: 'Game 4', sd: 5, pod: 4, winner: 'Softball Dads' },
                ].map(({ game, sd, pod, winner }) => (
                  <tr key={game}>
                    <td style={{ padding: '3px 8px', color: '#cbd5e1' }}>{game}</td>
                    <td style={{ padding: '3px 8px', textAlign: 'center', fontWeight: sd > pod ? 700 : 400, color: sd > pod ? '#fff' : '#7a8fa0' }}>{sd}</td>
                    <td style={{ padding: '3px 8px', textAlign: 'center', fontWeight: pod > sd ? 700 : 400, color: pod > sd ? '#fff' : '#7a8fa0' }}>{pod}</td>
                    <td style={{ padding: '3px 8px', color: '#cbd5e1' }}>{winner}</td>
                  </tr>
                ))}
                <tr style={{ borderTop: '1px solid #1e3a50' }}>
                  <td style={{ padding: '4px 8px', color: '#ff9800', fontWeight: 700 }}>Series</td>
                  <td style={{ padding: '4px 8px', textAlign: 'center', color: '#fff', fontWeight: 700 }}>3</td>
                  <td style={{ padding: '4px 8px', textAlign: 'center', color: '#7a8fa0', fontWeight: 700 }}>1</td>
                  <td style={{ padding: '4px 8px', color: '#ff9800', fontWeight: 700 }}>Softball Dads win</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div style={{ borderLeft: '3px solid #c2410c', paddingLeft: 12, marginBottom: 14 }}>
            <p style={{ color: '#ff9800', fontSize: isMobile ? 13 : 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 4px 0' }}>Semifinal Preview · Mar 18</p>
            <p style={{ color: '#fff', fontSize: isMobile ? 17 : 15, fontWeight: 700, margin: '0 0 8px 0' }}>#1 BBD vs. #5 Softball Dads — Can the Dads Keep the Magic Going?</p>
            <p style={small}>After a dominant sweep of Labelle Firehall in Round 1, top-seeded BBD enters the semifinals with all the momentum — and a chip on their shoulder. The Dads, meanwhile, pulled off one of the more impressive upsets of the first round, grinding out three consecutive wins over the favored Prince of Dartness, including back-to-back <strong>5–4</strong> nail-biters that showcased their mental toughness. BBD's offense was relentless in Round 1, outscoring their opponent <strong>19–6</strong> across three games. But Softball Dads have proven they can win close games, and they'll need that composure again on Wednesday night.</p>
            <p style={small}>Expect a exciting, grind-it-out series. BBD has the edge in raw firepower, but if Softball Dads can make it ugly and keep things close, anything is possible in a best-of-five.</p>
            <p style={{ color: '#7a8fa0', fontSize: isMobile ? 12 : 11, margin: '6px 0 0 0' }}>Wed, Mar 18 · 6:30 PM · Bd. 1 · Best of 5</p>
          </div>

          <div style={{ borderLeft: '3px solid #c2410c', paddingLeft: 12, marginBottom: 14 }}>
            <p style={{ color: '#ff9800', fontSize: isMobile ? 13 : 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 4px 0' }}>Semifinal Preview · Mar 18</p>
            <p style={{ color: '#fff', fontSize: isMobile ? 17 : 15, fontWeight: 700, margin: '0 0 8px 0' }}>#2 KGB vs. #6 Tipsy Tossers — A Battle-Tested Rematch Waiting to Happen</p>
            <p style={small}>KGB is the most battle-tested team left in the bracket after surviving a grueling five-game war against The Old & the New in Round 1. They went down early, clawed back, but lost again in Game 4, and then slammed the door with an <strong>8–3</strong> Game 5 victory. That kind of adversity either breaks a team — or makes them dangerous. KGB looks dangerous.</p>
            <p style={small}>Standing in their way are the Tipsy Tossers, who started slow — dropping Game 1 <strong>0–2</strong> to the Hillbillies — before exploding for back-to-back wins including a stunning <strong>12–3</strong> blowout in Game 3. The Tossers bring unpredictable offense that can either go quiet or erupt without warning. If their bats come alive early, KGB's depth will be put to the test in what could be the most entertaining matchup of the semifinals.</p>
            <p style={{ color: '#7a8fa0', fontSize: isMobile ? 12 : 11, margin: '6px 0 0 0' }}>Wed, Mar 18 · 6:30 PM · Bd. 2 · Best of 5</p>
          </div>

         
          
        <Playoffs />
         <p style={small}><strong>End of Year Schedule:</strong></p>
          <ul style={{ color: '#cbd5e1', fontSize: isMobile ? 16 : 14, lineHeight: 1.45, marginTop: 0 }}>

            <li><strong>Mar. 18th (Wed) - Playoffs - Rd. 2</strong></li>
                <p>6:30 PM Bd. 1 - BBD vs. Softball Dads (Best of 5 series)</p>
                <p>6:30 PM Bd. 2 - KGB vs. Tipsy Tossers (Best of 5 series)</p>
            <li><strong>Mar. 21st (Sat) - Championship Game & End of Year Party</strong></li>
                <p>Doors open at 5:30</p>
                <p>3rd Place game starts at 6:00 PM (Best of 5 Series)</p>
                <p>Championship game starts at 7:00 PM (Best of 7 Series)</p>
                <p>Free Food - Pop - Beer</p>
                <p>DJ and St. Patty's Party starting at 7:00pm</p>
            
          </ul>
          <p style={small}><strong>Playoffs Payouts (Paid March 21st):</strong></p>
          <ul style={{ color: '#cbd5e1', fontSize: isMobile ? 16 : 14, lineHeight: 1.45, marginTop: 0 }}>
            <li>Championship Team: $800.00</li>
            <li>Runner-Up Team: $500.00</li>
            <li>3rd Place Team: $200.00</li>
          </ul>      
        </div>


        <div style={blurb}>
          <h3 style={{ margin: '0 0 8px 0' }}>Follow Us on Facebook</h3>
          <p style={small}>Stay updated with the latest news, events, and highlights by following our official Facebook page.</p>
        </div>
        <div style={{ marginTop: 12, display: 'flex', justifyContent: 'center' }}>
          <div ref={fbRef} style={{ width: '100%', maxWidth: 720,textAlign: 'center' }}>
            <div
              className="fb-page"
              data-href="https://www.facebook.com/LTVFC23"
              data-tabs="timeline"
              data-width="720"
              data-height="600"
              data-small-header="false"
              data-adapt-container-width="true"
              data-hide-cover="false"
              data-show-facepile="true"
            >
              <blockquote
                cite="https://www.facebook.com/LTVFC23"
                className="fb-xfbml-parse-ignore"
              >
                <a href="https://www.facebook.com/LTVFC23">Facebook</a>
              </blockquote>
            </div>

            <noscript>
              <iframe
                title="Facebook Page"
                src={`https://www.facebook.com/plugins/page.php?href=${encodeURIComponent('https://www.facebook.com/LTVFC23')}&tabs=timeline&width=720&height=600&small_header=false&adapt_container_width=true&hide_cover=false&show_facepile=true`}
                style={{ border: 'none', overflow: 'hidden', width: '100%', height: 600, maxWidth: '720px' }}
                scrolling="no"
                frameBorder="0"
                allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
              />
            </noscript>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Home;