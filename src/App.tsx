import React, { useEffect, useRef, useState } from "react";
import Background from "./components/Background";
import Logo from "./components/Logo";
import Scroller from "./components/Scroller";
import VectorBox from "./components/VectorBox";
import "./App.css";
import "./components/Scroller.css";
import audioFile from "./assets/2snb-intro2025.mp3"; // Vite handles this path correctly

// --- Aspect Ratio Constant ---
const TARGET_RATIO = 4 / 3;

const App: React.FC = () => {
  // --- Refs ---
  const audioRef = useRef<HTMLAudioElement>(null);
  const scrollerTimerRef = useRef<number | null>(null);
  const cursorHideTimeoutRef = useRef<number | null>(null);
  const appRef = useRef<HTMLDivElement>(null); // Ref for the .app container

  // --- State ---
  const [showPlayButton, setShowPlayButton] = useState(false);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [showScroller, setShowScroller] = useState(false);
  const [isCursorVisible, setIsCursorVisible] = useState(true);

  // --- Handlers & Effects ---

  // Effect for setting dynamic size
  useEffect(() => {
    const appElement = appRef.current;
    if (!appElement) return;

    const handleResize = () => {
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const viewportRatio = viewportWidth / viewportHeight;

      let newWidth = 0;
      let newHeight = 0;

      if (viewportRatio > TARGET_RATIO) {
        // Viewport is wider than 4:3, height is the limiting factor
        newHeight = viewportHeight;
        newWidth = viewportHeight * TARGET_RATIO;
      } else {
        // Viewport is taller than 4:3 (or exactly 4:3), width is the limiting factor
        newWidth = viewportWidth;
        newHeight = viewportWidth / TARGET_RATIO;
      }

      // Apply the calculated dimensions directly
      appElement.style.width = `${Math.floor(newWidth)}px`;
      appElement.style.height = `${Math.floor(newHeight)}px`;
    };

    // Initial calculation
    handleResize();

    // Add resize listener
    window.addEventListener("resize", handleResize);

    // Cleanup listener
    return () => {
      window.removeEventListener("resize", handleResize);
      // Optionally reset styles on unmount
      if (appElement) {
        appElement.style.width = "";
        appElement.style.height = "";
      }
    };
  }, []); // Empty dependency array ensures this runs once on mount and cleans up on unmount

  // Starts the timer to show the scroller after a delay
  const startScrollerTimer = (delaySeconds: number) => {
    if (scrollerTimerRef.current) clearTimeout(scrollerTimerRef.current);
    scrollerTimerRef.current = window.setTimeout(() => {
      setShowScroller(true);
      console.log("Scroller started, telling VectorBox.");
    }, delaySeconds * 1000);
  };

  // Core function to initiate music playback and demo start
  const startMusic = () => {
    if (!audioRef.current || !showPlayButton) return;

    setShowPlayButton(false); // Hide interaction prompt
    audioRef.current
      .play()
      .then(() => {
        setIsMusicPlaying(true);
        startScrollerTimer(13); // Start scroller timer (adjust delay as needed)
        setIsCursorVisible(false); // Initially hide cursor
      })
      .catch((error) => {
        console.error("Error playing audio:", error); // Keep error log
        setShowPlayButton(true); // Show interaction prompt again on failure
      });
  };

  // Effect for audio setup, autoplay attempt, and event listeners
  useEffect(() => {
    const audioEl = audioRef.current;
    if (!audioEl) return;

    audioEl.preload = "auto"; // Hint browser to load audio metadata/data

    // Common success handler for both autoplay and manual start
    const handlePlaySuccess = () => {
      setShowPlayButton(false);
      setIsMusicPlaying(true);
      startScrollerTimer(13);
      setIsCursorVisible(false);
    };

    // Attempts to play audio, handling potential autoplay restrictions
    const attemptAutoplay = () => {
      setTimeout(() => {
        if (audioEl.paused) {
          const playPromise = audioEl.play();
          if (playPromise !== undefined) {
            playPromise.then(handlePlaySuccess).catch((error) => {
              if (audioEl.paused && !isMusicPlaying) {
                setShowPlayButton(true);
              }
            });
          } else {
            if (!audioEl.paused) handlePlaySuccess();
            else if (!isMusicPlaying) setShowPlayButton(true);
          }
        } else {
          handlePlaySuccess();
        }
      }, 100); // 100ms delay
    };

    attemptAutoplay(); // Try to autoplay on component mount

    // Listener: Retry play if possible when audio is ready
    const handleCanPlay = () => {
      if (!isMusicPlaying && !showPlayButton && audioEl.paused) {
        attemptAutoplay();
      }
    };

    // Listener: Start music on any key press if interaction is needed
    const handleKeyDown = (event: KeyboardEvent) => {
      if (showPlayButton && !isMusicPlaying) {
        startMusic(); // Use the unified start function
      }
    };

    // Listener: Show cursor on mouse move, then hide after inactivity
    const handleMouseMove = () => {
      if (isMusicPlaying) {
        setIsCursorVisible(true);
        if (cursorHideTimeoutRef.current) {
          clearTimeout(cursorHideTimeoutRef.current);
        }
        cursorHideTimeoutRef.current = window.setTimeout(() => {
          setIsCursorVisible(false);
        }, 2000); // Hide after 2 seconds
      }
    };

    // --- Add Event Listeners ---
    audioEl.addEventListener("canplaythrough", handleCanPlay);
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousemove", handleMouseMove);

    // --- Cleanup ---
    return () => {
      audioEl.removeEventListener("canplaythrough", handleCanPlay);
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousemove", handleMouseMove);
      if (scrollerTimerRef.current) clearTimeout(scrollerTimerRef.current);
      if (cursorHideTimeoutRef.current)
        clearTimeout(cursorHideTimeoutRef.current);
    };
  }, [showPlayButton, isMusicPlaying]);

  // Click handler for the interaction prompt
  const handlePlayClick = () => {
    startMusic(); // Use the unified start function
  };

  // --- Render ---
  return (
    <div
      ref={appRef}
      className={`app ${
        !isCursorVisible && isMusicPlaying ? "hide-cursor" : ""
      }`}
    >
      <Background />
      <Logo isMusicPlaying={isMusicPlaying} />
      <VectorBox />
      {showScroller && <Scroller />}

      {/* Loading/Interaction Screen */}
      {!isMusicPlaying && (
        <div
          className="loading-screen"
          onClick={showPlayButton ? handlePlayClick : undefined}
        >
          {showPlayButton ? (
            <div className="play-music-text">Click or press Any Key</div>
          ) : (
            <p className="loading-text">Loading intro...</p>
          )}
        </div>
      )}

      {/* Audio Element */}
      <audio
        ref={audioRef}
        id="audio-player"
        src={audioFile} // Use the variable resolved by Vite
        loop
      >
        Your browser does not support the audio element.
      </audio>

      {/* SoundCloud Link */}
      <a
        href="https://soundcloud.com/2snb/tracks"
        target="_blank"
        rel="noopener noreferrer"
        className="soundcloud-link"
      >
        soundcloud.com/2snb
      </a>
    </div>
  );
};

export default App;
