/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  ChevronLeft, 
  ChevronRight, 
  TrendingUp, 
  Globe, 
  Users, 
  Activity, 
  Radio, 
  Podcast, 
  Play, 
  Link2 
} from "lucide-react";

interface AnalysisCard {
  id: string;
  title: string;
  badge: string;
  description: string;
  icon: React.ReactNode;
  renderChart: () => React.ReactNode;
}

export default function NetworkAnalysisSection() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0); // -1 for left, 1 for right

  const slides: AnalysisCard[] = [
    {
      id: "platform-share",
      title: "Streaming Network Share",
      badge: "DISTRIBUTION NODES",
      description: "Comparative index of listening volume across Dr. Rena's core streaming networks.",
      icon: <Radio className="text-[#9DAAF2]" size={18} />,
      renderChart: () => (
        <div className="w-full flex flex-col gap-3 mt-2">
          {[
            { name: "Spotify", share: 44, color: "bg-[#1DB954]", value: "44%" },
            { name: "Apple Podcasts", share: 28, color: "bg-[#9C33EC]", value: "28%" },
            { name: "YouTube", share: 18, color: "bg-[#FF0000]", value: "18%" },
            { name: "Web / RSS Channels", share: 10, color: "bg-[#2F6DF6]", value: "10%" },
          ].map((item) => (
            <div key={item.name} className="flex flex-col gap-1">
              <div className="flex justify-between items-center text-[11px] font-bold tracking-wider uppercase text-zinc-300">
                <span>{item.name}</span>
                <span className="text-white font-extrabold">{item.value}</span>
              </div>
              <div className="w-full h-2 bg-[#2a2a2c] rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  whileInView={{ width: `${item.share}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className={`h-full ${item.color} rounded-full`}
                />
              </div>
            </div>
          ))}
        </div>
      ),
    },
    {
      id: "tune-in-growth",
      title: "Weekly Network Tune-In",
      badge: "AUDIENCE METRICS",
      description: "Weekly unique metric peaks showing active engagement spikes following hormone and intimate wellness briefings.",
      icon: <TrendingUp className="text-[#F4DB7D]" size={18} />,
      renderChart: () => (
        <div className="w-full h-36 flex items-end justify-between px-2 pt-4 relative">
          {/* Subtle horizontal grid lines */}
          <div className="absolute inset-x-0 bottom-6 border-b border-zinc-800/60 pointer-events-none" />
          <div className="absolute inset-x-0 bottom-16 border-b border-zinc-c800/40 pointer-events-none" />
          <div className="absolute inset-x-0 bottom-28 border-b border-zinc-800/20 pointer-events-none" />
          
          {[
            { label: "Mon", height: "40%", current: "34K" },
            { label: "Tue", height: "55%", current: "46K" },
            { label: "Wed", height: "85%", current: "72K", highlight: true },
            { label: "Thu", height: "65%", current: "55K" },
            { label: "Fri", height: "50%", current: "42K" },
            { label: "Sat", height: "35%", current: "29K" },
            { label: "Sun", height: "45%", current: "38K" },
          ].map((bar, i) => (
            <div key={i} className="flex flex-col items-center gap-1 z-10 flex-1">
              <span className="text-[9px] font-extrabold text-zinc-500 scale-90">{bar.current}</span>
              <div className="w-4 sm:w-6 bg-zinc-800 rounded-t relative overflow-hidden h-20 sm:h-24 flex items-end justify-center">
                <motion.div 
                  initial={{ height: 0 }}
                  whileInView={{ height: bar.height }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05, duration: 0.6, ease: "easeOut" }}
                  className={`w-full rounded-t ${bar.highlight ? "bg-[#F4DB7D]" : "bg-[#9DAAF2]/80 group-hover:bg-[#9DAAF2]"}`}
                />
              </div>
              <span className="text-[10px] font-bold text-zinc-400 mt-0.5 uppercase tracking-tighter">{bar.label}</span>
            </div>
          ))}
        </div>
      ),
    },
    {
      id: "demographics",
      title: "Category Demographics",
      badge: "LISTENER SEGMENTS",
      description: "Interactive affinity split showing relative listenership interest profile by category focus.",
      icon: <Users className="text-[#9DAAF2]" size={18} />,
      renderChart: () => (
        <div className="w-full h-36 flex items-center justify-around gap-4 px-1">
          <div className="flex flex-col items-center gap-2">
            <div className="relative w-24 h-24 flex items-center justify-center">
              {/* Semi-circular radial progression ring via inline SVG */}
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-zinc-800"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <motion.path
                  className="text-[#9DAAF2]"
                  strokeWidth="3.5"
                  strokeDasharray="64, 100"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  initial={{ strokeDasharray: "0, 100" }}
                  whileInView={{ strokeDasharray: "64, 100" }}
                  viewport={{ once: true }}
                  transition={{ duration: 1 }}
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-lg font-extrabold text-white leading-none">64%</span>
                <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Wellness</span>
              </div>
            </div>
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider text-center">Sex Health & Intimacy</span>
          </div>

          <div className="flex flex-col items-center gap-2">
            <div className="relative w-24 h-24 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-zinc-800"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <motion.path
                  className="text-[#F4DB7D]"
                  strokeWidth="3.5"
                  strokeDasharray="36, 100"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  initial={{ strokeDasharray: "0, 100" }}
                  whileInView={{ strokeDasharray: "36, 100" }}
                  viewport={{ once: true }}
                  transition={{ duration: 1 }}
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-lg font-extrabold text-white leading-none">36%</span>
                <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Clinical</span>
              </div>
            </div>
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider text-center">Clinical Urology</span>
          </div>
        </div>
      ),
    },
    {
      id: "geography",
      title: "Global Node Reach",
      badge: "REGIONAL INTENSITY",
      description: "Highest geographic density clusters driving active organic discussion and clinical feedback.",
      icon: <Globe className="text-[#F4DB7D]" size={18} />,
      renderChart: () => (
        <div className="w-full flex flex-col gap-2.5 mt-2">
          {[
            { region: "North America", reach: "62%", intensity: "MAX", index: 82 },
            { region: "Western Europe", reach: "18%", intensity: "HIGH", index: 54 },
            { region: "APAC / Singapore", reach: "12%", intensity: "MID", index: 38 },
            { region: "Oceania", reach: "8%", intensity: "MID", index: 24 },
          ].map((item, i) => (
            <div key={item.region} className="flex items-center gap-3 w-full">
              <span className="text-[11px] font-bold text-zinc-300 w-28 uppercase tracking-wider">{item.region}</span>
              <div className="flex-1 h-3 bg-[#2a2a2c] rounded-full overflow-hidden relative">
                <motion.div 
                  initial={{ width: 0 }}
                  whileInView={{ width: `${item.index}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.7, delay: i * 0.05 }}
                  className="h-full bg-accent rounded-full"
                />
              </div>
              <div className="flex items-center gap-1.5 w-14 justify-end text-right">
                <span className="text-white font-extrabold text-[11px]">{item.reach}</span>
                <span className="text-[8px] px-1 bg-zinc-800 text-zinc-400 rounded-sm font-bold scale-90">{item.intensity}</span>
              </div>
            </div>
          ))}
        </div>
      ),
    },
  ];

  const handleNext = () => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  };

  const handlePrev = () => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 150 : -150,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
      transition: {
        x: { type: "spring", stiffness: 300, damping: 28 },
        opacity: { duration: 0.25 },
      },
    },
    exit: (dir: number) => ({
      x: dir < 0 ? 150 : -150,
      opacity: 0,
      transition: {
        x: { type: "spring", stiffness: 300, damping: 28 },
        opacity: { duration: 0.2 },
      },
    }),
  };

  return (
    <section 
      id="network-analysis-carousel-section" 
      className="w-full bg-page-bg pt-16 pb-20 px-5 sm:px-8 md:px-12 border-b border-zinc-800/40 relative overflow-hidden select-none"
    >
      <div className="max-w-7xl mx-auto flex flex-col gap-8 md:grid md:grid-cols-12 md:gap-12 md:items-center">
        
        {/* Left Column: Heading & Descriptive Context */}
        <div className="md:col-span-5 flex flex-col gap-4">
          <span className="text-[#9DAAF2] text-[10px] sm:text-xs tracking-[0.25em] font-extrabold uppercase animate-pulse">
            // Strategic Operations
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-white uppercase leading-none">
            Network Analysis
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 font-medium normal-case tracking-normal leading-relaxed max-w-sm mt-1">
            Analyzing audience engagement streams, demographic focus points, and platform distributions to measure clinical reach and performance metrics.
          </p>

          {/* Manual Slider Navigation Arrows */}
          <div className="flex items-center gap-3 mt-4">
            <button
              onClick={handlePrev}
              className="w-10 h-10 rounded-lg border border-zinc-700/50 bg-card-pill text-zinc-300 hover:text-white hover:border-zinc-505 flex items-center justify-center transition-all focus:outline-none hover:scale-105 active:scale-95 cursor-pointer shadow"
              aria-label="Previous Analysis Report"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={handleNext}
              className="w-10 h-10 rounded-lg border border-zinc-700/50 bg-card-pill text-zinc-300 hover:text-white hover:border-zinc-505 flex items-center justify-center transition-all focus:outline-none hover:scale-105 active:scale-95 cursor-pointer shadow"
              aria-label="Next Analysis Report"
            >
              <ChevronRight size={18} />
            </button>
            
            {/* Slide Index indicator */}
            <span className="ml-2 text-xs font-bold uppercase tracking-widest text-zinc-550">
              {currentIndex + 1} / {slides.length}
            </span>
          </div>

          {/* Decorative Carousel Tracker Dots */}
          <div className="flex items-center gap-1.5 mt-2">
            {slides.map((_, dotIdx) => (
              <button
                key={dotIdx}
                onClick={() => {
                  setDirection(dotIdx > currentIndex ? 1 : -1);
                  setCurrentIndex(dotIdx);
                }}
                className={`h-1.5 rounded-full duration-300 cursor-pointer ${
                  currentIndex === dotIdx ? "bg-accent-blue w-6" : "bg-zinc-800 w-1.5 hover:bg-zinc-650"
                }`}
                aria-label={`Go to report slide ${dotIdx + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Right Column: Carousel Show Case Frame */}
        <div className="md:col-span-7 w-full h-[340px] sm:h-[350px] relative flex md:justify-end">
          
          <div className="w-full max-w-lg h-full bg-[#363636] border border-zinc-800/80 rounded-lg p-6 sm:p-8 flex flex-col justify-between shadow-2xl overflow-hidden relative">
            
            <AnimatePresence initial={false} custom={direction} mode="wait">
              <motion.div
                key={currentIndex}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="w-full h-full flex flex-col justify-between"
              >
                {/* Header Content of slide */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 bg-[#252528] rounded border border-zinc-800 text-[9px] font-extrabold tracking-widest text-[#9DAAF2] uppercase">
                      {slides[currentIndex].badge}
                    </span>
                    <div className="w-8 h-8 rounded-full border border-zinc-800 bg-[#212123] flex items-center justify-center">
                      {slides[currentIndex].icon}
                    </div>
                  </div>
                  <h3 className="text-lg sm:text-xl font-extrabold text-white tracking-tight uppercase mt-2">
                    {slides[currentIndex].title}
                  </h3>
                  <p className="text-[11px] sm:text-xs text-zinc-400 tracking-wide font-medium leading-relaxed normal-case mt-0.5">
                    {slides[currentIndex].description}
                  </p>
                </div>

                {/* Live React Rendered Chart for slide */}
                <div className="w-full flex-grow flex items-end justify-center py-2">
                  {slides[currentIndex].renderChart()}
                </div>
              </motion.div>
            </AnimatePresence>

          </div>

        </div>

      </div>
    </section>
  );
}
