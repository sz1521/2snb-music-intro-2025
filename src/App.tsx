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
  const [showSoundCloudLink, setShowSoundCloudLink] = useState(false);

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
        newHeight = viewportHeight;
        newWidth = viewportHeight * TARGET_RATIO;
      } else {
        newWidth = viewportWidth;
        newHeight = viewportWidth / TARGET_RATIO;
      }

      appElement.style.width = `${Math.floor(newWidth)}px`;
      appElement.style.height = `${Math.floor(newHeight)}px`;
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (appElement) {
        appElement.style.width = "";
        appElement.style.height = "";
      }
    };
  }, []);

  // Starts the timer to show the scroller after a delay
  const startScrollerTimer = (delaySeconds: number) => {
    if (scrollerTimerRef.current) clearTimeout(scrollerTimerRef.current);
    scrollerTimerRef.current = window.setTimeout(() => {
      setShowScroller(true);
    }, delaySeconds * 1000);
  };

  // Core function to initiate music playback and demo start
  const startMusic = () => {
    if (!audioRef.current || !showPlayButton) return;

    setShowPlayButton(false);
    audioRef.current
      .play()
      .then(() => {
        setIsMusicPlaying(true); // Set state to trigger rendering of main components
        startScrollerTimer(13);
        setIsCursorVisible(false);
      })
      .catch((error) => {
        console.error("Error playing audio:", error);
        setShowPlayButton(true);
      });
  };

  // Effect for audio setup, autoplay attempt, and event listeners
  useEffect(() => {
    const audioEl = audioRef.current;
    if (!audioEl) return;

    audioEl.preload = "auto";

    const handlePlaySuccess = () => {
      setShowPlayButton(false);
      setIsMusicPlaying(true); // Set state to trigger rendering
      startScrollerTimer(13);
      setIsCursorVisible(false);
    };

    const attemptAutoplay = () => {
      setTimeout(() => {
        if (audioEl.paused) {
          const playPromise = audioEl.play();
          if (playPromise !== undefined) {
            playPromise.then(handlePlaySuccess).catch(() => {
              if (audioEl.paused && !isMusicPlaying) {
                setShowPlayButton(true);
              }
            });
          } else {
            if (!audioEl.paused) handlePlaySuccess();
            else if (!isMusicPlaying) setShowPlayButton(true);
          }
        } else {
          handlePlaySuccess(); // Already playing (e.g., browser resumed session)
        }
      }, 100);
    };

    attemptAutoplay();

    const handleCanPlay = () => {
      if (!isMusicPlaying && !showPlayButton && audioEl.paused) {
        attemptAutoplay();
      }
    };

    const handleKeyDown = () => {
      if (showPlayButton && !isMusicPlaying) {
        startMusic();
      }
    };

    const handleMouseMove = () => {
      if (isMusicPlaying) {
        setIsCursorVisible(true);
        if (cursorHideTimeoutRef.current) {
          clearTimeout(cursorHideTimeoutRef.current);
        }
        cursorHideTimeoutRef.current = window.setTimeout(() => {
          setIsCursorVisible(false);
        }, 2000);
      }
    };

    audioEl.addEventListener("canplaythrough", handleCanPlay);
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousemove", handleMouseMove);

    return () => {
      audioEl.removeEventListener("canplaythrough", handleCanPlay);
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousemove", handleMouseMove);
      if (scrollerTimerRef.current) clearTimeout(scrollerTimerRef.current);
      if (cursorHideTimeoutRef.current)
        clearTimeout(cursorHideTimeoutRef.current);
    };
  }, [showPlayButton, isMusicPlaying]);

  // Effect for SoundCloud link visibility
  useEffect(() => {
    if (isMusicPlaying && showScroller) {
      setShowSoundCloudLink(true);
    }
  }, [isMusicPlaying, showScroller]);

  // Click handler for the interaction prompt
  const handlePlayClick = () => {
    startMusic();
  };

  // --- Render ---
  return (
    <div
      ref={appRef}
      className={`app ${
        !isCursorVisible && isMusicPlaying ? "hide-cursor" : ""
      }`}
    >
      {/* Conditionally render main components OR loading screen */}
      {isMusicPlaying ? (
        <>
          {/* Pass startAnimations prop set to true (since isMusicPlaying is true here) */}
          <Background />
          <Logo />
          <VectorBox />
          {showScroller && <Scroller />}
          {/* SoundCloud Link - Visibility controlled by state */}
          <a
            href="https://soundcloud.com/2snb/tracks"
            target="_blank"
            rel="noopener noreferrer"
            className={`soundcloud-link ${showSoundCloudLink ? "visible" : ""}`}
          >
            soundcloud.com/2snb
          </a>
        </>
      ) : (
        // Show loading/interaction screen when music is NOT playing
        <div
          className="loading-screen"
          onClick={showPlayButton ? handlePlayClick : undefined}
        >
          {showPlayButton ? (
            <div className="play-music-text">Click or press any key</div>
          ) : (
            <p className="loading-text">Loading intro...</p>
          )}
        </div>
      )}

      {/* Audio Element - Always rendered to allow loading and control */}
      <audio ref={audioRef} id="audio-player" src={audioFile} loop>
        Your browser does not support the audio element.
      </audio>
    </div>
  );
};

export default App;
