import React, { useState, useEffect } from 'react';
import { Project, R2Config } from './types';
import {
  getStoredProjects,
  getStoredR2Config,
  saveAllProjects,
  saveR2Config,
  isAdminAuthenticated,
  setAdminAuthenticated,
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
  const [projects, setProjects] = useState<Project[]>(getStoredProjects);
  const [r2Config, setR2Config] = useState<R2Config>(getStoredR2Config);
  const [isAdmin, setIsAdmin] = useState<boolean>(isAdminAuthenticated);

  const [currentView, setCurrentView] = useState<string>('home');
  const [selectedCaseStudy, setSelectedCaseStudy] = useState<Project | null>(null);
  const [showShowreel, setShowShowreel] = useState<boolean>(false);
  const [showAdminLogin, setShowAdminLogin] = useState<boolean>(false);
  const [showAdminDashboard, setShowAdminDashboard] = useState<boolean>(false);

  useEffect(() => {
    // Keep local storage in sync
    saveAllProjects(projects);
  }, [projects]);

  const handleNavigate = (view: string) => {
    setCurrentView(view);
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
    setAdminAuthenticated(true);
    setIsAdmin(true);
    setShowAdminLogin(false);
    setShowAdminDashboard(true);
  };

  const handleLogout = () => {
    setAdminAuthenticated(false);
    setIsAdmin(false);
    setShowAdminDashboard(false);
  };

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

        {/* Selected Works Masonry Grid with Natural Aspect Ratios */}
        <ProjectGrid
          projects={projects}
          onSelectProject={(project) => setSelectedCaseStudy(project)}
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

      {/* Case Study Lightbox Modal (Portrait/Landscape dynamic layout) */}
      <CaseStudyModal
        project={selectedCaseStudy}
        allProjects={projects}
        onClose={() => setSelectedCaseStudy(null)}
        onNavigateProject={(p) => setSelectedCaseStudy(p)}
        onContact={() => {
          setSelectedCaseStudy(null);
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

      {/* Admin Login Modal */}
      <AdminLogin
        isOpen={showAdminLogin}
        onClose={() => setShowAdminLogin(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* Full Admin Dashboard & Media Ingestion Suite */}
      {showAdminDashboard && (
        <AdminDashboard
          projects={projects}
          onUpdateProjects={(updated) => setProjects(updated)}
          r2Config={r2Config}
          onUpdateR2Config={(updated) => {
            setR2Config(updated);
            saveR2Config(updated);
          }}
          onLogout={handleLogout}
          onClose={() => setShowAdminDashboard(false)}
          onPreviewProject={(proj) => {
            setShowAdminDashboard(false);
            setSelectedCaseStudy(proj);
          }}
        />
      )}
    </div>
  );
}
