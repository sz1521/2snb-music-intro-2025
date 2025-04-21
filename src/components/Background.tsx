import React, { useState, useEffect } from "react";
import "./Background.css"; // Import the CSS file

// Define the structure for a star
interface Star {
  top: string;
  left: string; // Position within 0% to 100%
  animationDelay: string; // For twinkling
  layer: number;
  size: number;
  opacity: number;
}

const Background: React.FC = () => {
  const [stars, setStars] = useState<Star[]>([]);

  // Configure star layers
  const starLayersConfig = [
    { count: 80, size: 1, opacity: 0.6, layerIndex: 1, speed: 40 }, // Slowest
    { count: 50, size: 2, opacity: 0.8, layerIndex: 2, speed: 25 }, // Medium
    { count: 30, size: 3, opacity: 1.0, layerIndex: 3, speed: 15 }, // Fastest
  ];

  useEffect(() => {
    const generatedStars: Star[] = [];
    starLayersConfig.forEach((config) => {
      // Generate stars for 100% width
      const countForLayer = config.count;
      for (let i = 0; i < countForLayer; i++) {
        // Generate left position between 0% and 100%
        const leftPosition = Math.random() * 100;
        generatedStars.push({
          left: `${leftPosition}%`,
          top: `${Math.random() * 100}%`,
          animationDelay: `${Math.random() * 5}s`,
          layer: config.layerIndex,
          size: config.size,
          opacity: config.opacity,
        });
      }
    });
    setStars(generatedStars);
  }, []); // Run only once on mount

  return (
    <div className="background-container">
      {starLayersConfig.map((config) => (
        <div
          key={config.layerIndex}
          className={`star-field star-field-layer-${config.layerIndex}`}
          style={{ animationDuration: `${config.speed}s` }}
        >
          {/* Render the set of stars TWICE, side-by-side */}
          {[0, 1].map((offsetMultiplier) => (
            <React.Fragment key={offsetMultiplier}>
              {stars
                .filter((star) => star.layer === config.layerIndex)
                .map((star, index) => (
                  <div
                    key={`${config.layerIndex}-${offsetMultiplier}-${index}`}
                    className="star"
                    style={{
                      top: star.top,
                      // Calculate left position with offset for the second set
                      left: `calc(${star.left} + ${offsetMultiplier * 100}%)`,
                      width: `${star.size}px`,
                      height: `${star.size}px`,
                      opacity: star.opacity,
                      animationDelay: star.animationDelay,
                    }}
                  ></div>
                ))}
            </React.Fragment>
          ))}
        </div>
      ))}
    </div>
  );
};

export default Background;
