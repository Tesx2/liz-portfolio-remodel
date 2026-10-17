import React, { useEffect, useState } from 'react';
import { X, ArrowRight, ArrowLeft, ExternalLink, Calendar, User, Tag, CheckCircle2 } from 'lucide-react';
import { Project } from '../types';

interface CaseStudyModalProps {
  project: Project | null;
  allProjects: Project[];
  onClose: () => void;
  onNavigateProject: (project: Project) => void;
  onContact: () => void;
}

export const CaseStudyModal: React.FC<CaseStudyModalProps> = ({
  project,
  allProjects,
  onClose,
  onNavigateProject,
  onContact,
}) => {
  const [selectedAssetIndex, setSelectedAssetIndex] = useState(0);

  useEffect(() => {
    setSelectedAssetIndex(0);
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [project, onClose]);

  if (!project) return null;

  const currentAsset = project.assets[selectedAssetIndex] || project.assets[0];
  const isPortrait =
    currentAsset && currentAsset.width && currentAsset.height
      ? currentAsset.height > currentAsset.width
      : false;

  const publishedProjects = allProjects.filter((p) => p.status === 'published');
  const currentIndex = publishedProjects.findIndex((p) => p.id === project.id);
  const nextProject =
    currentIndex >= 0 && currentIndex < publishedProjects.length - 1
      ? publishedProjects[currentIndex + 1]
      : publishedProjects[0];
  const prevProject =
    currentIndex > 0
      ? publishedProjects[currentIndex - 1]
      : publishedProjects[publishedProjects.length - 1];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/90 backdrop-blur-xl animate-in fade-in duration-200">
      {/* Top action bar */}
      <div className="sticky top-0 z-30 flex items-center justify-between px-6 py-4 bg-[#0a080d]/80 backdrop-blur-md border-b border-white/10">
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono tracking-wider text-[#ca57bb] uppercase">
            CASE STUDY · {project.category.toUpperCase()}
          </span>
          <span className="text-white/30" aria-hidden="true">/</span>
          <span className="text-sm font-semibold text-white truncate max-w-xs sm:max-w-md">
            {project.title}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {prevProject && (
            <button
              onClick={() => onNavigateProject(prevProject)}
              title={`Previous: ${prevProject.title}`}
              className="p-2 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-white/70 hover:text-white transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          {nextProject && (
            <button
              onClick={() => onNavigateProject(nextProject)}
              title={`Next: ${nextProject.title}`}
              className="p-2 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-white/70 hover:text-white transition-colors cursor-pointer"
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
        {/*
          Golden Rule:
          "portrait artwork shows image and details side by side;
           landscape puts the image on top with details below."
        */}
        {isPortrait ? (
          /* PORTRAIT LAYOUT: Side-by-side */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
            {/* Visual Media Column (Left) */}
            <div className="lg:col-span-6 sticky top-24">
              <div className="rounded-2xl overflow-hidden border border-white/10 bg-[#14101c] shadow-2xl">
                <img
                  src={currentAsset?.url}
                  alt={currentAsset?.alt || project.title}
                  className="w-full h-auto max-h-[80vh] object-contain mx-auto"
                  referrerPolicy="no-referrer"
                />
              </div>

              {/* Asset thumbnails if multiple */}
              {project.assets.length > 1 && (
                <div className="flex items-center gap-3 mt-4 overflow-x-auto pb-2">
                  {project.assets.map((asset, idx) => (
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
                        src={asset.thumbUrl || asset.url}
                        alt={asset.alt}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Details Column (Right) */}
            <div className="lg:col-span-6 flex flex-col">
              <ProjectMetaAndStory project={project} onContact={onContact} />
            </div>
          </div>
        ) : (
          /* LANDSCAPE LAYOUT: Media on top, Details below */
          <div className="flex flex-col space-y-12">
            {/* Top Media Hero */}
            <div className="w-full rounded-2xl overflow-hidden border border-white/10 bg-[#14101c] shadow-2xl">
              <img
                src={currentAsset?.url}
                alt={currentAsset?.alt || project.title}
                className="w-full h-auto max-h-[75vh] object-contain mx-auto"
                referrerPolicy="no-referrer"
              />
            </div>

            {/* Asset thumbnails if multiple */}
            {project.assets.length > 1 && (
              <div className="flex items-center gap-3 overflow-x-auto pb-2">
                {project.assets.map((asset, idx) => (
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
                      src={asset.thumbUrl || asset.url}
                      alt={asset.alt}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Details below */}
            <div className="max-w-4xl mx-auto w-full">
              <ProjectMetaAndStory project={project} onContact={onContact} />
            </div>
          </div>
        )}

        {/* Next project teaser banner */}
        {nextProject && (
          <div className="mt-20 pt-10 border-t border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div>
              <span className="text-xs font-mono text-white/40 uppercase tracking-widest">
                Next Case Study
              </span>
              <h4 className="font-display text-2xl font-bold text-white mt-1">
                {nextProject.title}
              </h4>
              <p className="text-sm text-white/60 mt-0.5">{nextProject.client} · {nextProject.year}</p>
            </div>

            <button
              onClick={() => onNavigateProject(nextProject)}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white/10 hover:bg-[#8a307f] text-white text-sm font-semibold transition-all cursor-pointer"
            >
              <span>Explore Next Project</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
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
      {/* Title & Client Bar */}
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

      {/* Metadata grid - strict unboxed style */}
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

      {/* Challenge & Solution */}
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

      {/* Story Description (Markdown prose) */}
      <div className="prose prose-invert max-w-none text-sm text-white/70 leading-relaxed space-y-4 font-normal">
        {project.description.split('\n\n').map((paragraph, i) => (
          <p key={i}>{paragraph}</p>
        ))}
      </div>

      {/* Deliverables & Tools */}
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

      {/* Action CTA */}
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
