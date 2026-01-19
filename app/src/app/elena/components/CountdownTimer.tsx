"use client";

import { useState, useEffect } from "react";

interface CountdownTimerProps {
  initialMinutes: number;
}

export function CountdownTimer({ initialMinutes }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  useEffect(() => {
    // Get stored end time or create new one
    const storedEndTime = sessionStorage.getItem("elena_timer_end");
    let endTime: number;

    if (storedEndTime) {
      endTime = parseInt(storedEndTime, 10);
    } else {
      // Random seconds between 0-59 for more "authentic" feel
      const randomSeconds = Math.floor(Math.random() * 60);
      const totalSeconds = (initialMinutes * 60) + randomSeconds;
      endTime = Date.now() + (totalSeconds * 1000);
      sessionStorage.setItem("elena_timer_end", endTime.toString());
    }

    // Calculate initial time left
    const calculateTimeLeft = () => {
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((endTime - now) / 1000));
      return remaining;
    };

    setTimeLeft(calculateTimeLeft());

    // Update every second
    const interval = setInterval(() => {
      const remaining = calculateTimeLeft();
      setTimeLeft(remaining);

      // Reset timer when it reaches 0 (user doesn't know)
      if (remaining <= 0) {
        const timerOptions = [13, 17, 23, 29, 37];
        const newMinutes = timerOptions[Math.floor(Math.random() * timerOptions.length)];
        const newSeconds = Math.floor(Math.random() * 60);
        const newEndTime = Date.now() + ((newMinutes * 60 + newSeconds) * 1000);
        sessionStorage.setItem("elena_timer_end", newEndTime.toString());
        sessionStorage.setItem("elena_timer_minutes", newMinutes.toString());
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [initialMinutes]);

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  if (timeLeft === null) {
    return null; // Don't render until we have the time
  }

  return (
    <div className="text-center py-3 px-4 bg-[#1a1a1a]/60 backdrop-blur-sm rounded-xl border border-[#E8A0BF]/20">
      <p className="font-[family-name:var(--font-inter)] text-[#FAF5F0] text-sm">
        ⏰ Free trial offer ends in{" "}
        <span className="font-bold text-[#E8A0BF] text-lg tabular-nums">
          {formatTime(timeLeft)}
        </span>
      </p>
    </div>
  );
}
