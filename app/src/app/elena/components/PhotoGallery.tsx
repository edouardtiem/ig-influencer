"use client";

// Gallery items with censored images
const galleryItems = [
  { id: 1, src: "/elena/gallery/1_censored.png" },
  { id: 2, src: "/elena/gallery/2_censored.png" },
  { id: 3, src: "/elena/gallery/3_censored.png" },
  { id: 4, src: "/elena/gallery/4_censored.png" },
  { id: 5, src: "/elena/gallery/5_censored.png" },
  { id: 6, src: "/elena/gallery/6_censored.png" },
];

export function PhotoGallery() {
  const fanvueUrl = "https://www.fanvue.com/elenav.paris/fv-3?free_trial=a873adf0-4d08-4f84-aa48-a8861df6669f&utm_source=linktree&utm_medium=gallery&utm_campaign=free_trial_7days";

  const handleClick = () => {
    window.open(fanvueUrl, "_blank");
  };

  // Double the items for seamless infinite scroll
  const doubledItems = [...galleryItems, ...galleryItems];

  return (
    <div className="space-y-3">
      {/* Scrolling banner with transparent fade edges using CSS mask */}
      <div 
        className="relative overflow-hidden cursor-pointer"
        onClick={handleClick}
        style={{
          maskImage: "linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)",
          WebkitMaskImage: "linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)",
        }}
      >
        {/* Scrolling track */}
        <div 
          className="flex gap-3 hover:[animation-play-state:paused]"
          style={{
            width: "max-content",
            animation: "scroll 20s linear infinite",
          }}
        >
          {doubledItems.map((item, index) => (
            <div
              key={`${item.id}-${index}`}
              className="
                flex-shrink-0 w-28 h-28 rounded-xl overflow-hidden
                border border-[#E8A0BF]/20
                hover:border-[#E8A0BF]/50
                transition-all duration-200
              "
            >
              <img 
                src={item.src} 
                alt="" 
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Caption */}
      <p className="text-center text-[#A0A0A0] text-sm font-[family-name:var(--font-inter)]">
        Unlock <span className="text-[#E8A0BF]">50+</span> exclusive photos & videos
      </p>
    </div>
  );
}
