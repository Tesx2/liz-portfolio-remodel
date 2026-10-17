import React, { useState, useEffect, useCallback } from 'react';
import { ProjectIndexItem } from './types';
import {
  fetchPublicProjectsIndex,
  checkAdminSession,
  logoutAdminSession,
} from './services/storageService';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { MarqueeStrip } from './components/MarqueeStrip';
import { ProjectGrid } from './components/ProjectGrid';
import { AboutSection } from './components/AboutSection';
import { ServicesSection } from './components/ServicesSection';
import { TestimonialsSection } from './components/TestimonialsSection';
import { ContactSection } from './components/ContactSection';
import { Footer } from './components/Footer';
import { CaseStudyModal } from './components/CaseStudyModal';
import { ShowreelModal } from './components/ShowreelModal';
import { AdminLogin } from './components/admin/AdminLogin';
import { AdminDashboard } from './components/admin/AdminDashboard';

export default function App() {
  const [publicProjects, setPublicProjects] = useState<ProjectIndexItem[]>([]);
  const [isLoadingGrid, setIsLoadingGrid] = useState<boolean>(true);
  const [gridError, setGridError] = useState<string | null>(null);

  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [currentView, setCurrentView] = useState<string>('home');
  const [activeCaseStudySlug, setActiveCaseStudySlug] = useState<string | null>(null);
  const [showShowreel, setShowShowreel] = useState<boolean>(false);
  const [showAdminLogin, setShowAdminLogin] = useState<boolean>(false);
  const [showAdminDashboard, setShowAdminDashboard] = useState<boolean>(false);

  const [isMediaConfigured, setIsMediaConfigured] = useState<boolean>(true);

  // Load public grid from Cloudflare R2: /content/index.json
  const loadPublicGrid = useCallback(async () => {
    setIsLoadingGrid(true);
    setGridError(null);
    try {
      const res = await fetchPublicProjectsIndex();
      if (!res.configured) {
        setIsMediaConfigured(false);
        setPublicProjects([]);
      } else {
        setIsMediaConfigured(true);
        setPublicProjects(res.projects);
      }
    } catch (err: any) {
      setGridError(err.message || 'Failed to load projects from Cloudflare R2.');
      setPublicProjects([]);
    } finally {
      setIsLoadingGrid(false);
    }
  }, []);

  // History API routing: support direct URLs /work/<slug>
  useEffect(() => {
    loadPublicGrid();

    // Check if user is signed into admin via HttpOnly cookie
    checkAdminSession().then((authenticated) => {
      setIsAdmin(authenticated);
    });

    const parseRouteFromLocation = () => {
      const path = window.location.pathname;
      if (path.startsWith('/work/')) {
        const slug = path.replace(/^\/work\//, '').replace(/\/$/, '');
        if (slug) {
          setActiveCaseStudySlug(slug);
          return;
        }
      }
      setActiveCaseStudySlug(null);
    };

    parseRouteFromLocation();
    window.addEventListener('popstate', parseRouteFromLocation);

    return () => window.removeEventListener('popstate', parseRouteFromLocation);
  }, [loadPublicGrid]);

  const handleOpenCaseStudy = (slug: string) => {
    window.history.pushState({}, '', `/work/${slug}`);
    setActiveCaseStudySlug(slug);
  };

  const handleCloseCaseStudy = () => {
    window.history.pushState({}, '', '/');
    setActiveCaseStudySlug(null);
  };

  const handleNavigate = (view: string) => {
    setCurrentView(view);
    if (activeCaseStudySlug) {
      handleCloseCaseStudy();
    }
    if (view === 'home') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      const element = document.getElementById(view);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const handleOpenAdmin = () => {
    if (isAdmin) {
      setShowAdminDashboard(true);
    } else {
      setShowAdminLogin(true);
    }
  };

  const handleLoginSuccess = () => {
    setIsAdmin(true);
    setShowAdminLogin(false);
    setShowAdminDashboard(true);
  };

  const handleLogout = async () => {
    await logoutAdminSession();
    setIsAdmin(false);
    setShowAdminDashboard(false);
  };

  const allSlugs = publicProjects.map((p) => p.slug);

  return (
    <div className="min-h-screen bg-[#0a080d] text-[#f3f0f6] flex flex-col selection:bg-[#8a307f] selection:text-white noise-overlay">
      {/* 3-Zone Navigation */}
      <Navbar
        currentView={currentView}
        onNavigate={handleNavigate}
        onOpenAdmin={handleOpenAdmin}
        isAdmin={isAdmin}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {/* Split Screen Hero with Showreel and Metrics */}
        <Hero
          onExploreWork={() => handleNavigate('work')}
          onOpenShowreelModal={() => setShowShowreel(true)}
        />

        {/* Dynamic Continuous Marquee Ribbon */}
        <MarqueeStrip />

        {/* Selected Works Masonry Grid (Loads from Cloudflare R2 index.json) */}
        <ProjectGrid
          projects={publicProjects}
          isLoading={isLoadingGrid}
          error={gridError}
          isMediaConfigured={isMediaConfigured}
          onRetry={loadPublicGrid}
          onSelectProject={handleOpenCaseStudy}
        />

        {/* Secondary Marquee Ribbon */}
        <MarqueeStrip />

        {/* About & Studio Ethos Section */}
        <AboutSection onContact={() => handleNavigate('contact')} />

        {/* Capabilities & Deliverables */}
        <ServicesSection onContact={() => handleNavigate('contact')} />

        {/* Client Testimonials */}
        <TestimonialsSection />

        {/* Contact Inquiry Section */}
        <ContactSection />
      </main>

      {/* Editorial Footer */}
      <Footer onOpenAdmin={handleOpenAdmin} isAdmin={isAdmin} />

      {/* Case Study Lightbox Modal: Route /work/<slug> */}
      <CaseStudyModal
        slug={activeCaseStudySlug}
        allSlugs={allSlugs}
        onClose={handleCloseCaseStudy}
        onNavigateSlug={(slug) => {
          window.history.pushState({}, '', `/work/${slug}`);
          setActiveCaseStudySlug(slug);
        }}
        onContact={() => {
          handleCloseCaseStudy();
          handleNavigate('contact');
        }}
      />

      {/* Fullscreen 4K Showreel Player Modal */}
      <ShowreelModal
        isOpen={showShowreel}
        onClose={() => setShowShowreel(false)}
        onExploreWork={() => {
          setShowShowreel(false);
          handleNavigate('work');
        }}
      />

      {/* Admin Login Modal (Strict server authentication with cookie) */}
      <AdminLogin
        isOpen={showAdminLogin}
        onClose={() => setShowAdminLogin(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* Full Admin Dashboard & R2 Media Ingestion Suite */}
      {showAdminDashboard && (
        <AdminDashboard
          onLogout={handleLogout}
          onClose={() => {
            setShowAdminDashboard(false);
            loadPublicGrid();
          }}
          onPreviewProject={(slug) => {
            setShowAdminDashboard(false);
            handleOpenCaseStudy(slug);
          }}
        />
      )}
    </div>
  );
}
