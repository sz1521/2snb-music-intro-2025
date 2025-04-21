import React, { useRef, useEffect } from "react"; // Import useRef and useEffect
import "./Logo.css";

interface LogoProps {
  isMusicPlaying: boolean;
}

const Logo: React.FC<LogoProps> = ({ isMusicPlaying }) => {
  const asciiArt = `
██████      ███████ ██████   █████   ██████ ███████        ██        ██████  ███████ ██    ██  ██████  ███    ██ ██████     
     ██     ██      ██   ██ ██   ██ ██      ██             ██        ██   ██ ██       ██  ██  ██    ██ ████   ██ ██   ██    
 █████      ███████ ██████  ███████ ██      █████       ████████     ██████  █████     ████   ██    ██ ██ ██  ██ ██   ██    
██               ██ ██      ██   ██ ██      ██          ██  ██       ██   ██ ██         ██    ██    ██ ██  ██ ██ ██   ██    
███████     ███████ ██      ██   ██  ██████ ███████     ██████       ██████  ███████    ██     ██████  ██   ████ ██████  ██
`;

  // Refs for the elements
  const moverRef = useRef<HTMLDivElement>(null);
  const asciiRef = useRef<HTMLPreElement>(null);
  const animationFrameIdRef = useRef<number | null>(null);

  // Effect to handle the dynamic shadow animation
  useEffect(() => {
    const moverElement = moverRef.current;
    const asciiElement = asciiRef.current;

    // Only run the animation if music is playing and elements exist
    if (isMusicPlaying && moverElement && asciiElement) {
      const animateShadow = () => {
        // Get the computed transform style
        const computedStyle = window.getComputedStyle(moverElement);
        const transform = computedStyle.transform;

        let translateX = 0;
        // Parse the translateX value from the matrix
        if (transform && transform !== "none") {
          const matrix = transform.match(/^matrix\((.+)\)$/);
          if (matrix && matrix[1]) {
            const matrixValues = matrix[1].split(", ");
            // The translateX value is typically the 5th value (index 4) in a 2D matrix
            translateX = parseFloat(matrixValues[4]);
          }
        }

        // --- Calculate shadow based on translateX ---
        // Normalize translateX (e.g., map it to a range like -1 to 1)
        // Assuming the animation moves between -20vw and 20vw
        const maxTranslate = window.innerWidth * 0.2; // 20vw
        const normalizedX = Math.max(
          -1,
          Math.min(1, translateX / maxTranslate)
        );

        // Define max shadow offset and number of layers
        const maxOffset = 1.0; // Max offset in vw units
        const layers = 10;
        let shadowString = "";

        for (let i = 1; i <= layers; i++) {
          const layerProgress = i / layers;
          // Shadow moves opposite to the element's movement
          const offsetX = -normalizedX * maxOffset * layerProgress;
          // Keep vertical offset consistent or make it dynamic too if desired
          const offsetY = maxOffset * layerProgress;
          // Darken the color for deeper layers
          const colorIntensity = Math.round(204 - 204 * layerProgress); // 0xCC down to 0x00
          const colorHex = colorIntensity.toString(16).padStart(2, "0");
          const shadowColor = `#00${colorHex}${colorHex}`; // Shades of cyan/grey

          shadowString += `${offsetX.toFixed(2)}vw ${offsetY.toFixed(
            2
          )}vw 0px ${shadowColor}`;
          if (i < layers) {
            shadowString += ", ";
          }
        }

        // Apply the calculated shadow
        asciiElement.style.textShadow = shadowString;

        // Continue the loop
        animationFrameIdRef.current = requestAnimationFrame(animateShadow);
      };

      // Start the animation loop
      animationFrameIdRef.current = requestAnimationFrame(animateShadow);
    } else {
      // If music stops or component unmounts, cancel the animation
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
      // Optionally reset the shadow when not animating
      if (asciiElement) {
        asciiElement.style.textShadow = "none"; // Or reset to a default static shadow
      }
    }

    // Cleanup function
    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    };
  }, [isMusicPlaying]); // Rerun effect when isMusicPlaying changes

  return (
    <div className={`logo-container ${isMusicPlaying ? "animate" : ""}`}>
      {/* Add refs to the elements */}
      <div className="logo-mover" ref={moverRef}>
        <pre className="logo-ascii" ref={asciiRef}>
          {asciiArt}
        </pre>
      </div>
    </div>
  );
};

export default Logo;
