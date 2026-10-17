import React from 'react';
import { ArrowUp, Lock, Sparkles } from 'lucide-react';

interface FooterProps {
  onOpenAdmin: () => void;
  isAdmin: boolean;
}

export const Footer: React.FC<FooterProps> = ({ onOpenAdmin, isAdmin }) => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="w-full bg-[#070509] border-t border-white/[0.08] pt-20 pb-12 text-white">
      <div className="max-w-7xl mx-auto px-6">
        {/* Oversized editorial statement */}
        <div className="mb-16 border-b border-white/[0.08] pb-16">
          <div className="flex items-center gap-2 text-xs font-mono tracking-widest text-[#ca57bb] uppercase mb-4">
            <span>Portfolio Direction</span>
            <span aria-hidden="true">·</span>
            <span>2026 Edition</span>
          </div>
          <h2 className="font-display text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.05]">
            LET&rsquo;S BRING YOUR VISION <br />
            INTO <span className="text-[#ca57bb]">MOTION.</span>
          </h2>
        </div>

        {/* Bottom bar: Quiet copyright, real links, back to top */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 text-xs text-white/50 font-mono">
          <div>
            <span>© {new Date().getFullYear()} Liz Kendi. All rights reserved.</span>
            <span className="mx-2" aria-hidden="true">·</span>
            <span>Nairobi, Kenya</span>
          </div>

          <div className="flex items-center gap-6">
            <button
              onClick={onOpenAdmin}
              className="flex items-center gap-1.5 text-white/40 hover:text-white transition-colors cursor-pointer"
            >
              {isAdmin ? (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-[#ca57bb]" />
                  <span>Admin Mode Active</span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  <span>Admin Sign-in</span>
                </>
              )}
            </button>

            <button
              onClick={scrollToTop}
              className="flex items-center gap-1 text-white/60 hover:text-white transition-colors cursor-pointer"
            >
              <span>Back to Top</span>
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
