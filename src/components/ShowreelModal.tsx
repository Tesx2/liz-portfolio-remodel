import React, { useEffect, useState } from 'react';
import { X, Play, Pause, Volume2, VolumeX, Maximize2, Sparkles, ArrowRight } from 'lucide-react';
import heroShowreelImg from '../assets/images/liz_hero_showreel_poster_1792226915723.jpg';
import { SiteContent } from '../types';
import { getMediaAssetUrl } from '../services/storageService';

interface ShowreelModalProps {
  isOpen: boolean;
  siteContent?: SiteContent | null;
  onClose: () => void;
  onExploreWork: () => void;
}

const getEmbedUrl = (url?: string | null): string | null => {
  if (!url) return null;
  const trimmed = url.trim();
  const ytMatch = trimmed.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/i
  );
  if (ytMatch && ytMatch[1]) {
    return `https://www.youtube-nocookie.com/embed/${ytMatch[1]}?autoplay=1&rel=0`;
  }
  const vimeoMatch = trimmed.match(/vimeo\.com\/(?:video\/)?([0-9]+)/i);
  if (vimeoMatch && vimeoMatch[1]) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1`;
  }
  return null;
};

export const ShowreelModal: React.FC<ShowreelModalProps> = ({
  isOpen,
  siteContent,
  onClose,
  onExploreWork,
}) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const embedUrl = getEmbedUrl(siteContent?.showreelLink);
  const videoUrl = siteContent?.showreelKey
    ? getMediaAssetUrl(siteContent.showreelKey)
    : null;
  const posterUrl = siteContent?.showreelPosterKey
    ? getMediaAssetUrl(siteContent.showreelPosterKey)
    : heroShowreelImg;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/95 backdrop-blur-2xl animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl rounded-2xl overflow-hidden border border-white/15 bg-[#0c0912] shadow-2xl flex flex-col">
        {/* Header bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#120f18]/80 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono tracking-widest text-[#ca57bb] uppercase">
              2026 Master Motion Reel
            </span>
            <span className="text-white/30" aria-hidden="true">·</span>
            <span className="text-xs font-mono text-white/60">Liz Kendi Studio</span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/60 hover:text-white bg-white/[0.05] hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close Showreel"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video Canvas Container */}
        {embedUrl ? (
          <div className="relative aspect-video w-full bg-black overflow-hidden">
            <iframe
              src={embedUrl}
              title="Liz Kendi Showreel"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full border-0"
            />
          </div>
        ) : videoUrl ? (
          <div className="relative aspect-video w-full bg-black overflow-hidden flex items-center justify-center">
            <video
              src={videoUrl}
              poster={posterUrl}
              controls
              autoPlay
              playsInline
              preload={isOpen ? 'auto' : 'none'}
              className="w-full h-full object-contain"
            />
          </div>
        ) : (
          <div className="relative aspect-video w-full bg-black overflow-hidden group">
            <img
              src={posterUrl}
              alt="Liz Kendi 2026 Master Motion Reel"
              className="w-full h-full object-cover"
            />

            {/* Ambient scanline and chromatic effect simulation */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />

            {/* Center Play Indicator */}
            {!isPlaying && (
              <div
                onClick={() => setIsPlaying(true)}
                className="absolute inset-0 flex items-center justify-center bg-black/40 cursor-pointer"
              >
                <div className="w-20 h-20 rounded-full bg-[#8a307f] text-white flex items-center justify-center shadow-2xl hover:scale-105 transition-transform">
                  <Play className="w-8 h-8 fill-current ml-1" />
                </div>
              </div>
            )}

            {/* Player controls bar */}
            <div className="absolute bottom-4 left-6 right-6 flex items-center justify-between z-20">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="p-2 rounded-lg bg-black/60 hover:bg-black/80 text-white backdrop-blur-md border border-white/15 transition-colors cursor-pointer"
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className="p-2 rounded-lg bg-black/60 hover:bg-black/80 text-white backdrop-blur-md border border-white/15 transition-colors cursor-pointer"
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
                <span className="text-xs font-mono text-white/80 bg-black/60 px-2.5 py-1 rounded backdrop-blur-md border border-white/10">
                  01:24 / 4K UHD 60FPS
                </span>
              </div>

              <div className="flex items-center gap-3">
                <span className="hidden sm:inline-block text-xs font-mono text-white/60">
                  OCTANE RENDER + PROCEDURAL AFTER EFFECTS
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Chapters breakdown */}
        <div className="p-6 bg-[#120f18] border-t border-white/10 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10">
            <span className="text-[#ca57bb] block mb-1">00:00 – 00:28</span>
            <span className="text-white font-medium block">Fluid Typographic Dynamics</span>
            <span className="text-white/40 block mt-0.5">Procedural letter deformers & glass dispersion</span>
          </div>
          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10">
            <span className="text-[#ca57bb] block mb-1">00:28 – 00:54</span>
            <span className="text-white font-medium block">Kinetic Festival Mainstage</span>
            <span className="text-white/40 block mt-0.5">3D stage screen loops and Westlands LED billboards</span>
          </div>
          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10">
            <span className="text-[#ca57bb] block mb-1">00:54 – 01:24</span>
            <span className="text-white font-medium block">Brand Identity Architecture</span>
            <span className="text-white/40 block mt-0.5">Kahava Roastery gold foil & tactile packaging resolve</span>
          </div>
        </div>

        {/* Footer with link to work */}
        <div className="p-4 bg-[#0a080d] border-t border-white/10 flex items-center justify-between text-xs">
          <span className="text-white/50 font-mono">
            Directed & Animated by Liz Kendi
          </span>
          <button
            onClick={() => {
              onClose();
              onExploreWork();
            }}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#8a307f] hover:bg-[#9e3992] text-white rounded-lg font-semibold transition-all cursor-pointer"
          >
            <span>Explore Individual Case Studies</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
