import React, { useEffect, useRef, useState } from 'react';

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
          <p style={small}><strong>Dartball Tournament:</strong> Coming this January. Details to come!</p>

         
          
          <p style={small}>Entry to the Firehall will be either through the Truck Room or the Bar. The Main Hall doors will be closed on Dartball Night.</p>
          <p style={small}>Please plan accordingly and arrive early to avoid any issues.</p>
          <p style={small}><strong>Reminder:</strong> There is NO smoking/vaping in the hall. Smoking/Vaping is permitted in the Bar area only</p>
          <p style={small}><strong>Current Makeups:</strong></p>
          <ul style={{ color: '#cbd5e1', fontSize: isMobile ? 16 : 14, lineHeight: 1.45, marginTop: 0 }}>
            <li>Average Bo's vs Prince of Dartness (Dec. 1st)</li>
          </ul>
          <div style={{ marginTop: 10 }}>
            <a
              href="/rules"
              onClick={handleRulesClick}
              style={{
                display: 'inline-block',
                padding: '8px 12px',
                borderRadius: 8,
                background: 'linear-gradient(90deg,#7a2b00,#c2410c)',
                color: '#fff',
                textDecoration: 'none',
                fontWeight: 700
              }}
            >
             League Rules
            </a>
          </div>
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