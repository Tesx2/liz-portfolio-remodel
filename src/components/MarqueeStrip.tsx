import React from 'react';

export const MarqueeStrip: React.FC = () => {
  const items = [
    '3D KINETIC TYPOGRAPHY',
    'BRAND IDENTITY SYSTEMS',
    'MOTION REELS & BROADCAST',
    'ARCHITECTURAL EDITORIAL POSTERS',
    'CREATIVE DIRECTION',
    'OCTANE & CINEMA 4D',
    'NAIROBI / GLOBAL',
  ];

  return (
    <div className="w-full overflow-hidden border-y border-white/[0.08] bg-[#0d0a13] py-3.5 select-none">
      <div className="animate-marquee flex items-center gap-8 text-xs font-mono tracking-widest text-white/50 uppercase">
        {items.concat(items).map((text, idx) => (
          <React.Fragment key={idx}>
            <span className="hover:text-[#ca57bb] transition-colors">{text}</span>
            <span className="text-[#8a307f]" aria-hidden="true">✦</span>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};
