import React from 'react';
import { ArrowUpRight, Download } from 'lucide-react';
import lizPortraitImg from '../assets/images/liz_kendi_portrait_1792226932929.jpg';
import { SiteContent } from '../types';
import { getMediaAssetUrl } from '../services/storageService';

import { INITIAL_ABOUT } from '../data/initialProjects';

interface AboutSectionProps {
  siteContent?: SiteContent | null;
  onContact: () => void;
}

export const AboutSection: React.FC<AboutSectionProps> = ({ siteContent, onContact }) => {
  const portraitUrl = siteContent?.portraitKey
    ? getMediaAssetUrl(siteContent.portraitKey)
    : lizPortraitImg;

  const about = siteContent?.about;
  const sectionTitle = about?.title || INITIAL_ABOUT.title || 'About me';
  const roleTitle = about?.roleTitle || INITIAL_ABOUT.roleTitle || 'Graphic designer and animator';
  const locationText = about?.location || INITIAL_ABOUT.location || 'Nairobi, KE';
  const bioParagraphs =
    Array.isArray(about?.bioParagraphs) && about.bioParagraphs.length > 0
      ? about.bioParagraphs
      : INITIAL_ABOUT.bioParagraphs;
  const tools =
    Array.isArray(about?.tools) ? about.tools : INITIAL_ABOUT.tools;
  const milestones =
    Array.isArray(about?.milestones) ? about.milestones : INITIAL_ABOUT.milestones;
  const cvUrl = about?.cvDownloadUrl
    ? (about.cvDownloadUrl.startsWith('http') || about.cvDownloadUrl.startsWith('/')
        ? about.cvDownloadUrl
        : getMediaAssetUrl(about.cvDownloadUrl))
    : INITIAL_ABOUT.cvDownloadUrl || '/liz-kendi-cv.pdf';

  return (
    <section id="about" className="w-full py-20 lg:py-28 border-t border-white/[0.08] bg-[#0c0912]">
      <div className="max-w-7xl mx-auto px-6">
        {/* Section Header */}
        <div className="max-w-3xl mb-16">
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white leading-tight">
            {sectionTitle}
          </h2>
        </div>

        {/* 2-Column Split: Portrait + Bio */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          {/* Left Column: Portrait Card */}
          <div className="lg:col-span-5">
            <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-[#16121f] shadow-2xl">
              <img
                src={portraitUrl}
                alt="Liz Kendi, Graphic Designer and Animator in Nairobi, Kenya"
                width={600}
                height={750}
                loading="lazy"
                className="w-full h-auto object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="p-6 bg-[#130f1a] border-t border-white/10">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-display text-xl font-bold text-white">Liz Kendi</h3>
                    <p className="text-xs text-white/60 font-mono mt-0.5">{roleTitle}</p>
                  </div>
                  <span className="text-xs font-mono text-[#ca57bb] bg-[#8a307f]/15 border border-[#8a307f]/30 px-2.5 py-1 rounded">
                    {locationText}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Bio Narrative */}
          <div className="lg:col-span-7 flex flex-col space-y-8">
            <div className="text-base sm:text-lg text-white/80 leading-relaxed space-y-4 font-normal">
              {bioParagraphs.map((para, idx) => (
                <p key={idx}>{para}</p>
              ))}
            </div>

            {/* Disciplines & Toolkit */}
            {tools.length > 0 && (
              <div className="pt-6 border-t border-white/10">
                <h3 className="text-xs font-mono text-white/50 uppercase tracking-widest mb-4">
                  Tools
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {tools.map((t, i) => (
                    <div key={i} className="p-3 rounded-xl bg-white/[0.03] border border-white/10">
                      <span className="text-xs font-semibold text-white block">{t.name}</span>
                      <span className="text-[11px] font-mono text-white/40 block mt-0.5">{t.category}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Milestones / Career Timeline */}
            {milestones.length > 0 && (
              <div className="pt-6 border-t border-white/10">
                <h3 className="text-xs font-mono text-white/50 uppercase tracking-widest mb-4">
                  Education & Experience
                </h3>
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
            )}

            {/* Actions: Download CV + Contact */}
            <div className="pt-4 flex flex-wrap items-center gap-4">
              <a
                href={cvUrl}
                download="Liz-Kendi-CV.pdf"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#8a307f] hover:bg-[#9e3992] text-white text-sm font-semibold transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download CV</span>
              </a>

              <button
                onClick={onContact}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-semibold transition-all cursor-pointer"
              >
                <span>Contact me</span>
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
