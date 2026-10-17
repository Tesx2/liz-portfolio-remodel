import React, { useEffect, useState } from 'react';
import { X, ArrowRight, ArrowLeft, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { Project } from '../types';
import { fetchProjectBySlug, getMediaAssetUrl } from '../services/storageService';

interface CaseStudyModalProps {
  slug: string | null;
  allSlugs: string[];
  onClose: () => void;
  onNavigateSlug: (slug: string) => void;
  onContact: () => void;
}

export const CaseStudyModal: React.FC<CaseStudyModalProps> = ({
  slug,
  allSlugs,
  onClose,
  onNavigateSlug,
  onContact,
}) => {
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedAssetIndex, setSelectedAssetIndex] = useState(0);

  useEffect(() => {
    if (!slug) {
      setProject(null);
      return;
    }

    setIsLoading(true);
    setError(null);
    setSelectedAssetIndex(0);

    fetchProjectBySlug(slug)
      .then((proj) => {
        setProject(proj);
        setIsLoading(false);
        // Requirement 3: update document.title and meta description
        document.title = `${proj.title} — Liz Kendi`;
        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc) {
          metaDesc.setAttribute('content', proj.summary || proj.title);
        }
      })
      .catch((err) => {
        setError(err.message || 'Failed loading project from Cloudflare R2');
        setIsLoading(false);
      });

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.title = 'Liz Kendi — Graphic Designer & Motion Artist Portfolio';
    };
  }, [slug, onClose]);

  if (!slug) return null;

  const currentIndex = allSlugs.indexOf(slug);
  const nextSlug =
    currentIndex >= 0 && currentIndex < allSlugs.length - 1
      ? allSlugs[currentIndex + 1]
      : allSlugs[0];
  const prevSlug =
    currentIndex > 0 ? allSlugs[currentIndex - 1] : allSlugs[allSlugs.length - 1];

  const currentAsset = project?.assets[selectedAssetIndex] || project?.assets[0];
  const isPortrait =
    currentAsset && currentAsset.width && currentAsset.height
      ? currentAsset.height > currentAsset.width
      : false;

  const currentAssetUrl = currentAsset ? getMediaAssetUrl(currentAsset.key) : '';
  const isVideo = currentAsset?.type === 'video' || currentAssetUrl.endsWith('.mp4') || currentAssetUrl.endsWith('.webm');

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/90 backdrop-blur-xl animate-in fade-in duration-200">
      {/* Top action bar */}
      <div className="sticky top-0 z-30 flex items-center justify-between px-6 py-4 bg-[#0a080d]/80 backdrop-blur-md border-b border-white/10">
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono tracking-wider text-[#ca57bb] uppercase">
            CASE STUDY · {project ? project.category.toUpperCase() : 'LOADING'}
          </span>
          <span className="text-white/30" aria-hidden="true">/</span>
          <span className="text-sm font-semibold text-white truncate max-w-xs sm:max-w-md">
            {project?.title || slug}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {prevSlug && (
            <button
              onClick={() => onNavigateSlug(prevSlug)}
              className="p-2 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-white/70 hover:text-white transition-colors cursor-pointer"
              title="Previous Project"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          {nextSlug && (
            <button
              onClick={() => onNavigateSlug(nextSlug)}
              className="p-2 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-white/70 hover:text-white transition-colors cursor-pointer"
              title="Next Project"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-2 ml-2 rounded-lg bg-white/[0.08] hover:bg-white/[0.15] text-white transition-colors cursor-pointer"
            aria-label="Close Case Study"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-10 lg:py-16">
        {isLoading && (
          <div className="py-32 text-center flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-10 h-10 animate-spin text-[#ca57bb]" />
            <span className="text-xs font-mono text-white/50">Fetching case study from Cloudflare R2...</span>
          </div>
        )}

        {error && (
          <div className="py-24 text-center rounded-2xl border border-red-500/20 bg-red-500/5 p-8 max-w-md mx-auto space-y-3">
            <AlertCircle className="w-8 h-8 text-red-400 mx-auto" />
            <h3 className="font-display text-lg font-bold text-white">Project Not Found</h3>
            <p className="text-xs font-mono text-white/60">{error}</p>
            <button
              onClick={onClose}
              className="mt-3 px-4 py-2 bg-white/10 hover:bg-white/15 rounded-lg text-xs font-semibold text-white cursor-pointer"
            >
              Back to Overview
            </button>
          </div>
        )}

        {!isLoading && project && (
          <>
            {isPortrait ? (
              /* PORTRAIT LAYOUT: Side-by-side */
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
                <div className="lg:col-span-6 sticky top-24">
                  <div className="rounded-2xl overflow-hidden border border-white/10 bg-[#14101c] shadow-2xl">
                    {isVideo ? (
                      <video
                        src={currentAssetUrl}
                        controls
                        playsInline
                        className="w-full h-auto max-h-[80vh] object-contain mx-auto"
                      />
                    ) : (
                      <img
                        src={currentAssetUrl}
                        alt={currentAsset?.alt || project.title}
                        className="w-full h-auto max-h-[80vh] object-contain mx-auto"
                        referrerPolicy="no-referrer"
                      />
                    )}
                  </div>

                  {project.assets.length > 1 && (
                    <div className="flex items-center gap-3 mt-4 overflow-x-auto pb-2">
                      {project.assets.map((asset, idx) => {
                        const thumbSrc = getMediaAssetUrl(asset.thumbKey || asset.key);
                        return (
                          <button
                            key={asset.id}
                            onClick={() => setSelectedAssetIndex(idx)}
                            className={`relative w-16 h-16 rounded-lg overflow-hidden border-2 shrink-0 transition-all cursor-pointer ${
                              selectedAssetIndex === idx
                                ? 'border-[#8a307f] ring-2 ring-[#8a307f]/50'
                                : 'border-white/10 opacity-60 hover:opacity-100'
                            }`}
                          >
                            <img
                              src={thumbSrc}
                              alt={asset.alt}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="lg:col-span-6 flex flex-col">
                  <ProjectMetaAndStory project={project} onContact={onContact} />
                </div>
              </div>
            ) : (
              /* LANDSCAPE LAYOUT: Media on top, Details below */
              <div className="flex flex-col space-y-12">
                <div className="w-full rounded-2xl overflow-hidden border border-white/10 bg-[#14101c] shadow-2xl">
                  {isVideo ? (
                    <video
                      src={currentAssetUrl}
                      controls
                      playsInline
                      className="w-full h-auto max-h-[75vh] object-contain mx-auto"
                    />
                  ) : (
                    <img
                      src={currentAssetUrl}
                      alt={currentAsset?.alt || project.title}
                      className="w-full h-auto max-h-[75vh] object-contain mx-auto"
                      referrerPolicy="no-referrer"
                    />
                  )}
                </div>

                {project.assets.length > 1 && (
                  <div className="flex items-center gap-3 overflow-x-auto pb-2">
                    {project.assets.map((asset, idx) => {
                      const thumbSrc = getMediaAssetUrl(asset.thumbKey || asset.key);
                      return (
                        <button
                          key={asset.id}
                          onClick={() => setSelectedAssetIndex(idx)}
                          className={`relative w-20 h-20 rounded-lg overflow-hidden border-2 shrink-0 transition-all cursor-pointer ${
                            selectedAssetIndex === idx
                              ? 'border-[#8a307f] ring-2 ring-[#8a307f]/50'
                              : 'border-white/10 opacity-60 hover:opacity-100'
                          }`}
                        >
                          <img
                            src={thumbSrc}
                            alt={asset.alt}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </button>
                      );
                    })}
                  </div>
                )}

                <div className="max-w-4xl mx-auto w-full">
                  <ProjectMetaAndStory project={project} onContact={onContact} />
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

interface ProjectMetaAndStoryProps {
  project: Project;
  onContact: () => void;
}

const ProjectMetaAndStory: React.FC<ProjectMetaAndStoryProps> = ({ project, onContact }) => {
  return (
    <div className="flex flex-col space-y-8">
      <div>
        <div className="flex items-center gap-2 text-xs font-mono tracking-widest text-[#ca57bb] uppercase mb-2">
          <span>{project.category}</span>
          <span aria-hidden="true">·</span>
          <span>{project.year}</span>
        </div>
        <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-white leading-tight">
          {project.title}
        </h2>
        <p className="text-lg text-white/75 mt-3 leading-relaxed font-normal">
          {project.summary}
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-5 border-y border-white/10 text-xs font-mono">
        <div>
          <span className="text-white/40 block mb-1">CLIENT</span>
          <span className="text-white font-medium">{project.client}</span>
        </div>
        <div>
          <span className="text-white/40 block mb-1">YEAR</span>
          <span className="text-white font-medium tabular-nums">{project.year}</span>
        </div>
        <div>
          <span className="text-white/40 block mb-1">ROLE</span>
          <span className="text-white font-medium">{project.role}</span>
        </div>
        <div>
          <span className="text-white/40 block mb-1">LOCATION</span>
          <span className="text-white font-medium">Nairobi / Global</span>
        </div>
      </div>

      {project.challenge && (
        <div className="space-y-4">
          <div>
            <h4 className="text-xs font-mono tracking-widest text-white/40 uppercase mb-1">
              01. The Challenge
            </h4>
            <p className="text-sm text-white/80 leading-relaxed font-normal">
              {project.challenge}
            </p>
          </div>
          {project.solution && (
            <div>
              <h4 className="text-xs font-mono tracking-widest text-white/40 uppercase mb-1">
                02. The Creative Solution
              </h4>
              <p className="text-sm text-white/80 leading-relaxed font-normal">
                {project.solution}
              </p>
            </div>
          )}
        </div>
      )}

      {project.description && (
        <div className="prose prose-invert max-w-none text-sm text-white/70 leading-relaxed space-y-4 font-normal">
          {project.description.split('\n\n').map((paragraph, i) => (
            <p key={i}>{paragraph}</p>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-white/10">
        {project.deliverables && project.deliverables.length > 0 && (
          <div>
            <h4 className="text-xs font-mono text-white/40 uppercase tracking-wider mb-2">
              Deliverables
            </h4>
            <ul className="space-y-1.5 text-xs text-white/80">
              {project.deliverables.map((item, i) => (
                <li key={i} className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#ca57bb] shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {project.toolsUsed && project.toolsUsed.length > 0 && (
          <div>
            <h4 className="text-xs font-mono text-white/40 uppercase tracking-wider mb-2">
              Tools & Engine
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {project.toolsUsed.map((tool, i) => (
                <span
                  key={i}
                  className="text-xs font-mono text-white/70 bg-white/[0.06] px-2.5 py-1 rounded"
                >
                  {tool}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="pt-6">
        <button
          onClick={onContact}
          className="w-full py-3.5 px-6 rounded-xl bg-[#8a307f] hover:bg-[#9e3992] text-white font-semibold text-sm tracking-wide transition-all shadow-lg shadow-[#8a307f]/20 cursor-pointer"
        >
          Commission a Project Similar to This
        </button>
      </div>
    </div>
  );
};
