"use client";

import { useState, useEffect } from "react";
import { AgeVerification } from "./components/AgeVerification";
import { VideoBackground } from "./components/VideoBackground";
import { ProfileSection } from "./components/ProfileSection";
import { CountdownTimer } from "./components/CountdownTimer";
import { MainCTA } from "./components/MainCTA";
import { PhotoGallery } from "./components/PhotoGallery";
import { SocialProof } from "./components/SocialProof";
import { SecondaryLinks } from "./components/SecondaryLinks";
import { NotificationToast } from "./components/NotificationToast";

export default function ElenaLinktree() {
  const [isAgeVerified, setIsAgeVerified] = useState<boolean | null>(null);
  const [timerMinutes, setTimerMinutes] = useState<number>(37);
  const [isContentVisible, setIsContentVisible] = useState(false);

  useEffect(() => {
    // Check if age was already verified
    const verified = localStorage.getItem("elena_age_verified");
    setIsAgeVerified(verified === "true");

    // Get or set timer value for A/B testing
    const storedTimer = sessionStorage.getItem("elena_timer_minutes");
    if (storedTimer) {
      setTimerMinutes(parseInt(storedTimer, 10));
    } else {
      // Random timer between options for A/B testing
      const timerOptions = [13, 17, 23, 29, 37];
      const randomTimer = timerOptions[Math.floor(Math.random() * timerOptions.length)];
      setTimerMinutes(randomTimer);
      sessionStorage.setItem("elena_timer_minutes", randomTimer.toString());
    }
  }, []);

  const handleAgeVerified = () => {
    localStorage.setItem("elena_age_verified", "true");
    // Set cookie for 30 days
    document.cookie = "elena_age_verified=true; max-age=2592000; path=/";
    setIsAgeVerified(true);
  };

  // Don't render anything until we check localStorage
  if (isAgeVerified === null) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#E8A0BF] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <main className="relative min-h-screen bg-[#0a0a0a] overflow-hidden">
      {/* Video Background */}
      <VideoBackground
        onReady={() => setIsContentVisible(true)}
        showOverlay={isContentVisible}
      />

      {/* Age Verification Modal */}
      {!isAgeVerified && <AgeVerification onVerified={handleAgeVerified} />}

      {/* Main Content - fades in after video plays */}
      <div
        className={`
          relative z-10 min-h-screen flex flex-col items-center px-4 py-8 sm:py-12
          transition-all duration-1000 ease-out
          ${isContentVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
        `}
      >
        <div className="w-full max-w-md mx-auto space-y-6">
          {/* Profile */}
          <ProfileSection />

          {/* Countdown Timer */}
          <CountdownTimer initialMinutes={timerMinutes} />

          {/* Main CTA */}
          <MainCTA timerMinutes={timerMinutes} />

          {/* Photo Gallery */}
          <PhotoGallery />

          {/* Social Proof */}
          <SocialProof />

          {/* Secondary Links */}
          <SecondaryLinks />
        </div>
      </div>

      {/* Notification Toast */}
      {isAgeVerified && <NotificationToast />}
    </main>
  );
}
