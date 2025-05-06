import React from "react";
import "./Scroller.css";

const Scroller: React.FC = () => {
  const scrollText =
    "+++ 2 SPACE & BEYOND presents: Music intro 2025 !!! +++                   +++ Design, sfx and gfx by sz1 --- Code by AI (Gemini 2.5 Pro) --- Amiga topaz font by P.H. Lauke +++                   +++ Greetings to my family, all my friends and colleagues plus people from the old demoscene !!! +++                   +++ (C) 2025 - 2 SPACE & BEYOND. +++";

  return (
    <div className="scroller-container">
      <div className="scroller-jump-wrapper">
        <div className="scroller-text">
          <span>{scrollText}</span>
        </div>
      </div>
    </div>
  );
};

export default Scroller;
