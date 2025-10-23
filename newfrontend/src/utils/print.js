export function printElement(el, options = {}) {
  if (!el) {
    console.warn('printElement: no element provided');
    return;
  }

  // if caller asked to include the container, prefer the nearest printable ancestor
  if (options.includeContainer) {
    const container = el.closest && (el.closest('[data-printable]') || el.closest('.printable'));
    if (container) el = container;
  }

  // ensure el is a DOM element
  if (!(el instanceof Element)) {
    console.warn('printElement: provided value is not a DOM Element', el);
    return;
  }

  // open popup (avoid noopener so we can write & focus reliably)
  const win = window.open('', '_blank');
  if (!win) {
    console.warn('printElement: popup blocked');
    alert('Popup blocked. Please allow popups for this site to print.');
    return;
  }

  const title = document.title || '';
  const baseHref = window.location.href;

  // collect stylesheet links (convert to absolute) and inline <style> tags
  const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
    .map(link => {
      try {
        const href = link.getAttribute('href') || link.href;
        return `<link rel="stylesheet" href="${new URL(href, baseHref).href}">`;
      } catch {
        return '';
      }
    }).join('\n');

  const inlineStyles = Array.from(document.querySelectorAll('style'))
    .map(s => s.outerHTML).join('\n');

  // clone the element so we can remove print-only controls (like the Print button)
  const clone = el.cloneNode(true);
  // remove anything marked to exclude from print
  try {
    clone.querySelectorAll && clone.querySelectorAll('.no-print, [data-print-exclude]').forEach(n => n.remove());
  } catch (err) { /* ignore */ }

  // build extra print styles; allow caller to specify a smaller font size via options.fontSize
  const fontSizeRule = options.fontSize ? `body, body * { font-size: ${options.fontSize} !important; }` : '';
  const cellPaddingRule = options.cellPadding ? `td, th { padding: ${options.cellPadding} !important; }` : '';

  const extraPrintStyles = `<style>
    @media print {
      /* hide UI controls */
      .no-print, [data-print-exclude] { display: none !important; }

      /* force black text on white background and remove decorative styling */
      html, body {
        background: #fff !important;
        color: #000 !important;
      }
      * {
        background: transparent !important;
        background-image: none !important;
        color: #000 !important;
        box-shadow: none !important;
        text-shadow: none !important;
        -webkit-filter: none !important;
        filter: none !important;
      }

      /* make links visible but plain */
      a, a:visited, a:link { color: #000 !important; text-decoration: underline !important; }

      /* tables: keep structure but remove heavy fills */
      table { border-collapse: collapse !important; background: transparent !important; }
      td, th { background: transparent !important; color: #000 !important; }

      /* ensure images still print but without color filters */
      img { max-width: 100% !important; height: auto !important; -webkit-filter: none !important; filter: none !important; }

      /* safety: hide anything explicitly marked no-print again */
      .no-print, [data-print-exclude] { display: none !important; }

      /* optional font-size override injected from options */
      ${fontSizeRule}
      /* optional cell padding override */
      ${cellPaddingRule}
    }
  </style>`;

  const markup = `<!doctype html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width,initial-scale=1">
        <title>${title}</title>
        ${styles}
        ${inlineStyles}
        ${extraPrintStyles}
      </head>
      <body>
        ${clone.outerHTML}
      </body>
    </html>`;

  try {
    win.document.open();
    win.document.write(markup);
    win.document.close();
  } catch (err) {
    console.error('printElement: write failed', err);
    win.close();
    alert('Unable to open print window. Check popup settings.');
    return;
  }

  // wait for the popup document to be ready, then print
  const timeout = 5000;
  const start = Date.now();

  const checkAndPrint = () => {
    try {
      if (win.closed) return;

      const doc = win.document;
      if (doc && (doc.readyState === 'complete' || doc.body)) {
        setTimeout(() => {
          try {
            win.focus();
            win.print();
            win.close();
          } catch (err) {
            console.error('printElement: print failed', err);
            try { win.close(); } catch {}
          }
        }, 200);
        return;
      }

      if (Date.now() - start < timeout) {
        setTimeout(checkAndPrint, 150);
      } else {
        try {
          win.focus();
          win.print();
          win.close();
        } catch (err) {
          console.error('printElement: timed out', err);
          try { win.close(); } catch {}
        }
      }
    } catch (err) {
      console.error('printElement: error during check', err);
    }
  };

  checkAndPrint();
}