"use client";

import { useState } from "react";

interface AgeVerificationProps {
  onVerified: () => void;
}

export function AgeVerification({ onVerified }: AgeVerificationProps) {
  const [isChecked, setIsChecked] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop with blur */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />

      {/* Modal */}
      <div className="relative bg-[#0a0a0a] border border-[#E8A0BF]/30 rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl">
        {/* 18+ Icon */}
        <div className="text-5xl mb-4">🔞</div>

        {/* Title */}
        <h2 className="font-[family-name:var(--font-cormorant)] text-2xl text-white mb-2">
          Adult Content
        </h2>

        {/* Description */}
        <p className="text-[#A0A0A0] text-sm mb-6 font-[family-name:var(--font-inter)]">
          This page contains adult content.
          <br />
          You must be 18+ to continue.
        </p>

        {/* Checkbox */}
        <label className="flex items-center justify-center gap-3 mb-6 cursor-pointer group">
          <div className="relative">
            <input
              type="checkbox"
              checked={isChecked}
              onChange={(e) => setIsChecked(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-5 h-5 border-2 border-[#E8A0BF]/50 rounded peer-checked:bg-[#E8A0BF] peer-checked:border-[#E8A0BF] transition-all flex items-center justify-center">
              {isChecked && (
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
          </div>
          <span className="text-white text-sm font-[family-name:var(--font-inter)]">
            I confirm I am 18 years or older
          </span>
        </label>

        {/* Enter Button */}
        <button
          onClick={onVerified}
          disabled={!isChecked}
          className={`
            w-full py-3 px-6 rounded-xl font-semibold text-base
            font-[family-name:var(--font-inter)] transition-all duration-300
            ${isChecked
              ? "bg-[#E8A0BF] text-white hover:bg-[#d98fb0] hover:shadow-[0_0_20px_rgba(232,160,191,0.4)] cursor-pointer"
              : "bg-[#333] text-[#666] cursor-not-allowed"
            }
          `}
        >
          ENTER
        </button>

        {/* Terms notice */}
        <p className="text-[#666] text-xs mt-4 font-[family-name:var(--font-inter)]">
          By entering, you agree to our Terms of Service
        </p>
      </div>
    </div>
  );
}
