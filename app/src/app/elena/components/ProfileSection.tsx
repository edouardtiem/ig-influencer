"use client";

export function ProfileSection() {
  return (
    <div className="flex flex-col items-center text-center">
      {/* Avatar with glow effect */}
      <div className="relative mb-4">
        <div 
          className="w-24 h-24 rounded-full overflow-hidden border-[3px] border-[#E8A0BF]"
          style={{
            boxShadow: "0 0 25px rgba(232, 160, 191, 0.5), 0 0 50px rgba(232, 160, 191, 0.2)",
          }}
        >
          <img 
            src="/elena/avatar.png" 
            alt="Elena" 
            className="w-full h-full object-cover"
          />
        </div>

        {/* Online indicator */}
        <div className="absolute bottom-1 right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-[#0a0a0a]" />
      </div>

      {/* Name */}
      <h1 className="font-[family-name:var(--font-cormorant)] text-3xl font-semibold text-white mb-1">
        Elena
      </h1>

      {/* Tagline */}
      <p className="font-[family-name:var(--font-inter)] text-[#E8A0BF] text-base">
        My secret life starts here 🔓
      </p>
    </div>
  );
}
