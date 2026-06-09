/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from "motion/react";

interface HostOrGuest {
  id: string;
  initials: string;
  name: string;
  role: string;
}

const members: HostOrGuest[] = [
  {
    id: "rena-malik",
    initials: "DM",
    name: "Dr. Rena Malik",
    role: "Host",
  },
  {
    id: "nicole-mcnichols",
    initials: "NM",
    name: "Nicole McNichols",
    role: "Guest",
  },
  {
    id: "maria-sophocles",
    initials: "MS",
    name: "Maria Sophocles",
    role: "Guest",
  },
  {
    id: "irwin-goldstein",
    initials: "IG",
    name: "Irwin Goldstein",
    role: "Guest",
  },
  {
    id: "tami-rowen",
    initials: "TR",
    name: "Tami Rowen",
    role: "Guest",
  },
  {
    id: "trisha-pasricha",
    initials: "TP",
    name: "Trisha Pasricha",
    role: "Guest",
  },
];

export default function HostsSection() {
  return (
    <section 
      id="hosts-and-guests-section" 
      className="w-full bg-page-bg pt-16 pb-20 px-5 sm:px-8 md:px-12 border-b border-zinc-800/40 relative select-none"
    >
      <div className="max-w-7xl mx-auto flex flex-col gap-10">
        
        {/* Title Block */}
        <div className="flex flex-col gap-2">
          <span className="text-[#9DAAF2]/80 text-[10px] sm:text-xs tracking-[0.25em] font-bold uppercase animate-pulse">
            // Connected Minds
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white uppercase leading-none">
            Hosts & Guests
          </h2>
        </div>

        {/* Horizontal scrollable / responsive grid list */}
        <div 
          id="hosts-avatars-grid-container"
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-y-10 gap-x-6 justify-items-center w-full mt-4"
        >
          {members.map((member, idx) => (
            <motion.div
              key={member.id}
              id={`host-card-${member.id}`}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ delay: idx * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col items-center text-center group cursor-pointer max-w-[170px]"
            >
              {/* Initials Avatar Round Badge with custom responsive sizes and elegant styling */}
              <div 
                id={`host-avatar-ring-${member.id}`}
                className="w-24 sm:w-28 md:w-32 h-24 sm:h-28 md:h-32 rounded-full bg-[#1c1c1e] text-[#a1a1a6] border-2 border-zinc-800/60 group-hover:border-[#9DAAF2]/50 group-hover:text-white flex items-center justify-center font-extrabold text-3xl sm:text-4xl md:text-5xl tracking-normal transition-all duration-300 shadow-md group-hover:scale-105 group-hover:bg-[#252528] relative"
              >
                {member.initials}
                
                {/* Visual Accent Hover Ring */}
                <div className="absolute inset-0 rounded-full border border-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>

              {/* Identity Labels */}
              <h3 className="mt-4 text-xs sm:text-[14px] font-extrabold text-white tracking-wide leading-tight group-hover:text-[#9DAAF2] transition-colors duration-200">
                {member.name}
              </h3>
              <p className="mt-1 text-[10px] sm:text-xs uppercase font-bold tracking-widest text-zinc-550 group-hover:text-zinc-400 transition-colors duration-200">
                {member.role}
              </p>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
