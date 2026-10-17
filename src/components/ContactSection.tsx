import React, { useState, useEffect } from 'react';
import { Mail, Clock, MapPin, Send, CheckCircle2, ArrowUpRight } from 'lucide-react';

export const ContactSection: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    projectType: 'Motion Graphics & 3D Reel',
    budget: '$3k – $6k',
    timeline: 'Within 4 Weeks',
    message: '',
  });

  const [submitted, setSubmitted] = useState(false);
  const [nairobiTime, setNairobiTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      try {
        const timeStr = new Intl.DateTimeFormat('en-GB', {
          timeZone: 'Africa/Nairobi',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        }).format(new Date());
        setNairobiTime(timeStr);
      } catch (e) {
        setNairobiTime('EAT (UTC+3)');
      }
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email) return;
    setSubmitted(true);
  };

  return (
    <section id="contact" className="w-full py-20 lg:py-28 border-t border-white/[0.08] bg-[#0a080d]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          {/* Left Column: Direct Info & Studio Coordinates */}
          <div className="lg:col-span-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono tracking-widest text-[#ca57bb] uppercase mb-2">
                <span>Start A Commission</span>
                <span aria-hidden="true">·</span>
                <span>Direct Inquiries</span>
              </div>
              <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white mb-6">
                Let&rsquo;s craft your next visual benchmark.
              </h2>
              <p className="text-base text-white/70 leading-relaxed mb-8 font-normal">
                Currently booking select commercial campaigns, brand identities, and 3D motion commissions for Q3/Q4. Reach out with your project parameters or schedule a studio call.
              </p>
            </div>

            <div className="space-y-4 pt-6 border-t border-white/10 text-xs font-mono">
              <div className="flex items-center gap-3 text-white/80">
                <Mail className="w-4 h-4 text-[#ca57bb] shrink-0" />
                <a
                  href="mailto:lizkendi.mwebia@gmail.com"
                  className="hover:text-white underline underline-offset-4 decoration-[#8a307f]"
                >
                  lizkendi.mwebia@gmail.com
                </a>
              </div>

              <div className="flex items-center gap-3 text-white/80">
                <MapPin className="w-4 h-4 text-[#ca57bb] shrink-0" />
                <span>Nairobi Design Hub, Westlands, Kenya</span>
              </div>

              <div className="flex items-center gap-3 text-white/80">
                <Clock className="w-4 h-4 text-[#ca57bb] shrink-0" />
                <span>
                  Nairobi Local Time:{' '}
                  <span className="text-white font-semibold tabular-nums ml-1">
                    {nairobiTime || '12:00:00'} EAT (UTC+3)
                  </span>
                </span>
              </div>
            </div>

            {/* Social channels */}
            <div className="pt-8">
              <span className="text-[11px] font-mono text-white/40 uppercase tracking-widest block mb-3">
                Portfolio Networks & Reels
              </span>
              <div className="flex flex-wrap gap-4 text-xs font-mono text-white/70">
                <a
                  href="https://behance.net"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-white transition-colors flex items-center gap-1"
                >
                  <span>Behance</span>
                  <ArrowUpRight className="w-3 h-3 text-[#ca57bb]" />
                </a>
                <a
                  href="https://vimeo.com"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-white transition-colors flex items-center gap-1"
                >
                  <span>Vimeo</span>
                  <ArrowUpRight className="w-3 h-3 text-[#ca57bb]" />
                </a>
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-white transition-colors flex items-center gap-1"
                >
                  <span>Instagram</span>
                  <ArrowUpRight className="w-3 h-3 text-[#ca57bb]" />
                </a>
                <a
                  href="https://linkedin.com"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-white transition-colors flex items-center gap-1"
                >
                  <span>LinkedIn</span>
                  <ArrowUpRight className="w-3 h-3 text-[#ca57bb]" />
                </a>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Inquiry Form */}
          <div className="lg:col-span-7">
            <div className="p-8 sm:p-10 rounded-2xl bg-[#14101c] border border-white/10 shadow-xl">
              {submitted ? (
                <div className="py-12 text-center space-y-4">
                  <div className="w-14 h-14 rounded-full bg-[#8a307f]/20 border border-[#8a307f] flex items-center justify-center mx-auto text-[#ca57bb]">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="font-display text-2xl font-bold text-white">
                    Inquiry Transmitted Successfully
                  </h3>
                  <p className="text-sm text-white/70 max-w-md mx-auto leading-relaxed">
                    Thank you, {formData.name}. Liz Kendi will review your project brief and reply within 24 business hours.
                  </p>
                  <button
                    onClick={() => {
                      setSubmitted(false);
                      setFormData({
                        name: '',
                        email: '',
                        projectType: 'Motion Graphics & 3D Reel',
                        budget: '$3k – $6k',
                        timeline: 'Within 4 Weeks',
                        message: '',
                      });
                    }}
                    className="mt-4 px-5 py-2.5 text-xs text-white font-medium bg-white/10 hover:bg-white/15 rounded-lg transition-colors cursor-pointer"
                  >
                    Submit Another Inquiry
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-mono text-white/60 mb-2 uppercase tracking-wider">
                        Your Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g. Maya Chen"
                        className="w-full px-4 py-3 bg-[#0d0a13] border border-white/10 rounded-xl text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#8a307f] transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-mono text-white/60 mb-2 uppercase tracking-wider">
                        Work Email *
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="maya@brand.com"
                        className="w-full px-4 py-3 bg-[#0d0a13] border border-white/10 rounded-xl text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#8a307f] transition-colors"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                    <div>
                      <label className="block text-xs font-mono text-white/60 mb-2 uppercase tracking-wider">
                        Project Scope
                      </label>
                      <select
                        value={formData.projectType}
                        onChange={(e) => setFormData({ ...formData, projectType: e.target.value })}
                        className="w-full px-3 py-3 bg-[#0d0a13] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#8a307f] transition-colors"
                      >
                        <option>Motion Graphics & 3D Reel</option>
                        <option>Complete Brand Identity</option>
                        <option>Editorial & Poster Series</option>
                        <option>Digital Campaign & Social</option>
                        <option>Consultation & Direction</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-mono text-white/60 mb-2 uppercase tracking-wider">
                        Budget Range
                      </label>
                      <select
                        value={formData.budget}
                        onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                        className="w-full px-3 py-3 bg-[#0d0a13] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#8a307f] transition-colors"
                      >
                        <option>$2,500 – $5,000</option>
                        <option>$5,000 – $10,000</option>
                        <option>$10,000 – $25,000</option>
                        <option>$25,000+</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-mono text-white/60 mb-2 uppercase tracking-wider">
                        Target Timeline
                      </label>
                      <select
                        value={formData.timeline}
                        onChange={(e) => setFormData({ ...formData, timeline: e.target.value })}
                        className="w-full px-3 py-3 bg-[#0d0a13] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#8a307f] transition-colors"
                      >
                        <option>Under 2 Weeks</option>
                        <option>2–4 Weeks</option>
                        <option>1–2 Months</option>
                        <option>Flexible / Exploratory</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-white/60 mb-2 uppercase tracking-wider">
                      Project Brief & Objectives
                    </label>
                    <textarea
                      rows={4}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Tell us about your brand, deliverables, target audience, and any reference links..."
                      className="w-full px-4 py-3 bg-[#0d0a13] border border-white/10 rounded-xl text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#8a307f] transition-colors resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-4 px-6 rounded-xl bg-[#8a307f] hover:bg-[#9e3992] text-white font-semibold text-sm tracking-wide transition-all shadow-lg shadow-[#8a307f]/25 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Transmit Project Inquiry</span>
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
