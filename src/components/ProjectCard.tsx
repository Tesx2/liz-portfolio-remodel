import React, { useState } from 'react';
import { ArrowUpRight, Play } from 'lucide-react';
import { ProjectIndexItem } from '../types';
import { getMediaAssetUrl } from '../services/storageService';

interface ProjectCardProps {
  project: ProjectIndexItem;
  onSelect: (slug: string) => void;
  index: number;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ project, onSelect, index }) => {
  const [isHovered, setIsHovered] = useState(false);
  const coverAsset = project.coverAsset;

  const categoryLabels: Record<string, string> = {
    branding: 'Brand Identity',
    motion: '3D Motion Design',
    poster: 'Poster & Editorial',
    social: 'Digital Campaign',
    other: 'Visual Design',
  };

  const isMotion = project.category === 'motion';
  const thumbUrl = coverAsset ? getMediaAssetUrl(coverAsset.thumbKey || coverAsset.key || coverAsset.thumbUrl || coverAsset.url) : '';
  const videoPreviewUrl = isMotion && coverAsset && coverAsset.key ? getMediaAssetUrl(coverAsset.key) : '';

  return (
    <div
      onClick={() => onSelect(project.slug)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group cursor-pointer flex flex-col transition-all duration-300"
    >
      {/* Media container: Natural aspect ratio preservation */}
      <div className="relative w-full rounded-2xl overflow-hidden bg-[#16121f] border border-white/10 transition-all duration-500 group-hover:border-[#8a307f]/60 group-hover:shadow-2xl group-hover:shadow-[#8a307f]/20">
        {coverAsset ? (
          <>
            {isHovered && isMotion && videoPreviewUrl && (videoPreviewUrl.endsWith('.mp4') || videoPreviewUrl.endsWith('.webm')) ? (
              <video
                src={videoPreviewUrl}
                poster={thumbUrl}
                autoPlay
                muted
                loop
                playsInline
                className="w-full h-auto object-cover"
              />
            ) : (
              <img
                src={thumbUrl}
                alt={coverAsset.alt || `${project.title} - ${project.category}`}
                width={coverAsset.width || 800}
                height={coverAsset.height || 600}
                loading="lazy"
                referrerPolicy="no-referrer"
                className={`w-full h-auto object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03] ${
                  isHovered && isMotion ? 'brightness-105' : 'brightness-100'
                }`}
              />
            )}
          </>
        ) : (
          <div className="w-full h-64 flex items-center justify-center bg-[#1a1524] text-white/40">
            <span>No Preview Media</span>
          </div>
        )}

        {/* Hover vignette overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

        {/* Interactive hover cue badge */}
        <div className="absolute bottom-4 right-4 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/80 backdrop-blur-md text-white text-xs font-medium border border-white/20">
            {isMotion ? (
              <>
                <Play className="w-3 h-3 fill-current text-[#ca57bb]" />
                <span>Play Reel</span>
              </>
            ) : (
              <>
                <span>View Case Study</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-[#ca57bb]" />
              </>
            )}
          </div>
        </div>

        {/* Featured marker */}
        {project.featured && (
          <div className="absolute top-3 left-3 pointer-events-none">
            <span className="text-[10px] font-mono tracking-wider text-white/90 bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded border border-white/10">
              FEATURED
            </span>
          </div>
        )}
      </div>

      {/* Project Metadata: Strict Zero-Pill Discipline */}
      <div className="mt-4 flex flex-col">
        <div className="flex items-center gap-2 text-xs text-white/50 mb-1.5 font-mono">
          <span className="text-[#ca57bb] font-medium">
            {categoryLabels[project.category] || project.category}
          </span>
          <span aria-hidden="true">·</span>
          <span>{project.client}</span>
          <span aria-hidden="true">·</span>
          <span className="tabular-nums">{project.year}</span>
        </div>

        <h3 className="font-display text-lg sm:text-xl font-bold text-white group-hover:text-[#ca57bb] transition-colors leading-snug">
          {project.title}
        </h3>

        <p className="text-sm text-white/60 line-clamp-2 mt-1 leading-relaxed font-normal">
          {project.summary}
        </p>
      </div>
    </div>
  );
};
