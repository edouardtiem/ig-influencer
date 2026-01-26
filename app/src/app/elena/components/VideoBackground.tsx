"use client";

import { useState, useEffect } from "react";

interface VideoBackgroundProps {
  onReady?: () => void;
  showOverlay?: boolean;
}

export function VideoBackground({ onReady, showOverlay = true }: VideoBackgroundProps) {
  const [videoError, setVideoError] = useState(false);

  useEffect(() => {
    // Trigger ready callback after 4 seconds
    const timer = setTimeout(() => {
      onReady?.();
    }, 4000);
    return () => clearTimeout(timer);
  }, [onReady]);

  return (
    <div className="fixed inset-0 z-0">
      {/* Video */}
      {!videoError && (
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
          onError={() => setVideoError(true)}
          poster="/elena/video-poster.jpg"
        >
          <source src="/elena/video-bg.mp4" type="video/mp4" />
        </video>
      )}

      {/* Dark overlay gradient - transitions in when content appears */}
      <div
        className={`absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black/80 transition-opacity duration-1000 ${
          showOverlay ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Subtle vignette effect - always visible for video focus */}
      <div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.3) 100%)",
        }}
      />
    </div>
  );
}
