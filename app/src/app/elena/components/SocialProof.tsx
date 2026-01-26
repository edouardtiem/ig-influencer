"use client";

export function SocialProof() {
  const badges = [
    { icon: "💍", text: "Bored wife, Paris 8e" },
    { icon: "🔓", text: "What he'll never find" },
    { icon: "📸", text: "50+ private moments" },
    { icon: "💬", text: "I reply to everyone 😏" },
  ];

  return (
    <div className="flex flex-wrap justify-center gap-2">
      {badges.map((badge, index) => (
        <div
          key={index}
          className="
            inline-flex items-center gap-1.5 px-3 py-1.5
            bg-[#1a1a1a]/60 backdrop-blur-sm
            rounded-full border border-[#E8A0BF]/20
            font-[family-name:var(--font-inter)]
          "
        >
          <span className="text-sm">{badge.icon}</span>
          <span className="text-xs text-[#FAF5F0]">{badge.text}</span>
        </div>
      ))}
    </div>
  );
}
