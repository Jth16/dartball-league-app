import React from "react";
import headerImg from "../assets/Header2.png";

const HeaderImage = () => (
  <div
    style={{
      width: "100%",
      overflow: "hidden",
      // gradient that matches the image theme
      background:
        "radial-gradient(1200px 400px at 10% 10%, rgba(255,149,0,0.06), transparent 12%), " +
        "linear-gradient(135deg, #031323 0%, #07202a 35%, #08343a 65%, #062827 100%)",
      textAlign: "center",
      
      boxShadow: "0 6px 28px rgba(0,0,0,0.45)",
    }}
  >
    <img
      src={headerImg}
      alt="Labelle Dartball League"
      style={{
        width: "100%",        // fill full header width
        maxWidth: "none",
        height: 320,          // fixed height for a full-bleed look (adjust as needed)
        objectFit: "cover",   // crop to fill width without distortion
        display: "block",
      }}
    />
   
  </div>
);

export default HeaderImage;