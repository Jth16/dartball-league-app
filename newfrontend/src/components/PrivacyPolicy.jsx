import React from "react";

function PrivacyPolicy() {
  return (
    <div style={{ color: "#ccc", lineHeight: 1.7, maxWidth: 700, margin: "0 auto" }}>
      <h2 style={{ color: "#ff9800", marginBottom: "0.5rem" }}>Privacy Policy</h2>
      <p style={{ color: "#888", fontSize: "0.85rem", marginBottom: "2rem" }}>
        Last updated: February 2026
      </p>

      <section style={{ marginBottom: "1.75rem" }}>
        <h3 style={{ color: "#fff", marginBottom: "0.5rem" }}>Overview</h3>
        <p>
          The Labelle Dartball League website ("we", "us") provides league standings, player
          statistics, schedules, and related information. This Privacy Policy explains what
          information is collected when you visit this site and how it is used.
        </p>
      </section>

      <section style={{ marginBottom: "1.75rem" }}>
        <h3 style={{ color: "#fff", marginBottom: "0.5rem" }}>Information We Collect</h3>
        <p>
          We do not require you to create an account or submit personal information to use this
          site. The only data collected is:
        </p>
        <ul style={{ paddingLeft: "1.5rem", marginTop: "0.5rem" }}>
          <li>
            <strong style={{ color: "#ff9800" }}>Usage analytics</strong> — page views and
            navigation patterns collected via Google Analytics. This data is anonymous and
            aggregated; it does not identify you personally.
          </li>
          <li style={{ marginTop: "0.5rem" }}>
            <strong style={{ color: "#ff9800" }}>Advertising data</strong> — ads on this site are
            served by Google AdSense. Google may use cookies to serve ads based on your prior
            visits to this and other websites.
          </li>
        </ul>
      </section>

      <section style={{ marginBottom: "1.75rem" }}>
        <h3 style={{ color: "#fff", marginBottom: "0.5rem" }}>Cookies</h3>
        <p>
          This site uses cookies placed by Google Analytics and Google AdSense. You can opt out
          of personalized advertising by visiting{" "}
          <a
            href="https://www.google.com/settings/ads"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "#ff9800" }}
          >
            Google's Ad Settings
          </a>
          . You can also disable cookies in your browser settings.
        </p>
      </section>

      <section style={{ marginBottom: "1.75rem" }}>
        <h3 style={{ color: "#fff", marginBottom: "0.5rem" }}>Player Statistics</h3>
        <p>
          Player names and game statistics displayed on this site are league records maintained
          by league administration. If you are a league participant and wish to have your
          information removed or corrected, contact a league administrator.
        </p>
      </section>

      <section style={{ marginBottom: "1.75rem" }}>
        <h3 style={{ color: "#fff", marginBottom: "0.5rem" }}>Third-Party Links</h3>
        <p>
          This site may contain links to external websites. We are not responsible for the
          privacy practices of those sites.
        </p>
      </section>

      <section style={{ marginBottom: "1.75rem" }}>
        <h3 style={{ color: "#fff", marginBottom: "0.5rem" }}>Data Sharing</h3>
        <p>
          We do not sell, trade, or share any personal information with third parties. Analytics
          and advertising data is processed solely by Google under their own privacy policies.
        </p>
      </section>

      <section style={{ marginBottom: "1.75rem" }}>
        <h3 style={{ color: "#fff", marginBottom: "0.5rem" }}>Changes to This Policy</h3>
        <p>
          We may update this Privacy Policy from time to time. Changes will be reflected by the
          updated date at the top of this page.
        </p>
      </section>

      <section>
        <h3 style={{ color: "#fff", marginBottom: "0.5rem" }}>Contact</h3>
        <p>
          For questions about this Privacy Policy, please contact a league administrator through
          the league's official channels.
        </p>
      </section>
    </div>
  );
}

export default PrivacyPolicy;
