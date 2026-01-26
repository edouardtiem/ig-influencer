"use client";

import { useState } from "react";

interface MainCTAProps {
  timerMinutes: number;
}

export function MainCTA({ timerMinutes }: MainCTAProps) {
  const [showFanvueInfo, setShowFanvueInfo] = useState(false);
  
  // Fanvue URL with 7-day free trial + UTM tracking
  const fanvueUrl = `https://www.fanvue.com/elenav.paris/fv-3?free_trial=a873adf0-4d08-4f84-aa48-a8861df6669f&utm_source=linktree&utm_medium=link&utm_campaign=free_trial_7days&timer=${timerMinutes}`;

  const handleClick = () => {
    // Track click event (you can add analytics here)
    console.log("CTA clicked", { timerMinutes, timestamp: Date.now() });
    
    // Open link
    window.open(fanvueUrl, "_blank");
  };

  return (
    <div 
      className="bg-[#1a1a1a]/70 backdrop-blur-sm rounded-2xl p-5 border border-[#E8A0BF]/30"
      style={{
        boxShadow: "0 4px 30px rgba(232, 160, 191, 0.1)",
      }}
    >
      {/* Headline */}
      <h2 className="font-[family-name:var(--font-cormorant)] text-xl font-semibold text-white text-center mb-2">
        Where My Husband Never Goes
      </h2>

      {/* Subtext */}
      <p className="font-[family-name:var(--font-inter)] text-[#A0A0A0] text-sm text-center mb-4">
        Bored wife. I found how to have fun. This is the door he&apos;ll never open 🔓
      </p>

      {/* Teaser Image */}
      <div className="relative mb-4 rounded-xl overflow-hidden aspect-video bg-gradient-to-br from-[#2a2a2a] to-[#1a1a1a]">
        <img 
          src="/elena/teaser.png" 
          alt="Preview" 
          className="w-full h-full object-cover"
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
      </div>

      {/* CTA Button */}
      <button
        onClick={handleClick}
        className="
          w-full py-4 px-6 rounded-xl font-semibold text-lg
          font-[family-name:var(--font-inter)]
          bg-[#E8A0BF] text-white
          hover:bg-[#d98fb0] 
          active:scale-[0.98]
          transition-all duration-300
          cursor-pointer
        "
        style={{
          boxShadow: "0 0 20px rgba(232, 160, 191, 0.3)",
        }}
      >
        ENTER MY SECRET LIFE 🔓
      </button>

      {/* Trust Badges */}
      <div className="mt-4 space-y-2">
        <div className="flex items-center justify-center gap-4 text-[#888] text-xs font-[family-name:var(--font-inter)]">
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
            Private
          </span>
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Secure
          </span>
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Cancel anytime
          </span>
        </div>
      </div>

      {/* What is Fanvue - Expandable */}
      <div className="mt-4 pt-4 border-t border-[#333]">
        <button
          onClick={() => setShowFanvueInfo(!showFanvueInfo)}
          className="w-full flex items-center justify-center gap-2 text-[#A0A0A0] text-xs font-[family-name:var(--font-inter)] hover:text-white transition-colors"
        >
          <span>What is Fanvue?</span>
          <svg 
            className={`w-4 h-4 transition-transform ${showFanvueInfo ? 'rotate-180' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        {showFanvueInfo && (
          <div className="mt-3 p-3 bg-[#0a0a0a]/50 rounded-lg text-xs text-[#A0A0A0] font-[family-name:var(--font-inter)] space-y-2">
            <p>
              <strong className="text-white">Fanvue</strong> is a premium content platform trusted by millions of creators and subscribers worldwide.
            </p>
            <ul className="space-y-1.5 pl-1">
              <li className="flex items-start gap-2">
                <span className="text-[#E8A0BF]">•</span>
                <span><strong className="text-white">Discreet billing</strong> - appears as &quot;FV*&quot; on your statement</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#E8A0BF]">•</span>
                <span><strong className="text-white">100% anonymous</strong> - your subscription is private</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#E8A0BF]">•</span>
                <span><strong className="text-white">Secure payments</strong> via Stripe (bank-level security)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#E8A0BF]">•</span>
                <span><strong className="text-white">Cancel anytime</strong> - no questions asked</span>
              </li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
