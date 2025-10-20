import React from "react";
import headerImg from "../assets/HeaderImg.png"; // Make sure HeaderImg.png is in src/assets/

const HeaderImage = () => (
  <div
    style={{
      width: "100%",
      background: "linear-gradient(90deg, #ff9800 0%, #232526 100%)",
      padding: "2rem 0 1.5rem 0",
      textAlign: "center",
      marginBottom: "2rem",
      boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
    }}
  >
    <img
      src={headerImg}
      alt="Labelle Dartball League"
      style={{
        maxWidth: "400px",
        width: "100%",
        marginBottom: "1rem",
        filter: "drop-shadow(2px 2px 8px #000)",
      }}
    />
    <div
      style={{
        fontFamily: "'Bebas Neue', 'Segoe UI', Arial, sans-serif",
        fontSize: "3rem",
        color: "#fff",
        letterSpacing: "0.2em",
        textShadow: "2px 2px 8px #000, 0 0 8px #ff9800",
        fontWeight: "bold",
        textTransform: "uppercase",
      }}
    >
      Labelle Dartball League
    </div>
  </div>
);

export default HeaderImage;