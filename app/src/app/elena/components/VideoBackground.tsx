"use client";

import { useState } from "react";

export function VideoBackground() {
  const [videoError, setVideoError] = useState(false);

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

      {/* Dark overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black/80" />

      {/* Subtle vignette effect */}
      <div 
        className="absolute inset-0"
        style={{
          background: "radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.4) 100%)",
        }}
      />
    </div>
  );
}
