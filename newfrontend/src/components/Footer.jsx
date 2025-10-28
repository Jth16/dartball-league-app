import React, { useEffect } from 'react';

const Footer = () => {
  useEffect(() => {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      // ignore if push fails (e.g. script blocked in dev)
    }
  }, []);

  return (
    <footer style={{ padding: 16, textAlign: 'center' }}>
      {/* responsive centered ad; replace data-ad-slot with your slot id */}
      <ins className="adsbygoogle"
           style={{ display: 'block', margin: '0 auto' }}
           data-ad-client="ca-pub-8937633356774898"
           data-ad-slot="YOUR_AD_SLOT"
           data-ad-format="auto"
           data-full-width-responsive="true"></ins>
    </footer>
  );
};

export default Footer;