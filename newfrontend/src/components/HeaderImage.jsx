import React from "react";
import headerImg from "../assets/newheader.jpg";

const HeaderImage = () => (
  <div
    style={{
      width: "100%",
      // richer gradient tuned to the header image: deep indigo -> teal with warm accent
      background:
        "radial-gradient(1200px 400px at 10% 10%, rgba(255,149,0,0.06), transparent 12%), " +
        "linear-gradient(135deg, #031323 0%, #07202a 35%, #08343a 65%, #062827 100%)",
      padding: "4rem 0 2.5rem 0",
      textAlign: "center",
      marginBottom: "2.5rem",
      boxShadow: "0 6px 28px rgba(0,0,0,0.45)",
    }}
  >
    <img
      src={headerImg}
      alt="Labelle Dartball League"
      style={{
        maxWidth: "900px",
        width: "100%",
        height: "auto",
        marginBottom: "1rem",
        borderRadius: 8,
        boxShadow: "0 10px 40px rgba(0,0,0,0.6)",
        filter: "saturate(1.05) contrast(1.02)",
      }}
    />
    <div
      style={{
        fontFamily: "'Bebas Neue', 'Segoe UI', Arial, sans-serif",
        fontSize: "3rem",
        color: "#fff",
        letterSpacing: "0.12em",
        textShadow: "2px 2px 6px rgba(0,0,0,0.7), 0 0 8px rgba(10,132,120,0.06)",
        fontWeight: 700,
        textTransform: "uppercase",
      }}
    >
      Labelle Dartball League
    </div>
  </div>
);

export default HeaderImage;