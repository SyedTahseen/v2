/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Meet Your Host & Epic Hero section

import { ArrowUpRight, Play, Podcast, Radio, Link } from "lucide-react";
import { motion } from "motion/react";
import { GenerativeArtScene } from "./ui/generative-art-scene";

const fadeUp = {
  initial: { opacity: 0, y: 32 },
  animate: (index: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: index * 0.12,
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1],
    },
  }),
};

const slideUp = {
  initial: { y: "110%" },
  animate: (wordIndex: number) => ({
    y: 0,
    transition: {
      delay: 0.4 + wordIndex * 0.14,
      duration: 0.7,
      ease: [0.22, 1, 0.36, 1],
    },
  }),
};

const statsData = [
  { value: "300K", label: "DAILY\nLISTENERS", id: "daily-listeners animate" },
  { value: "200", label: "EPISODES\nRELEASED", id: "episodes-released" },
  { value: "100", label: "EXPERT\nGUESTS", id: "expert-guests" },
];

export default function AboutSection() {
  const platforms = [
    {
      name: "YouTube",
      url: "https://youtube.com/@renamalikmd",
      icon: (
        <div className="w-5 sm:w-6 h-5 sm:h-6 rounded bg-[#FF0000] flex items-center justify-center shrink-0">
          <Play size={8} className="text-white fill-white translate-x-[0.5px]" />
        </div>
      ),
    },
    {
      name: "Spotify",
      url: "https://open.spotify.com/show/30xyW3ExCD3f9FZR8Wf2Mn",
      icon: (
        <div className="w-5 sm:w-6 h-5 sm:h-6 rounded-full bg-[#1DB954] flex items-center justify-center shrink-0">
          <Radio size={11} className="text-black" />
        </div>
      ),
    },
    {
      name: "Apple",
      url: "https://podcasts.apple.com/us/podcast/rena-malik-md-podcast/id1709412238",
      icon: (
        <div className="w-5 sm:w-6 h-5 sm:h-6 rounded bg-[#9C33EC] flex items-center justify-center shrink-0">
          <Podcast size={11} className="text-white" />
        </div>
      ),
    },
    {
      name: "Podlink",
      url: "https://pod.link/1709412238",
      icon: (
        <div className="w-5 sm:w-6 h-5 sm:h-6 rounded-full bg-[#2F6DF6] flex items-center justify-center shrink-0">
          <Link size={10} className="text-white" />
        </div>
      ),
    },
  ];

  return (
    <section
      id="about"
      className="relative w-full min-h-[calc(100vh-5rem)] md:min-h-[calc(100vh-6rem)] flex flex-col justify-between py-16 px-5 sm:px-8 md:px-12 bg-page-bg overflow-hidden border-b border-zinc-800/40 select-none"
    >
      <GenerativeArtScene />
      {/* 1. CINEMATIC BACKGROUND VIDEO - EMBEDDED UNDER THE HERO CONTENT */}
      <div className="absolute inset-0 -z-10 bg-black">
        <video
          id="bg-video-element"
          src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260517_222138_3e3205be-3364-417b-a64a-bfe087acbec4.mp4"
          className="w-full h-full object-cover opacity-35"
          autoPlay
          loop
          muted
          playsInline
        />
        <div className="absolute inset-0 bg-gradient-to-t from-page-bg via-page-bg/45 to-page-bg/60" />
      </div>

      {/* 2. MAIN HERO BODY INNER GRID WRAPPER */}
      <div className="max-w-7xl mx-auto w-full z-10 flex-grow flex flex-col justify-between gap-12 mt-4">
        
        {/* TOP ROW: Host Metadata badge & Staggered Stats Counters */}
        <div className="w-full flex flex-col md:flex-row md:items-start justify-between gap-8">
          <div className="flex flex-col gap-2">
            <span className="text-accent text-xs tracking-[0.25em] font-bold uppercase animate-pulse">
              // Meet Your Host
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-wider text-white uppercase">
              Rena Malik, MD
            </h2>
          </div>

          {/* Majestic Animated show stats */}
          <div className="flex gap-6 sm:gap-10 items-center justify-start md:justify-end">
            {statsData.map((stat, idx) => (
              <motion.div
                key={stat.id}
                custom={idx + 2}
                variants={fadeUp}
                initial="initial"
                animate="animate"
                className="flex flex-col items-start md:items-end text-left md:text-right"
              >
                <div className="font-extrabold text-white flex items-start text-2xl sm:text-3xl md:text-4xl leading-none">
                  <span className="text-accent tracking-tighter mr-0.5 md:mr-0 md:ml-0.5 order-first md:order-last">+</span>
                  <span>{stat.value}</span>
                </div>
                <div className="text-[9px] sm:text-[10px] font-bold tracking-widest text-zinc-400 whitespace-pre-line leading-tight mt-1 uppercase">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* CENTER & BOTTOM SECTIONS: Big Display tags paired with Host narrative */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12 items-end">
          
          {/* Left Block: Bold dramatic text word reveal */}
          <div className="lg:col-span-7 flex flex-col leading-[0.88] select-none">
            {["Health", "Desire", "Unfiltered"].map((word, wordIndex) => (
              <div key={word} className="overflow-hidden h-fit flex items-end justify-start">
                <motion.h1
                  custom={wordIndex}
                  variants={slideUp}
                  initial="initial"
                  animate="animate"
                  className="font-extrabold uppercase text-white tracking-tighter whitespace-nowrap"
                  style={{
                    fontSize: "clamp(2.5rem, 8.5vw, 7.5rem)",
                    lineHeight: 0.88,
                  }}
                >
                  {word}
                </motion.h1>
              </div>
            ))}
          </div>

          {/* Right Block: Host narrative statement, CTA, and listen channels */}
          <div className="lg:col-span-5 flex flex-col gap-6 items-start text-left lg:border-l lg:border-zinc-800/60 lg:pl-8">
            <motion.p
              custom={4}
              variants={fadeUp}
              initial="initial"
              animate="animate"
              className="text-zinc-300 text-xs sm:text-sm md:text-[14.5px] leading-relaxed tracking-wider normal-case"
            >
              Dr. Rena Malik is a board-certified urologist, world-renowned pelvic surgeon, and sex educator. 
              Through <span className="text-white font-semibold uppercase tracking-widest text-xs border-b border-accent pb-0.5">The Rena Malik Show</span>, 
              she brings science-backed clarity, clinical safety, and empathetic humor to topics people are 
              historically too shy or embarrassed to ask.
            </motion.p>

            <motion.div
              custom={5}
              variants={fadeUp}
              initial="initial"
              animate="animate"
              className="flex flex-col gap-5 w-full items-start"
            >
              {/* Highlight Listen link */}
              <a
                id="about-cta-link"
                href="#expertise"
                className="text-accent text-sm sm:text-base md:text-lg font-bold tracking-widest inline-flex items-center gap-1.5 hover:opacity-85 transition-all duration-300 whitespace-nowrap active:scale-[0.98] uppercase hover:translate-x-1"
              >
                Listen To The Show
                <ArrowUpRight className="text-accent shrink-0 w-5 h-5" />
              </a>

              {/* Streaming distribution channel pills */}
              <div className="flex flex-wrap gap-2 w-full mt-1">
                {platforms.map((plat) => (
                  <a
                    key={plat.name}
                    href={plat.url}
                    target="_blank"
                    referrerPolicy="no-referrer"
                    rel="noopener noreferrer"
                    className="px-3.5 py-1.5 bg-card-pill border border-zinc-700/50 hover:border-zinc-500 rounded-full flex items-center gap-2 transition-all duration-300 hover:bg-card-pill/90 hover:scale-[1.03] active:scale-[0.97] group"
                  >
                    {plat.icon}
                    <span className="text-[10px] sm:text-[11px] font-semibold tracking-wide text-zinc-300 group-hover:text-white transition-colors">
                      {plat.name}
                    </span>
                  </a>
                ))}
              </div>
            </motion.div>
          </div>

        </div>

      </div>
    </section>
  );
}
