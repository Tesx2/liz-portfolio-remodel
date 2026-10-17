import React from 'react';
import { TESTIMONIALS } from '../data/initialProjects';
import { Quote } from 'lucide-react';

export const TestimonialsSection: React.FC = () => {
  return (
    <section id="testimonials" className="w-full py-20 lg:py-28 border-t border-white/[0.08] bg-[#0c0912]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="max-w-2xl mb-16">
          <div className="flex items-center gap-2 text-xs font-mono tracking-widest text-[#ca57bb] uppercase mb-2">
            <span>Collaborator Voices</span>
            <span aria-hidden="true">·</span>
            <span>Client Endorsements</span>
          </div>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white">
            Trusted by creators & visionary brands.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {TESTIMONIALS.map((t) => (
            <div
              key={t.id}
              className="p-8 rounded-2xl bg-[#130f1a] border border-white/[0.08] flex flex-col justify-between"
            >
              <div>
                <Quote className="w-8 h-8 text-[#8a307f]/40 mb-6" />
                <p className="text-sm sm:text-base text-white/80 leading-relaxed italic mb-8 font-serif">
                  &ldquo;{t.quote}&rdquo;
                </p>
              </div>

              <div className="pt-6 border-t border-white/[0.06] text-xs font-mono">
                <div className="text-white font-semibold text-sm font-sans">{t.clientName}</div>
                <div className="text-[#ca57bb] font-medium mt-0.5">{t.role}, {t.company}</div>
                <div className="text-white/40 mt-1">{t.project} · {t.location}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
