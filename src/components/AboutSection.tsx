import React from 'react';
import { ArrowUpRight, Award, Compass, Film, Layers } from 'lucide-react';
import lizPortraitImg from '../assets/images/liz_kendi_portrait_1792226932929.jpg';

interface AboutSectionProps {
  onContact: () => void;
}

export const AboutSection: React.FC<AboutSectionProps> = ({ onContact }) => {
  const tools = [
    { name: 'Cinema 4D & Octane', category: '3D Simulation' },
    { name: 'Adobe After Effects', category: 'Motion & Compositing' },
    { name: 'Adobe Illustrator', category: 'Identity & Vectors' },
    { name: 'Figma', category: 'UI & Systems' },
    { name: 'Adobe InDesign', category: 'Editorial Print' },
    { name: 'Premiere Pro', category: 'Editing & Color' },
  ];

  const milestones = [
    { year: '2026', title: 'Senior Art Director & 3D Motion Lead', place: 'Independent Studio, Nairobi' },
    { year: '2024', title: 'Mainstage Visuals Director', place: 'Kinetic Visual Arts Festival' },
    { year: '2023', title: 'Editorial Risograph Fellow', place: 'Zurich Modern Archive Residency' },
    { year: '2021', title: 'Brand & Motion Designer', place: 'Creative Agencies East Africa' },
  ];

  return (
    <section id="about" className="w-full py-20 lg:py-28 border-t border-white/[0.08] bg-[#0c0912]">
      <div className="max-w-7xl mx-auto px-6">
        {/* Section Header */}
        <div className="max-w-3xl mb-16">
          <div className="flex items-center gap-2 text-xs font-mono tracking-widest text-[#ca57bb] uppercase mb-2">
            <span>About The Artist</span>
            <span aria-hidden="true">·</span>
            <span>Ethos & Practice</span>
          </div>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white leading-tight">
            Bridging East African kinetic energy with architectural precision.
          </h2>
        </div>

        {/* 2-Column Split: Portrait + Bio */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          {/* Left Column: Portrait Card */}
          <div className="lg:col-span-5">
            <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-[#16121f] shadow-2xl">
              <img
                src={lizPortraitImg}
                alt="Liz Kendi, Graphic Designer and Motion Artist in Nairobi, Kenya"
                className="w-full h-auto object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="p-6 bg-[#130f1a] border-t border-white/10">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-display text-xl font-bold text-white">Liz Kendi</h3>
                    <p className="text-xs text-white/60 font-mono mt-0.5">Art Director · Motion Designer</p>
                  </div>
                  <span className="text-xs font-mono text-[#ca57bb] bg-[#8a307f]/15 border border-[#8a307f]/30 px-2.5 py-1 rounded">
                    Nairobi, KE
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Bio Narrative */}
          <div className="lg:col-span-7 flex flex-col space-y-8">
            <div className="text-base sm:text-lg text-white/80 leading-relaxed space-y-5 font-normal">
              <p>
                I am a graphic designer and motion artist based in Nairobi, Kenya. Over the past eight years, my practice has centered on constructing visual worlds that move—transforming static identities into living, breathing kinetic systems.
              </p>
              <p>
                My work draws directly from Nairobi’s kinetic urban tapestry: the syncopated rhythms of Matatu typography, rich textured textiles, and the uncompromising structural rigor of modernist architecture. By pairing these cultural narratives with procedural 3D simulations and Swiss grid systems, I craft identities that stand boldly on international stages.
              </p>
              <p>
                Whether directing mainstage festival visuals, formulating luxury coffee packaging, or directing title sequences, I believe motion is not decoration—it is the emotional heartbeat of modern brand storytelling.
              </p>
            </div>

            {/* Disciplines & Toolkit */}
            <div className="pt-6 border-t border-white/10">
              <h4 className="text-xs font-mono text-white/50 uppercase tracking-widest mb-4">
                Primary Software & Production Toolkit
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {tools.map((t, i) => (
                  <div key={i} className="p-3 rounded-xl bg-white/[0.03] border border-white/10">
                    <span className="text-xs font-semibold text-white block">{t.name}</span>
                    <span className="text-[11px] font-mono text-white/40 block mt-0.5">{t.category}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Milestones / Career Timeline */}
            <div className="pt-6 border-t border-white/10">
              <h4 className="text-xs font-mono text-white/50 uppercase tracking-widest mb-4">
                Selected Milestones & Experience
              </h4>
              <div className="space-y-3 font-mono text-xs">
                {milestones.map((m, i) => (
                  <div key={i} className="flex items-start justify-between py-2 border-b border-white/[0.04]">
                    <div>
                      <span className="text-white font-medium block">{m.title}</span>
                      <span className="text-white/40 block mt-0.5">{m.place}</span>
                    </div>
                    <span className="text-[#ca57bb] tabular-nums font-semibold shrink-0 ml-4">{m.year}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Contact Trigger */}
            <div className="pt-4">
              <button
                onClick={onContact}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/10 hover:bg-[#8a307f] text-white text-sm font-semibold transition-all cursor-pointer"
              >
                <span>Inquire About Availability</span>
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
