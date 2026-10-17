import React from 'react';
import { ArrowUpRight, Lock, Sparkles } from 'lucide-react';

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  onOpenAdmin: () => void;
  isAdmin: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  onOpenAdmin,
  isAdmin,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-[#0a080d]/85 border-b border-white/[0.06] transition-colors">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between gap-8">
        {/* Zone 1: Brand Wordmark */}
        <button
          onClick={() => onNavigate('home')}
          className="group flex items-center gap-2 text-left cursor-pointer"
        >
          <span className="font-display text-xl font-bold tracking-tight text-white group-hover:text-[#b84ea9] transition-colors whitespace-nowrap shrink-0">
            LIZ KENDI
          </span>
          <span className="hidden sm:inline-block text-[11px] font-mono tracking-widest text-[#ca57bb] uppercase px-1.5 py-0.5 rounded border border-[#8a307f]/40">
            KE
          </span>
        </button>

        {/* Zone 2: 4–5 single-line clean text nav links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-white/70">
          <button
            onClick={() => onNavigate('work')}
            className={`whitespace-nowrap shrink-0 transition-colors hover:text-white cursor-pointer ${
              currentView === 'work' ? 'text-white font-semibold' : ''
            }`}
          >
            Selected Works
          </button>
          <button
            onClick={() => onNavigate('about')}
            className={`whitespace-nowrap shrink-0 transition-colors hover:text-white cursor-pointer ${
              currentView === 'about' ? 'text-white font-semibold' : ''
            }`}
          >
            About & Ethos
          </button>
          <button
            onClick={() => onNavigate('services')}
            className={`whitespace-nowrap shrink-0 transition-colors hover:text-white cursor-pointer ${
              currentView === 'services' ? 'text-white font-semibold' : ''
            }`}
          >
            Capabilities
          </button>
          <button
            onClick={() => onNavigate('testimonials')}
            className={`whitespace-nowrap shrink-0 transition-colors hover:text-white cursor-pointer ${
              currentView === 'testimonials' ? 'text-white font-semibold' : ''
            }`}
          >
            Testimonials
          </button>
          <button
            onClick={() => onNavigate('contact')}
            className={`whitespace-nowrap shrink-0 transition-colors hover:text-white cursor-pointer ${
              currentView === 'contact' ? 'text-white font-semibold' : ''
            }`}
          >
            Inquiries
          </button>
        </nav>

        {/* Zone 3: 1 primary action + subtle admin lock trigger */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => onNavigate('contact')}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold tracking-wide text-white bg-[#8a307f] hover:bg-[#9e3992] rounded-lg transition-all shadow-sm hover:shadow-[#8a307f]/25 cursor-pointer whitespace-nowrap shrink-0"
          >
            <span>Start a Project</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onOpenAdmin}
            title={isAdmin ? 'Admin Dashboard (Active)' : 'Admin Login'}
            className={`p-2 rounded-lg border transition-all cursor-pointer ${
              isAdmin
                ? 'bg-[#8a307f]/20 border-[#8a307f] text-[#ca57bb]'
                : 'bg-white/[0.03] border-white/10 text-white/50 hover:text-white hover:border-white/20'
            }`}
            aria-label="Admin Control Panel"
          >
            {isAdmin ? (
              <Sparkles className="w-4 h-4" />
            ) : (
              <Lock className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
