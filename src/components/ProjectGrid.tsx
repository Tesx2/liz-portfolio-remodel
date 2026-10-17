import React, { useState, useMemo } from 'react';
import { Project, ProjectCategory } from '../types';
import { ProjectCard } from './ProjectCard';
import { Search, SlidersHorizontal } from 'lucide-react';

interface ProjectGridProps {
  projects: Project[];
  onSelectProject: (project: Project) => void;
}

export const ProjectGrid: React.FC<ProjectGridProps> = ({ projects, onSelectProject }) => {
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
      // Must be published for public grid view
      if (project.status !== 'published') return false;

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
          <div className="flex items-center gap-2 text-xs font-mono tracking-widest text-[#ca57bb] uppercase mb-2">
            <span>Portfolio Archive</span>
            <span aria-hidden="true">·</span>
            <span>2024–2026 Works</span>
          </div>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white">
            Selected Case Studies
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

      {/* Grid: Multi-column CSS columns layout preserving natural aspect ratios */}
      {filteredProjects.length > 0 ? (
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-8 space-y-8">
          {filteredProjects.map((project, idx) => (
            <div key={project.id} className="break-inside-avoid">
              <ProjectCard project={project} onSelect={onSelectProject} index={idx} />
            </div>
          ))}
        </div>
      ) : (
        <div className="py-20 text-center rounded-2xl border border-white/[0.06] bg-[#120f18]/50">
          <SlidersHorizontal className="w-8 h-8 text-white/30 mx-auto mb-3" />
          <p className="text-white/70 font-medium">No projects found matching this criteria.</p>
          <p className="text-xs text-white/40 mt-1">Try selecting &ldquo;All Projects&rdquo; or clearing your search term.</p>
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
    </section>
  );
};
