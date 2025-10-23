/**
 * Simple Google Analytics (gtag) initializer and helpers.
 * Expects REACT_APP_GA_ID to be set (e.g. G-XXXXXXXXXX).
 * Safe no-op when the env var is not present.
 */

export const initGA = () => {
  const GA_ID = process.env.REACT_APP_GA_ID;
  if (!GA_ID || typeof window === 'undefined') return;

  // avoid injecting twice
  if (window.gtag && window.__GA_INITIALIZED) return;
  window.__GA_INITIALIZED = true;

  // inject gtag script
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(script);

  // setup dataLayer and gtag function
  window.dataLayer = window.dataLayer || [];
  function gtag(){ window.dataLayer.push(arguments); }
  window.gtag = window.gtag || gtag;

  window.gtag('js', new Date());
  window.gtag('config', GA_ID, {
    send_page_view: false // we'll send manually to control SPA pageviews
  });
};

export const pageview = (path) => {
  const GA_ID = process.env.REACT_APP_GA_ID;
  if (!GA_ID || typeof window === 'undefined' || !window.gtag) return;
  window.gtag('config', GA_ID, { page_path: path });
};