import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, ArrowDown, Eye } from 'lucide-react';
import heroShowreelImg from '../assets/images/liz_hero_showreel_poster_1792226915723.jpg';
import lizPortraitImg from '../assets/images/liz_kendi_portrait_1792226932929.jpg';
import { SiteContent } from '../types';
import { getMediaAssetUrl } from '../services/storageService';

interface HeroProps {
  siteContent?: SiteContent | null;
  onExploreWork: () => void;
  onOpenShowreelModal: () => void;
}

export const Hero: React.FC<HeroProps> = ({ siteContent, onExploreWork, onOpenShowreelModal }) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  const portraitUrl = siteContent?.portraitKey
    ? getMediaAssetUrl(siteContent.portraitKey)
    : lizPortraitImg;

  const heroPosterUrl = siteContent?.heroPosterKey
    ? getMediaAssetUrl(siteContent.heroPosterKey)
    : siteContent?.showreelPosterKey
    ? getMediaAssetUrl(siteContent.showreelPosterKey)
    : heroShowreelImg;

  // The hero must use only heroLoopKey, never the showreel file
  const heroLoopUrl = siteContent?.heroLoopKey
    ? getMediaAssetUrl(siteContent.heroLoopKey)
    : null;

  const [canLoadVideo, setCanLoadVideo] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isSaveData = Boolean((navigator as any)?.connection?.saveData);
    const isUnder768 = window.innerWidth < 768;
    return !prefersReducedMotion && !isSaveData && !isUnder768;
  });

  useEffect(() => {
    const checkConditions = () => {
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const isSaveData = Boolean((navigator as any)?.connection?.saveData);
      const isUnder768 = window.innerWidth < 768;
      setCanLoadVideo(!prefersReducedMotion && !isSaveData && !isUnder768);
    };

    checkConditions();

    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    motionQuery.addEventListener?.('change', checkConditions);
    window.addEventListener('resize', checkConditions);

    return () => {
      motionQuery.removeEventListener?.('change', checkConditions);
      window.removeEventListener('resize', checkConditions);
    };
  }, []);

  const shouldLoadVideo = Boolean(canLoadVideo && heroLoopUrl);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
    }
    setIsMuted(!isMuted);
  };

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
      if (isPlaying) {
        videoRef.current.play().catch(() => {});
      }
    }
  }, [shouldLoadVideo, heroLoopUrl]);

  return (
    <section className="relative w-full pt-12 pb-16 lg:pt-20 lg:pb-24 border-b border-white/[0.06] overflow-hidden">
      {/* Subtle radial ambient glow in brand purple */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[450px] bg-[#8a307f]/15 blur-[140px] pointer-events-none rounded-full" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* Split Hero: Typography Left, Visual Container Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-stretch">
          {/* Left Column: Typographic Hierarchy */}
          <div className="lg:col-span-7 flex flex-col justify-between">
            <div>
              {/* Quiet unboxed text kicker with hero portrait */}
              <div className="flex items-center gap-2.5 text-xs font-mono tracking-widest text-[#ca57bb] uppercase mb-5">
                <img
                  src={portraitUrl}
                  alt="Liz Kendi"
                  className="w-6 h-6 rounded-full object-cover border border-[#ca57bb]/40 shrink-0"
                />
                <span>Art Director & Motion Artist</span>
                <span aria-hidden="true">·</span>
                <span>Nairobi, Kenya</span>
              </div>

              {/* Headline with text-wrap balance */}
              <h1 className="font-display text-4xl sm:text-6xl xl:text-7xl font-extrabold tracking-tight text-white leading-[1.05] mb-6 [text-wrap:balance]">
                MOTION THAT <br className="hidden sm:inline" />
                COMMANDS <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-[#f0c2ea] to-[#ca57bb]">ATTENTION.</span>
              </h1>

              {/* Lead copy */}
              <p className="text-base sm:text-lg text-white/70 max-w-xl leading-relaxed mb-8 font-normal">
                Synthesizing East African kinetic rhythm, architectural Swiss typography, and high-fidelity 3D procedural simulation for international cultural institutions, luxury brands, and forward-thinking enterprises.
              </p>
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                onClick={onExploreWork}
                className="group flex items-center gap-2.5 px-6 py-3.5 text-sm font-semibold text-white bg-[#8a307f] hover:bg-[#9e3992] rounded-xl transition-all shadow-lg shadow-[#8a307f]/25 cursor-pointer"
              >
                <span>Explore Selected Works</span>
                <ArrowDown className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
              </button>

              <button
                onClick={onOpenShowreelModal}
                className="flex items-center gap-2 px-5 py-3.5 text-sm font-medium text-white/90 bg-white/[0.05] hover:bg-white/[0.09] border border-white/10 hover:border-white/20 rounded-xl transition-all cursor-pointer"
              >
                <Eye className="w-4 h-4 text-[#ca57bb]" />
                <span>2026 Showreel (01:24)</span>
              </button>
            </div>
          </div>

          {/* Right Column: Hero Visual Container at Matching Height */}
          <div className="lg:col-span-5 flex flex-col justify-center">
            <div className="group relative w-full h-[380px] sm:h-[460px] lg:h-full min-h-[380px] rounded-2xl overflow-hidden border border-white/10 bg-[#14101b] shadow-2xl">
              {/* Media Image / Hero Loop backdrop */}
              {shouldLoadVideo ? (
                <video
                  ref={videoRef}
                  src={heroLoopUrl!}
                  poster={heroPosterUrl}
                  autoPlay
                  loop
                  muted={isMuted}
                  playsInline
                  preload="metadata"
                  className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                />
              ) : (
                <img
                  src={heroPosterUrl}
                  alt="Liz Kendi 3D procedural fluid motion reel title sequence render"
                  className={`w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 ${
                    isPlaying ? 'brightness-100' : 'brightness-75'
                  }`}
                  referrerPolicy="no-referrer"
                />
              )}

              {/* Scrim overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

              {/* Video control overlay HUD */}
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between z-20">
                <div className="flex items-center gap-2">
                  <button
                    onClick={togglePlay}
                    className="p-2.5 rounded-lg bg-black/60 hover:bg-black/80 backdrop-blur-md text-white border border-white/10 transition-colors cursor-pointer"
                    aria-label={isPlaying ? 'Pause Showreel' : 'Play Showreel'}
                  >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={toggleMute}
                    className="p-2.5 rounded-lg bg-black/60 hover:bg-black/80 backdrop-blur-md text-white border border-white/10 transition-colors cursor-pointer"
                    aria-label={isMuted ? 'Unmute Audio' : 'Mute Audio'}
                  >
                    {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                  <span className="text-xs font-mono text-white/80 bg-black/50 px-2 py-1 rounded backdrop-blur-sm">
                    {isPlaying ? 'LIVE REEL · 4K 60FPS' : 'PAUSED'}
                  </span>
                </div>

                <button
                  onClick={onOpenShowreelModal}
                  className="text-xs font-medium text-white/90 bg-white/10 hover:bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/15 transition-all cursor-pointer"
                >
                  Fullscreen
                </button>
              </div>

              {/* Brand watermark badge on top right */}
              <div className="absolute top-4 right-4 z-20 pointer-events-none">
                <span className="text-[10px] font-mono tracking-wider text-white/80 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded border border-white/10">
                  OCTANE 3D + AFTER EFFECTS
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Full-Width Row of Key Metrics Below the Split (adheres to Rule 13 / Portfolio Guidelines) */}
        <div className="mt-16 pt-8 border-t border-white/[0.08] grid grid-cols-2 md:grid-cols-4 gap-6 lg:gap-8">
          <div>
            <div className="text-3xl lg:text-4xl font-bold font-display text-white tabular-nums">08+</div>
            <div className="text-xs font-medium text-white/50 uppercase tracking-wider mt-1">Years Directing Motion</div>
          </div>
          <div>
            <div className="text-3xl lg:text-4xl font-bold font-display text-white tabular-nums">40+</div>
            <div className="text-xs font-medium text-white/50 uppercase tracking-wider mt-1">Global Client Projects</div>
          </div>
          <div>
            <div className="text-3xl lg:text-4xl font-bold font-display text-white tabular-nums">100%</div>
            <div className="text-xs font-medium text-white/50 uppercase tracking-wider mt-1">R2 Direct-Edge Cloud CDN</div>
          </div>
          <div>
            <div className="text-3xl lg:text-4xl font-bold font-display text-white tabular-nums">EAT</div>
            <div className="text-xs font-medium text-white/50 uppercase tracking-wider mt-1">Nairobi Hub (GMT+3)</div>
          </div>
        </div>
      </div>
    </section>
  );
};
