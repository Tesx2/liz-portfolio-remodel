import React, { useState, useMemo } from 'react';
import { ProjectIndexItem } from '../types';
import { ProjectCard } from './ProjectCard';
import { Search, SlidersHorizontal, Loader2, AlertCircle, RefreshCw } from 'lucide-react';

interface ProjectGridProps {
  projects: ProjectIndexItem[];
  isLoading: boolean;
  error: string | null;
  isMediaConfigured: boolean;
  onRetry: () => void;
  onSelectProject: (slug: string) => void;
}

export const ProjectGrid: React.FC<ProjectGridProps> = ({
  projects,
  isLoading,
  error,
  isMediaConfigured,
  onRetry,
  onSelectProject,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const categories: { key: string; label: string }[] = [
    { key: 'all', label: 'All Projects' },
    { key: 'branding', label: 'Brand Identity' },
    { key: 'motion', label: 'Motion & 3D' },
    { key: 'poster', label: 'Poster & Print' },
    { key: 'social', label: 'Campaign' },
  ];

  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      const matchesCategory =
        selectedCategory === 'all' || project.category === selectedCategory;

      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        project.title.toLowerCase().includes(query) ||
        project.client.toLowerCase().includes(query) ||
        project.summary.toLowerCase().includes(query);

      return matchesCategory && matchesSearch;
    });
  }, [projects, selectedCategory, searchQuery]);

  return (
    <section id="work" className="w-full py-16 lg:py-24 max-w-7xl mx-auto px-6">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white">
            Work
          </h2>
        </div>

        {/* Search input with sleek styling */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            type="text"
            placeholder="Search projects or clients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-[#14101c] border border-white/10 rounded-xl text-sm text-white placeholder-white/40 focus:outline-none focus:border-[#8a307f] transition-colors"
          />
        </div>
      </div>

      {/* Category filter tabs bar */}
      <div className="flex flex-wrap items-center gap-2 mb-12 p-1.5 bg-[#14101c] rounded-xl border border-white/[0.08] w-fit">
        {categories.map((cat) => {
          const isActive = selectedCategory === cat.key;
          return (
            <button
              key={cat.key}
              onClick={() => setSelectedCategory(cat.key)}
              className={`px-4 py-2 text-xs font-medium rounded-lg transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                isActive
                  ? 'bg-[#8a307f] text-white shadow-sm'
                  : 'text-white/60 hover:text-white hover:bg-white/[0.05]'
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="py-28 text-center flex flex-col items-center justify-center space-y-3 rounded-2xl border border-white/[0.06] bg-[#120f18]/30">
          <Loader2 className="w-8 h-8 animate-spin text-[#ca57bb]" />
          <span className="text-xs font-mono text-white/50">Fetching projects from Cloudflare R2...</span>
        </div>
      )}

      {/* Media address not configured state */}
      {!isLoading && !isMediaConfigured && (
        <div className="py-24 text-center rounded-2xl border border-amber-500/20 bg-amber-500/5 p-8 max-w-xl mx-auto space-y-4">
          <AlertCircle className="w-8 h-8 text-amber-400 mx-auto" />
          <div>
            <h3 className="font-display text-xl font-bold text-white">Media address is not configured</h3>
            <p className="text-xs text-white/60 font-mono mt-1 leading-relaxed">
              PUBLIC_MEDIA_BASE_URL is not set. Configure your Cloudflare R2 media custom domain in Netlify environment variables (e.g. https://media.yourdomain.com).
            </p>
          </div>
        </div>
      )}

      {/* Error state */}
      {!isLoading && isMediaConfigured && error && (
        <div className="py-24 text-center rounded-2xl border border-red-500/20 bg-red-500/5 p-8 max-w-xl mx-auto space-y-4">
          <AlertCircle className="w-8 h-8 text-red-400 mx-auto" />
          <div>
            <h3 className="font-display text-lg font-bold text-white">Could not load projects</h3>
            <p className="text-xs text-white/60 font-mono mt-1">{error}</p>
          </div>
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/15 rounded-lg text-xs font-semibold text-white transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry Connection</span>
          </button>
        </div>
      )}

      {/* Empty state (when media address is configured, but 0 published projects) */}
      {!isLoading && isMediaConfigured && !error && projects.length === 0 && (
        <div className="py-24 text-center rounded-2xl border border-white/[0.08] bg-[#120f18]/40 p-8 space-y-3">
          <SlidersHorizontal className="w-8 h-8 text-white/30 mx-auto" />
          <h3 className="font-display text-xl font-bold text-white">New work is being added</h3>
          <p className="text-xs text-white/50 font-mono max-w-md mx-auto">
            Projects published from the studio admin panel will appear here immediately from Cloudflare R2.
          </p>
        </div>
      )}

      {/* Filtered empty state */}
      {!isLoading && !error && projects.length > 0 && filteredProjects.length === 0 && (
        <div className="py-20 text-center rounded-2xl border border-white/[0.06] bg-[#120f18]/50">
          <SlidersHorizontal className="w-8 h-8 text-white/30 mx-auto mb-3" />
          <p className="text-white/70 font-medium">No projects found matching your search.</p>
          <button
            onClick={() => {
              setSelectedCategory('all');
              setSearchQuery('');
            }}
            className="mt-4 px-4 py-2 text-xs text-white font-medium bg-white/10 hover:bg-white/15 rounded-lg transition-colors cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* Grid: Multi-column columns layout preserving natural aspect ratios */}
      {!isLoading && !error && filteredProjects.length > 0 && (
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-8 space-y-8">
          {filteredProjects.map((project, idx) => (
            <div key={project.id} className="break-inside-avoid">
              <ProjectCard project={project} onSelect={onSelectProject} index={idx} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
};
