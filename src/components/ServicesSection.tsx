import React from 'react';
import { SERVICES } from '../data/initialProjects';
import { CheckCircle2, Clock } from 'lucide-react';
import { SiteContent } from '../types';
import { getMediaAssetUrl } from '../services/storageService';

interface ServicesSectionProps {
  siteContent?: SiteContent | null;
  onContact: () => void;
}

export const ServicesSection: React.FC<ServicesSectionProps> = ({ siteContent, onContact }) => {
  const servicesToDisplay = (
    Array.isArray(siteContent?.services)
      ? siteContent.services
      : SERVICES
  )
    .filter((s) => s.visible !== false)
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

  return (
    <section id="services" className="w-full py-20 lg:py-28 border-t border-white/[0.08] bg-[#09070c]">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
          <div className="max-w-2xl">
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white">
              Services
            </h2>
          </div>

          <button
            onClick={onContact}
            className="px-5 py-2.5 rounded-xl bg-[#8a307f] hover:bg-[#9e3992] text-white text-xs font-semibold tracking-wide transition-all self-start md:self-end cursor-pointer"
          >
            Contact me
          </button>
        </div>

        {/* Services in an editorial split grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {servicesToDisplay.map((service, idx) => {
            const imgSrc = service.imageKey
              ? getMediaAssetUrl(service.imageKey)
              : service.imageUrl || '';
            const srvNumber = service.number || String(idx + 1).padStart(2, '0');
            const deliverables = Array.isArray(service.deliverables) ? service.deliverables : [];

            return (
              <div
                key={service.id || `srv-${idx}`}
                className="p-8 rounded-2xl bg-[#120f18] border border-white/[0.08] hover:border-[#8a307f]/40 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  {imgSrc && (
                    <div className="mb-6 rounded-xl overflow-hidden aspect-video max-h-48 bg-black/40 border border-white/10">
                      <img
                        src={imgSrc}
                        alt={service.title}
                        width={600}
                        height={340}
                        loading="lazy"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-between mb-4">
                    <span className="font-display text-2xl font-extrabold text-[#ca57bb] tabular-nums">
                      {srvNumber}
                    </span>
                    {service.timeline && (
                      <div className="flex items-center gap-1.5 text-xs font-mono text-white/50">
                        <Clock className="w-3.5 h-3.5 text-[#ca57bb]" />
                        <span>{service.timeline}</span>
                      </div>
                    )}
                  </div>

                  <h3 className="font-display text-2xl font-bold text-white mb-2">
                    {service.title}
                  </h3>
                  <p className="text-sm text-white/70 leading-relaxed mb-6 font-normal">
                    {service.description}
                  </p>
                </div>

                {deliverables.length > 0 && (
                  <div className="pt-6 border-t border-white/[0.06]">
                    <span className="text-[11px] font-mono text-white/40 uppercase tracking-widest block mb-3">
                      Included Deliverables
                    </span>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-white/80">
                      {deliverables.map((deliv, dIdx) => (
                        <li key={dIdx} className="flex items-start gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#ca57bb] shrink-0 mt-0.5" />
                          <span>{deliv}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
