import React from 'react';
import { SERVICES } from '../data/initialProjects';
import { CheckCircle2, Clock, Sparkles } from 'lucide-react';

interface ServicesSectionProps {
  onContact: () => void;
}

export const ServicesSection: React.FC<ServicesSectionProps> = ({ onContact }) => {
  return (
    <section id="services" className="w-full py-20 lg:py-28 border-t border-white/[0.08] bg-[#09070c]">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 text-xs font-mono tracking-widest text-[#ca57bb] uppercase mb-2">
              <span>Studio Capabilities</span>
              <span aria-hidden="true">·</span>
              <span>Services & Deliverables</span>
            </div>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white">
              End-to-end design & motion direction.
            </h2>
          </div>

          <button
            onClick={onContact}
            className="px-5 py-2.5 rounded-xl bg-[#8a307f] hover:bg-[#9e3992] text-white text-xs font-semibold tracking-wide transition-all self-start md:self-end cursor-pointer"
          >
            Request Rate Card & Availability
          </button>
        </div>

        {/* 4 Services in an editorial split grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {SERVICES.map((service) => (
            <div
              key={service.number}
              className="p-8 rounded-2xl bg-[#120f18] border border-white/[0.08] hover:border-[#8a307f]/40 transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="font-display text-2xl font-extrabold text-[#ca57bb] tabular-nums">
                    {service.number}
                  </span>
                  <div className="flex items-center gap-1.5 text-xs font-mono text-white/50">
                    <Clock className="w-3.5 h-3.5 text-[#ca57bb]" />
                    <span>{service.timeline}</span>
                  </div>
                </div>

                <h3 className="font-display text-2xl font-bold text-white mb-2">
                  {service.title}
                </h3>
                <p className="text-sm text-white/70 leading-relaxed mb-6 font-normal">
                  {service.description}
                </p>
              </div>

              <div className="pt-6 border-t border-white/[0.06]">
                <span className="text-[11px] font-mono text-white/40 uppercase tracking-widest block mb-3">
                  Included Deliverables
                </span>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-white/80">
                  {service.deliverables.map((deliv, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#ca57bb] shrink-0 mt-0.5" />
                      <span>{deliv}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
