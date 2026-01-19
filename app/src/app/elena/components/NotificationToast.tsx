"use client";

import { useState, useEffect } from "react";

const names = [
  "James", "Mike", "David", "Chris", "Alex", 
  "Ryan", "Tom", "John", "Anonymous", "Mark",
  "Steve", "Paul", "Andrew", "Daniel", "Matthew"
];

const times = ["2 min", "4 min", "7 min", "11 min", "13 min", "17 min"];

function getRandomNotification() {
  const name = names[Math.floor(Math.random() * names.length)];
  const time = times[Math.floor(Math.random() * times.length)];
  return { name, time };
}

export function NotificationToast() {
  const [notification, setNotification] = useState<{ name: string; time: string } | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Show first notification after 5-10 seconds
    const initialDelay = 5000 + Math.random() * 5000;
    
    const showNotification = () => {
      const newNotification = getRandomNotification();
      setNotification(newNotification);
      setIsVisible(true);

      // Hide after 4 seconds
      setTimeout(() => {
        setIsVisible(false);
      }, 4000);
    };

    // Initial notification
    const initialTimer = setTimeout(showNotification, initialDelay);

    // Recurring notifications every 30-60 seconds
    const interval = setInterval(() => {
      showNotification();
    }, 30000 + Math.random() * 30000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, []);

  if (!notification) return null;

  return (
    <div
      className={`
        fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-auto
        z-40 transition-all duration-500 ease-out
        ${isVisible 
          ? "opacity-100 translate-y-0" 
          : "opacity-0 translate-y-4 pointer-events-none"
        }
      `}
    >
      <div 
        className="
          bg-[#1a1a1a]/90 backdrop-blur-md
          border border-[#E8A0BF]/30
          rounded-xl px-4 py-3
          shadow-lg
          flex items-center gap-3
          font-[family-name:var(--font-inter)]
        "
      >
        {/* Bell icon */}
        <span className="text-lg">🔔</span>
        
        {/* Content */}
        <div className="flex-1">
          <p className="text-white text-sm">
            <span className="font-semibold">{notification.name}</span>
            {" "}just subscribed
          </p>
          <p className="text-[#A0A0A0] text-xs">
            {notification.time} ago
          </p>
        </div>
      </div>
    </div>
  );
}
