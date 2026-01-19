"use client";

interface MainCTAProps {
  timerMinutes: number;
}

export function MainCTA({ timerMinutes }: MainCTAProps) {
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
        Get FREE Access for 7 Days
      </h2>

      {/* Subtext */}
      <p className="font-[family-name:var(--font-inter)] text-[#A0A0A0] text-sm text-center mb-4">
        Full access to all my content • DM me anytime 💬
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
        JOIN NOW - IT&apos;S FREE 🔓
      </button>

      {/* Trust indicator */}
      <p className="text-[#666] text-xs text-center mt-3 font-[family-name:var(--font-inter)]">
        🔒 Secure & Private • Cancel anytime
      </p>
    </div>
  );
}
