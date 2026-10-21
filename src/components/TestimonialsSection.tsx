import React from 'react';
import { TESTIMONIALS } from '../data/initialProjects';
import { Quote } from 'lucide-react';
import { SiteContent } from '../types';
import { getMediaAssetUrl } from '../services/storageService';

interface TestimonialsSectionProps {
  siteContent?: SiteContent | null;
}

export const TestimonialsSection: React.FC<TestimonialsSectionProps> = ({ siteContent }) => {
  const testimonialsToDisplay = (
    Array.isArray(siteContent?.testimonials)
      ? siteContent.testimonials
      : TESTIMONIALS
  )
    .filter((t) => t.visible !== false)
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

  return (
    <section id="testimonials" className="w-full py-20 lg:py-28 border-t border-white/[0.08] bg-[#0c0912]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="max-w-2xl mb-16">
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white">
            What clients say
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonialsToDisplay.map((t, idx) => {
            const avatarSrc = t.imageKey
              ? getMediaAssetUrl(t.imageKey)
              : t.imageUrl || '';

            return (
              <div
                key={t.id || `test-${idx}`}
                className="p-8 rounded-2xl bg-[#130f1a] border border-white/[0.08] flex flex-col justify-between"
              >
                <div>
                  <Quote className="w-8 h-8 text-[#8a307f]/40 mb-6" />
                  <p className="text-sm sm:text-base text-white/80 leading-relaxed italic mb-8 font-serif">
                    &ldquo;{t.quote}&rdquo;
                  </p>
                </div>

                <div className="pt-6 border-t border-white/[0.06] flex items-center gap-3">
                  {avatarSrc ? (
                    <img
                      src={avatarSrc}
                      alt={t.clientName}
                      width={44}
                      height={44}
                      loading="lazy"
                      className="w-11 h-11 rounded-full object-cover border border-[#ca57bb]/30 shrink-0"
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-full bg-[#8a307f]/20 border border-[#8a307f]/40 flex items-center justify-center text-xs font-semibold text-[#ca57bb] shrink-0">
                      {t.clientName.charAt(0)}
                    </div>
                  )}

                  <div className="text-xs font-mono">
                    <div className="text-white font-semibold text-sm font-sans">{t.clientName}</div>
                    <div className="text-[#ca57bb] font-medium mt-0.5">
                      {t.role}{t.company ? `, ${t.company}` : ''}
                    </div>
                    {(t.project || t.location) && (
                      <div className="text-white/40 mt-1">
                        {[t.project, t.location].filter(Boolean).join(' · ')}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
