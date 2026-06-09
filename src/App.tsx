/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  ArrowUpRight, 
  X, 
  Phone, 
  Mail, 
  MapPin, 
  Facebook, 
  Linkedin, 
  Twitter, 
  Instagram, 
  Youtube, 
  ChevronUp, 
  ArrowRight,
  Shield
} from "lucide-react";
import AboutSection from "./components/AboutSection";
import EpisodesSection from "./components/EpisodesSection";
import YouTubeSection from "./components/YouTubeSection";
import HostsSection from "./components/HostsSection";
import ParallaxSection from "./components/ParallaxSection";
import NetworkAnalysisSection from "./components/NetworkAnalysisSection";
import RatingsReviewsSection from "./components/RatingsReviewsSection";
import AdminPage from "./components/AdminPage";

// Accent Color: #5E0ED7 (deep purple)
// Primary Text: White/Zinc on Black background, uppercase, wide tracking

// Framing Animations:
// 1. fadeDown: Logo (0), Nav Links (1-4), Hamburger (5)
const fadeDown = {
  initial: { opacity: 0, y: -20 },
  animate: (index: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: index * 0.1,
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1],
    },
  }),
};

const navLinks = [
  { name: "Story", href: "#about" },
  { name: "Expertise", href: "#expertise" },
  { name: "Studios", href: "#studios" },
  { name: "Feedback", href: "#feedback" }
];

export default function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEpisodeDetailActive, setIsEpisodeDetailActive] = useState(false);
  const [footerEmail, setFooterEmail] = useState("");
  const [isFooterSubscribed, setIsFooterSubscribed] = useState(false);
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  // Monitor location path routing
  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentPath(window.location.pathname);
    };
    
    window.addEventListener("popstate", handleLocationChange);
    
    const originalPushState = window.history.pushState;
    window.history.pushState = function(...args) {
      originalPushState.apply(this, args);
      handleLocationChange();
    };

    const originalReplaceState = window.history.replaceState;
    window.history.replaceState = function(...args) {
      originalReplaceState.apply(this, args);
      handleLocationChange();
    };

    return () => {
      window.removeEventListener("popstate", handleLocationChange);
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
    };
  }, []);

  const showDetailView = isEpisodeDetailActive || currentPath.startsWith("/episode/");

  if (currentPath === "/admin" || currentPath.startsWith("/admin")) {
    return (
      <div
        id="podcast-platform-root"
        className="relative w-full min-h-screen flex flex-col font-sans bg-page-bg text-white selection:bg-accent-blue selection:text-white"
      >
        <AdminPage currentPath={currentPath} onBackToMain={() => window.history.pushState({}, "", "/")} />
      </div>
    );
  }

  return (
    <div
      id="podcast-platform-root"
      className="relative w-full min-h-screen flex flex-col font-sans bg-page-bg text-white selection:bg-accent-blue selection:text-white"
    >
      {/* 1. GLOBAL NAVIGATION BAR */}
      <nav
        id="main-nav-bar"
        className="w-full flex items-center justify-between px-5 sm:px-8 md:px-12 py-4 z-20 relative bg-header-bg shrink-0 border-b border-zinc-800"
      >
        {/* Logo */}
        <motion.a
          id="nav-logo"
          href={window.location.pathname === "/" ? "#podcast-platform-root" : "/"}
          custom={0}
          variants={fadeDown}
          initial="initial"
          animate="animate"
          onClick={(e) => {
            if (window.location.pathname !== "/") {
              e.preventDefault();
              window.history.pushState({}, "", "/");
            } else {
              setIsEpisodeDetailActive(false);
            }
          }}
          className="w-8 h-8 rounded-full border-2 border-accent flex items-center justify-center select-none cursor-pointer animate-pulse"
        >
          <div className="w-2.5 h-2.5 rounded-full bg-accent" />
        </motion.a>

        {/* Center Links (Visible md+) */}
        <div id="nav-links-desktop" className="hidden md:flex items-center gap-10">
          {navLinks.map((link, i) => (
            <motion.a
              key={link.name}
              id={`nav-link-${link.name.toLowerCase()}`}
              href={link.href}
              custom={i + 1}
              variants={fadeDown}
              initial="initial"
              animate="animate"
              onClick={(e) => {
                if (window.location.pathname !== "/") {
                  e.preventDefault();
                  window.history.pushState({}, "", `/${link.href}`);
                } else {
                  setIsEpisodeDetailActive(false);
                }
              }}
              className="text-[14px] font-semibold text-zinc-300 hover:text-white tracking-widest transition-colors duration-300 relative group"
            >
              {link.name}
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-accent group-hover:w-full transition-all duration-300" />
            </motion.a>
          ))}
        </div>

        {/* Right Actions & Mobile Trigger */}
        <div className="flex items-center gap-3">
          {/* Hamburger Menu trigger */}
          <motion.button
            id="hamburger-menu-btn"
            custom={5}
            variants={fadeDown}
            initial="initial"
            animate="animate"
            onClick={() => setIsMenuOpen(true)}
            className="w-9 h-9 rounded-full bg-white flex flex-col items-center justify-center gap-1 focus:outline-none cursor-pointer hover:bg-zinc-200 transition-colors active:scale-95 shrink-0"
            aria-label="Toggle Mobile Menu"
          >
            <span className="w-4 h-0.5 bg-black block" />
            <span className="w-4 h-0.5 bg-black block" />
            <span className="w-4 h-0.5 bg-black block" />
          </motion.button>
        </div>
      </nav>

      {/* MOBILE MENU NAV OVERLAY */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            id="mobile-menu-overlay"
            initial={{ opacity: 0, y: "-100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "-100%" }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 bg-zinc-950/98 backdrop-blur-md z-50 flex flex-col p-5 sm:p-8 md:p-12 text-white"
          >
            <div className="flex items-center justify-between w-full h-20 md:h-24">
              <div className="w-8 h-8 rounded-full border-2 border-accent flex items-center justify-center">
                <div className="w-2.5 h-2.5 rounded-full bg-accent" />
              </div>

              <button
                id="mobile-menu-close-btn"
                onClick={() => {
                  setIsMenuOpen(false);
                }}
                className="w-9 h-9 rounded-full bg-white text-black flex items-center justify-center cursor-pointer hover:bg-zinc-200 transition-colors active:scale-95 focus:outline-none"
                aria-label="Close Mobile Menu"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex flex-col gap-8 mt-16 text-3xl tracking-widest font-semibold text-zinc-100">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  id={`mobile-link-${link.name.toLowerCase()}`}
                  href={link.href}
                  onClick={(e) => {
                    setIsMenuOpen(false);
                    if (window.location.pathname !== "/") {
                      e.preventDefault();
                      window.history.pushState({}, "", `/${link.href}`);
                    } else {
                      setIsEpisodeDetailActive(false);
                    }
                  }}
                  className="hover:text-accent transition-colors duration-300 block w-fit uppercase"
                >
                  {link.name}
                </a>
              ))}
            </div>

            <div className="mt-auto pt-8 border-t border-zinc-900">
              <a
                id="mobile-menu-cta"
                href="#feedback"
                onClick={(e) => {
                  setIsMenuOpen(false);
                  if (window.location.pathname !== "/") {
                    e.preventDefault();
                    window.history.pushState({}, "", "/#feedback");
                  } else {
                    setIsEpisodeDetailActive(false);
                  }
                }}
                className="inline-flex items-center gap-1.5 text-accent text-xl font-semibold tracking-widest uppercase hover:opacity-85 transition-opacity"
              >
                Work With Us
                <ArrowUpRight size={22} className="text-accent" />
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. SHARED SUB-SECTIONS (STUNNING MEDICAL & PODCAST CONTENT) */}
      <main id="podcast-sections" className="w-full flex flex-col">
        {/* Section 1: Meet the Urologist Bio / Story */}
        {!showDetailView && <AboutSection />}

        {/* Immersive Scroll-Zoom Parallax Section */}
        {!showDetailView && <ParallaxSection />}

        {/* Section 2: Episode Filtering, Search, and Preview Playback Hub */}
        <EpisodesSection onDetailStateChange={setIsEpisodeDetailActive} currentPath={currentPath} />

        {/* Section 3: Show Hosts & Guest list */}
        {!showDetailView && <HostsSection />}

        {/* Section 4: Podcast Network Analysis Carousel */}
        {!showDetailView && <NetworkAnalysisSection />}

        {/* Section 5: Podcast Ratings and Reviews */}
        {!showDetailView && <RatingsReviewsSection />}

        {/* Section 5.5: YouTube Integration Feed & Stats */}
        {!showDetailView && <YouTubeSection />}
      </main>

      {/* 3. SOLID CREDITS FOOTER */}
      <footer id="master-platform-footer" className="w-full bg-footer-bg border-t border-zinc-800/40 pt-16 pb-8 px-5 sm:px-8 md:px-12 text-zinc-300 tracking-wider relative select-none">
        <div className="max-w-7xl mx-auto flex flex-col">
          
          {/* Main 4-Column Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 md:gap-8 lg:gap-12 pb-12">
            
            {/* Column 1: Be Future-Ready (Newsletter Subscription) */}
            <div className="lg:col-span-4 flex flex-col gap-4">
              <h3 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight uppercase">
                Be Future-Ready
              </h3>
              <p className="text-xs sm:text-[13px] text-zinc-400 font-medium normal-case tracking-normal max-w-sm leading-relaxed">
                Join <span className="text-[#9DAAF2] font-semibold">150,000+ readers</span>. Get science-backed tips on pelvic physical performance, sexual hormone metrics, and urological longevity straight from Dr. Rena's private clinical guides.
              </p>
              
              {/* Inline input subscription form with interactive feedback state */}
              {!isFooterSubscribed ? (
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (footerEmail.trim().includes("@")) {
                      setIsFooterSubscribed(true);
                    }
                  }}
                  className="mt-1 flex items-center w-full max-w-sm bg-card-pill border border-zinc-700/50 rounded-full p-1 pl-4.5 shadow-sm focus-within:border-accent-blue focus-within:ring-1 focus-within:ring-accent-blue/30 duration-200"
                >
                  <label htmlFor="footer-email-input" className="sr-only">Email address</label>
                  <input 
                    id="footer-email-input"
                    type="email" 
                    required
                    value={footerEmail}
                    onChange={(e) => setFooterEmail(e.target.value)}
                    placeholder="Email address..." 
                    className="bg-transparent text-xs sm:text-[13px] text-white placeholder-zinc-500 py-2 px-1 focus:outline-none flex-1 font-semibold uppercase tracking-wider"
                  />
                  <button 
                    type="submit" 
                    aria-label="Submit subscribe form"
                    className="h-9 px-5 rounded-full bg-accent-yellow hover:bg-[#ebd06b] text-zinc-900 font-extrabold text-[11px] uppercase tracking-wider flex items-center justify-center transition-all hover:scale-[1.03] active:scale-[0.97] cursor-pointer group flex-shrink-0"
                  >
                    SUBMIT
                  </button>
                </form>
              ) : (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mt-1 py-3 px-5 bg-zinc-900/40 border border-accent-blue/20 rounded-full text-[11px] text-[#9DAAF2] font-bold uppercase tracking-wider leading-relaxed"
                >
                  ✓ Subscribed! You will receive Dr. Rena's weekly clinical briefings.
                </motion.div>
              )}
            </div>

            {/* Column 2: About / Show */}
            <div className="lg:col-span-2 md:col-span-1 flex flex-col gap-4">
              <h4 className="text-xs sm:text-sm font-bold text-white tracking-widest uppercase">
                About
              </h4>
              <nav className="flex flex-col gap-2.5 text-xs font-semibold text-zinc-400 uppercase">
                <a href="#about" className="hover:text-accent duration-200">Our Team</a>
                <a href="#expertise" className="hover:text-accent duration-200">Episode Hub</a>
                <a href="#feedback" className="hover:text-accent duration-200">Patient Stories</a>
                <a href="#about" className="hover:text-accent duration-200">Host Biography</a>
              </nav>
            </div>

            {/* Column 3: Resource Center */}
            <div className="lg:col-span-2 md:col-span-1 flex flex-col gap-4">
              <h4 className="text-xs sm:text-sm font-bold text-white tracking-widest uppercase">
                Resources
              </h4>
              <nav className="flex flex-col gap-2.5 text-xs font-semibold text-zinc-400 uppercase">
                <a href="#about" className="hover:text-accent duration-200">Disclaimer</a>
                <a href="#expertise" className="hover:text-accent duration-200">Sponsors</a>
                <a href="/admin" onClick={(e) => { e.preventDefault(); window.history.pushState({}, "", "/admin"); }} className="hover:text-[#E2C33B] font-extrabold text-[#E2C33B] tracking-wider duration-200">Admin Portal</a>
                <a href="#feedback" className="hover:text-accent duration-200">General FAQ</a>
              </nav>
            </div>

            {/* Column 4: Contact Us */}
            <div className="lg:col-span-4 flex flex-col gap-4">
              <h4 className="text-xs sm:text-sm font-bold text-white tracking-widest uppercase">
                Contact Us
              </h4>
              <div className="flex flex-col gap-3 text-xs sm:text-[13px] font-semibold text-zinc-400 normal-case tracking-normal">
                <div className="flex items-center gap-3">
                  <Phone size={14} className="text-accent shrink-0" />
                  <span>+1 (310) 825-4321</span>
                </div>
                <div className="flex items-center gap-3">
                  <Mail size={14} className="text-accent shrink-0" />
                  <span className="hover:text-white transition-colors cursor-pointer break-all">hello@renamalikmd.com</span>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin size={14} className="text-accent shrink-0" />
                  <span>924 Westwood Blvd, Los Angeles, CA 90024</span>
                </div>
              </div>
            </div>

          </div>

          {/* Divider Line */}
          <div className="border-t border-zinc-700/40 w-full my-6"></div>

          {/* Bottom Bar: Copyright, Socials, and Policies */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 uppercase text-[10px] sm:text-[11px] font-bold text-zinc-400 tracking-wider">
            
            {/* Copyright */}
            <div className="text-zinc-500 text-center md:text-left order-3 md:order-1">
              <span>© 2026 The Rena Malik Show. All Rights Reserved.</span>
            </div>

            {/* Social Circle Links */}
            <div className="flex items-center justify-center gap-2.5 order-1 md:order-2">
              {[
                { icon: <Facebook size={12} />, href: "https://facebook.com" },
                { icon: <Linkedin size={12} />, href: "https://linkedin.com" },
                { icon: <Twitter size={12} />, href: "https://twitter.com" },
                { icon: <Instagram size={12} />, href: "https://instagram.com/renamalikmd" },
                { icon: <Youtube size={12} />, href: "https://youtube.com/@renamalikmd" },
              ].map((soc, sIdx) => (
                <a 
                  key={sIdx}
                  href={soc.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  referrerPolicy="no-referrer"
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-zinc-700 hover:border-zinc-500 bg-card-pill flex items-center justify-center text-zinc-400 hover:text-white hover:scale-105 active:scale-95 transition-all"
                >
                  {soc.icon}
                </a>
              ))}
            </div>

            {/* Policies and Scroll to Top Arrow */}
            <div className="flex items-center gap-6 order-2 md:order-3">
              <a href="#about" className="hover:text-white transition-colors text-zinc-500">Terms</a>
              <a href="#about" className="hover:text-white transition-colors text-zinc-500">Privacy</a>
              
              {/* Back to top button precisely like the iconic ring design on the far right */}
              <button 
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                aria-label="Back to Top"
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border border-zinc-700 hover:border-zinc-500 bg-card-pill flex items-center justify-center text-zinc-300 hover:text-white hover:scale-105 active:scale-95 transition-all cursor-pointer"
              >
                <ChevronUp size={16} />
              </button>
            </div>

          </div>

        </div>
      </footer>

    </div>
  );
}
