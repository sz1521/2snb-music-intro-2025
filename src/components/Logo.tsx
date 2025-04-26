import React, { useRef, useEffect, useState } from "react";
import "./Logo.css";

const Logo: React.FC = () => {
  const originalAsciiArt = `
██████      ███████ ██████   █████   ██████ ███████        ██        ██████  ███████ ██    ██  ██████  ███    ██ ██████     
     ██     ██      ██   ██ ██   ██ ██      ██             ██        ██   ██ ██       ██  ██  ██    ██ ████   ██ ██   ██    
 █████      ███████ ██████  ███████ ██      █████       ████████     ██████  █████     ████   ██    ██ ██ ██  ██ ██   ██    
██               ██ ██      ██   ██ ██      ██          ██  ██       ██   ██ ██         ██    ██    ██ ██  ██ ██ ██   ██    
███████     ███████ ██      ██   ██  ██████ ███████     ██████       ██████  ███████    ██     ██████  ██   ████ ██████  ██
`;

  const [isAndroid, setIsAndroid] = useState(false);
  const [displayContent, setDisplayContent] = useState<React.ReactNode>(
    originalAsciiArt.trim()
  );

  const moverRef = useRef<HTMLDivElement>(null);
  const asciiRef = useRef<HTMLPreElement>(null);
  const animationFrameIdRef = useRef<number | null>(null);

  useEffect(() => {
    const androidCheck = /Android/i.test(navigator.userAgent);
    setIsAndroid(androidCheck);

    if (androidCheck) {
      const lines = originalAsciiArt.trim().split("\n");
      const processedContent = lines.map((line, lineIndex) => (
        <React.Fragment key={`line-${lineIndex}`}>
          {line.split("").map((char, charIndex) =>
            char === " " ? (
              <span
                key={`char-${lineIndex}-${charIndex}`}
                style={{ color: "transparent" }}
              >
                █
              </span>
            ) : (
              char
            )
          )}
          {lineIndex < lines.length - 1 ? "\n" : ""}
        </React.Fragment>
      ));
      setDisplayContent(processedContent);
    } else {
      setDisplayContent(originalAsciiArt.trim());
    }
  }, []);

  useEffect(() => {
    const currentMoverElement = moverRef.current;
    const currentAsciiElement = asciiRef.current;

    if (currentMoverElement && currentAsciiElement) {
      const animateEffect = () => {
        const computedStyle = window.getComputedStyle(currentMoverElement);
        const transform = computedStyle.transform;
        let translateX = 0;
        if (transform && transform !== "none") {
          const matrix = transform.match(/^matrix\((.+)\)$/);
          if (matrix && matrix[1]) {
            const matrixValues = matrix[1].split(", ");
            translateX = parseFloat(matrixValues[4]);
          }
        }

        const maxTranslate = window.innerWidth * 0.2;
        const normalizedX = Math.max(
          -1,
          Math.min(1, translateX / maxTranslate)
        );
        const maxOffset = 1.0; // Max offset in vw

        if (isAndroid) {
          // Android: Use single drop-shadow filter
          const androidLayerProgress = 0.5; // Use a mid-point for a single shadow
          const offsetX = -normalizedX * maxOffset * androidLayerProgress;
          const offsetY = maxOffset * androidLayerProgress;
          // Use a darker, less saturated color for the single shadow
          const colorIntensity = Math.round(100 - 100 * androidLayerProgress); // Darker base
          const colorHex = colorIntensity.toString(16).padStart(2, "0");
          const shadowColor = `#00${colorHex}${colorHex}`; // Dark cyan/black shadow

          currentAsciiElement.style.filter = `drop-shadow(${offsetX.toFixed(
            2
          )}vw ${offsetY.toFixed(2)}vw 0px ${shadowColor})`;
          currentAsciiElement.style.textShadow = "none"; // Ensure text-shadow is off
        } else {
          // Non-Android: Use multi-layer text-shadow
          const layers = 10;
          let shadowString = "";
          for (let i = 1; i <= layers; i++) {
            const layerProgress = i / layers;
            const offsetX = -normalizedX * maxOffset * layerProgress;
            const offsetY = maxOffset * layerProgress;
            const colorIntensity = Math.round(180 - 180 * layerProgress);
            const colorHex = colorIntensity.toString(16).padStart(2, "0");
            const shadowColor = `#00${colorHex}${colorHex}`;
            shadowString += `${offsetX.toFixed(2)}vw ${offsetY.toFixed(
              2
            )}vw 0px ${shadowColor}`;
            if (i < layers) {
              shadowString += ", ";
            }
          }
          currentAsciiElement.style.textShadow = shadowString;
          currentAsciiElement.style.filter = "none"; // Ensure filter is off
        }

        animationFrameIdRef.current = requestAnimationFrame(animateEffect);
      };
      animationFrameIdRef.current = requestAnimationFrame(animateEffect);
    }

    // Cleanup function
    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
      // Reset both properties on cleanup
      if (currentAsciiElement) {
        currentAsciiElement.style.textShadow = "none";
        currentAsciiElement.style.filter = "none";
      }
    };
  }, [isAndroid, displayContent]); // Rerun if OS or content changes

  const preStyle: React.CSSProperties = {
    whiteSpace: "pre",
    margin: 0,
    lineHeight: "1.1em",
    letterSpacing: "normal",
    display: "block",
    color: "#00cccc",
    background: "transparent",
  };

  return (
    <div className="logo-container animate">
      <div
        className="logo-mover"
        ref={moverRef}
        style={{ position: "relative" }}
      >
        <pre className="logo-ascii" ref={asciiRef} style={preStyle}>
          {displayContent}
        </pre>
      </div>
    </div>
  );
};

export default Logo;
