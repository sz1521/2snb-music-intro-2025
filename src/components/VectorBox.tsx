import React, { useEffect, useRef, useState } from "react";
import "./VectorBox.css";

const VectorBox: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Start scale at 0 for the initial zoom-in effect
  const [currentScale, setCurrentScale] = useState(0);
  const targetScaleRef = useRef(1);

  // Refs for audio context, analyser, and animation frame
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);

  // Ref to store the timestamp when animation starts
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    const setupAudio = async () => {
      try {
        // Ensure AudioContext is only created once
        if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext ||
            (window as any).webkitAudioContext)();
        }
        const audioContext = audioContextRef.current;

        // --- Attempt to resume context if suspended ---
        if (audioContext.state === "suspended") {
          try {
            await audioContext.resume();
            console.log("AudioContext resumed successfully.");
          } catch (resumeError) {
            console.error("Error resuming AudioContext:", resumeError);
          }
        }
        // --- End resume attempt ---

        // --- IMPORTANT: Get your audio element ---
        const audioElement = document.getElementById(
          "audio-player"
        ) as HTMLAudioElement | null;

        if (!audioElement) {
          console.error("Audio element not found!");
          return;
        }

        // Ensure source is only created once for the element
        if (!sourceRef.current) {
          sourceRef.current =
            audioContext.createMediaElementSource(audioElement);
        }
        const source = sourceRef.current;

        // Ensure analyser is only created once
        if (!analyserRef.current) {
          analyserRef.current = audioContext.createAnalyser();
          analyserRef.current.fftSize = 256;
          const bufferLength = analyserRef.current.frequencyBinCount;
          dataArrayRef.current = new Uint8Array(bufferLength);
        }
        const analyser = analyserRef.current;
        const dataArray = dataArrayRef.current;

        if (!dataArray) return;

        // Connect nodes: Source -> Analyser -> Destination (speakers)
        try {
          source.disconnect();
        } catch (e) {}
        source.connect(analyser);
        analyser.connect(audioContext.destination);

        // --- Animation Loop ---
        // Optional: Slightly increase smoothing for faster reaction
        const smoothingFactor = 0.08; // Increased from 0.05
        const scaleIncreaseStartTime = 10;
        const scaleTransitionDuration = 2;

        const animate = () => {
          if (!analyserRef.current || !dataArrayRef.current) return;

          if (startTimeRef.current === null) {
            startTimeRef.current = performance.now();
          }

          const currentTime = performance.now();
          const elapsedTimeSeconds =
            (currentTime - (startTimeRef.current || currentTime)) / 1000;

          analyserRef.current.getByteFrequencyData(dataArrayRef.current);

          let sum = 0;
          for (let i = 0; i < dataArrayRef.current.length; i++) {
            sum += dataArrayRef.current[i];
          }
          const average = sum / dataArrayRef.current.length || 0;

          // --- Define Initial and Final Scaling Parameters ---
          // Keep initial phase subtle or adjust if needed
          const initialMinScale = 0.0;
          const initialMaxScale = 0.5;
          const initialSensitivity = 0.002;

          // --- Increase reactivity in the final phase ---
          const finalMinScale = 0.5; // Decrease minimum scale slightly
          const finalMaxScale = 2.0; // Increase maximum scale
          const finalSensitivity = 0.01; // Increase sensitivity significantly
          // --- End parameter adjustments ---

          // --- Calculate Current Scaling Parameters based on Time ---
          let currentMinScale: number;
          let currentMaxScale: number;
          let currentSensitivity: number;
          let progress = 0; // Interpolation progress (0 to 1)

          if (elapsedTimeSeconds < scaleIncreaseStartTime) {
            // Before transition starts
            progress = 0;
          } else if (
            elapsedTimeSeconds <
            scaleIncreaseStartTime + scaleTransitionDuration
          ) {
            // During transition
            progress =
              (elapsedTimeSeconds - scaleIncreaseStartTime) /
              scaleTransitionDuration;
            // Clamp progress between 0 and 1 just in case
            progress = Math.max(0, Math.min(1, progress));
          } else {
            // After transition ends
            progress = 1;
          }

          // Linear interpolation (lerp) for each parameter
          const lerp = (start: number, end: number, t: number) =>
            start + (end - start) * t;

          currentMinScale = lerp(initialMinScale, finalMinScale, progress);
          currentMaxScale = lerp(initialMaxScale, finalMaxScale, progress);
          currentSensitivity = lerp(
            initialSensitivity,
            finalSensitivity, // Uses the increased finalSensitivity
            progress
          );
          // --- End Parameter Calculation ---

          targetScaleRef.current = Math.min(
            currentMaxScale, // Uses the interpolated (potentially larger) maxScale
            currentMinScale + average * currentSensitivity // Uses interpolated minScale and sensitivity
          );

          // Smoothly interpolate current scale towards the target scale
          setCurrentScale((prevScale) => {
            return (
              prevScale + (targetScaleRef.current - prevScale) * smoothingFactor // Uses potentially increased smoothingFactor
            );
          });

          animationFrameIdRef.current = requestAnimationFrame(animate);
        };

        // Start animation loop immediately if analyser is ready
        if (analyserRef.current) {
          animate();
        }
      } catch (error) {
        console.error("Error setting up Web Audio API:", error);
      }
    };

    const resumeAudioContext = () => {
      if (
        audioContextRef.current &&
        audioContextRef.current.state === "suspended"
      ) {
        audioContextRef.current.resume();
      }
    };

    document.addEventListener("click", resumeAudioContext);
    document.addEventListener("keydown", resumeAudioContext);

    setupAudio();

    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }

      if (sourceRef.current) {
        try {
          sourceRef.current.disconnect();
        } catch (e) {}
      }

      if (analyserRef.current) {
        try {
          analyserRef.current.disconnect();
        } catch (e) {}
      }

      document.removeEventListener("click", resumeAudioContext);
      document.removeEventListener("keydown", resumeAudioContext);
    };
  }, []);

  useEffect(() => {
    const dpr = window.devicePixelRatio || 1;
    const container = containerRef.current;

    if (container) {
      // Define base values (matching CSS :root)
      const baseSize = 25; // vmin
      const baseDepth = 10; // vmin

      // --- Scaling Logic ---
      // If DPR is low (e.g., 1), increase the effective size/depth
      // We observed it was ~2x smaller on 1x DPR compared to 2x DPR.
      // So, if DPR is close to 1, multiply by ~2.
      // Adjust the 'scalingFactor' based on testing.
      const scalingFactor = dpr < 1.5 ? 2 : 1; // Apply 2x factor if DPR is less than 1.5

      const scaledSize = baseSize * scalingFactor;
      const scaledDepth = baseDepth * scalingFactor;

      // Apply the calculated values as CSS variables to the component's root
      container.style.setProperty("--cube-base-size", `${scaledSize}vmin`);
      container.style.setProperty("--cube-base-depth", `${scaledDepth}vmin`);
      container.style.setProperty("--cube-face-depth", `${scaledDepth}vmin`); // Keep face depth consistent
    }

    // No cleanup needed, runs once on mount
  }, []); // Empty dependency array ensures this runs only once

  return (
    <div className="vector-box-container" ref={containerRef}>
      <div
        className="vector-box-scene"
        style={{
          transform: `scale(${currentScale})`,
        }}
      >
        <div className="vector-box-cube">
          <div className="vector-box-face front"></div>
          <div className="vector-box-face back"></div>
          <div className="vector-box-face right"></div>
          <div className="vector-box-face left"></div>
          <div className="vector-box-face top"></div>
          <div className="vector-box-face bottom"></div>
        </div>
      </div>
    </div>
  );
};

export default VectorBox;
