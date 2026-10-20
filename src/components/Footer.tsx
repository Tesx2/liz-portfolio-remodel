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
        {/* Statement */}
        <div className="mb-16 border-b border-white/[0.08] pb-16">
          <p className="font-display text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-[1.1]">
            Let&rsquo;s bring your vision into <span className="text-[#ca57bb]">motion.</span>
          </p>
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
              <Lock className="w-3.5 h-3.5" />
              <span>Admin</span>
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
