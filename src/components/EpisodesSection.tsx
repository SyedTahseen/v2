/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Search, Play, Pause, Volume2, Clock, Calendar, ArrowRight, Music, 
  Sparkles, X, ExternalLink, Copy, Check, Info, ChevronRight, Activity, 
  ChevronLeft, MoreHorizontal, FileText, Radio, Podcast
} from "lucide-react";
import { podcastEpisodes, Episode } from "../types";

interface EpisodesSectionProps {
  onDetailStateChange?: (active: boolean) => void;
  currentPath?: string;
}

function TabRedirector({ 
  detailTab, 
  setDetailTab, 
  hasTimestamps, 
  hasTranscript 
}: { 
  detailTab: string; 
  setDetailTab: (t: any) => void; 
  hasTimestamps: boolean; 
  hasTranscript: boolean; 
}) {
  useEffect(() => {
    if (detailTab === "transcript" && !hasTranscript) {
      setDetailTab("notes");
    } else if (detailTab === "timestamps" && !hasTimestamps) {
      setDetailTab("notes");
    }
  }, [detailTab, hasTimestamps, hasTranscript, setDetailTab]);

  return null;
}

export default function EpisodesSection({ onDetailStateChange, currentPath }: EpisodesSectionProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  
  // Dynamic Episodes state managed from RSS Proxy endpoint
  const [episodes, setEpisodes] = useState<Episode[]>(podcastEpisodes);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDetailEpisode, setSelectedDetailEpisode] = useState<Episode | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Custom metadata (timestamps, transcription text, platform URLs)
  const [episodeMeta, setEpisodeMeta] = useState<{ 
    timestamps: Array<{ time: string; label: string }>; 
    transcript: string;
    spotifyUrl?: string;
    applePodcastsUrl?: string;
    youtubeUrl?: string;
  }>({ timestamps: [], transcript: "", spotifyUrl: "", applePodcastsUrl: "", youtubeUrl: "" });
  const [isLoadingMeta, setIsLoadingMeta] = useState(false);
  const [detailTab, setDetailTab] = useState<"notes" | "timestamps" | "transcript">("notes");

  // Synchronize route (currentPath) with selectedDetailEpisode
  useEffect(() => {
    if (!currentPath || episodes.length === 0) return;

    if (currentPath.startsWith("/episode/")) {
      const episodeId = currentPath.substring("/episode/".length);
      const found = episodes.find((ep) => ep.id === episodeId);
      if (found) {
        if (!selectedDetailEpisode || selectedDetailEpisode.id !== episodeId) {
          setSelectedDetailEpisode(found);
        }
      } else {
        // Redirection is only safe if we finished loading episodes and it was truly not found
        if (selectedDetailEpisode) {
          setSelectedDetailEpisode(null);
        }
        if (window.location.pathname !== "/") {
          window.history.pushState({}, "", "/");
        }
      }
    } else {
      if (selectedDetailEpisode) {
        setSelectedDetailEpisode(null);
      }
    }
  }, [currentPath, episodes]);

  // Sync selectedDetailEpisode to browser location bar path
  useEffect(() => {
    if (episodes.length === 0) return;

    if (selectedDetailEpisode) {
      const targetPath = `/episode/${selectedDetailEpisode.id}`;
      if (window.location.pathname !== targetPath) {
        window.history.pushState({}, "", targetPath);
      }
    } else {
      // Revert back block only if we are currently on an episode detail path and episodes are loaded
      if (window.location.pathname.startsWith("/episode/")) {
        window.history.pushState({}, "", "/");
      }
    }
  }, [selectedDetailEpisode, episodes]);

  const fetchEpisodeMeta = (episodeId: string, backgroundOnly: boolean = false) => {
    if (!backgroundOnly) {
      setIsLoadingMeta(true);
    }
    fetch(`/api/episode-meta/${episodeId}`)
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data) => {
        if (data) {
          setEpisodeMeta(data);
        }
      })
      .catch((err) => {
        console.warn("[EpisodeMeta] Fallback clear/loading error", err);
        if (!backgroundOnly) {
          setEpisodeMeta({ timestamps: [], transcript: "", spotifyUrl: "", applePodcastsUrl: "", youtubeUrl: "" });
        }
      })
      .finally(() => {
        if (!backgroundOnly) {
          setIsLoadingMeta(false);
        }
      });
  };

  // Synchronize on selection change
  useEffect(() => {
    if (selectedDetailEpisode) {
      setDetailTab("notes"); // Reset visual tabs
      // Immediately hydrate with pre-merged metadata to provide zero-latency rendering
      setEpisodeMeta({
        timestamps: selectedDetailEpisode.timestamps || [],
        transcript: selectedDetailEpisode.transcript || ""
      });
      // Gently fetch fresh metadata in the background
      fetchEpisodeMeta(selectedDetailEpisode.id, true);
    } else {
      setEpisodeMeta({ timestamps: [], transcript: "" });
    }
  }, [selectedDetailEpisode]);

  // Handle global admin save callback event
  useEffect(() => {
    const handleAdminMetaUpdated = () => {
      if (selectedDetailEpisode) {
        console.log("[EpisodesSection] Refreshing episode details following admin save action.");
        fetchEpisodeMeta(selectedDetailEpisode.id, false);
      }
    };
    window.addEventListener("episode-meta-updated", handleAdminMetaUpdated);
    return () => window.removeEventListener("episode-meta-updated", handleAdminMetaUpdated);
  }, [selectedDetailEpisode]);

  // Sync details state with parent
  useEffect(() => {
    if (onDetailStateChange) {
      onDetailStateChange(!!selectedDetailEpisode);
    }
  }, [selectedDetailEpisode, onDetailStateChange]);

  // Expanded Catalog View (Apple Podcasts styles show first 5, then "See All")
  const [isExpanded, setIsExpanded] = useState(false);

  // Audio Player State
  const [activeEpisode, setActiveEpisode] = useState<Episode | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.85);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Reset list expansion state whenever filters or searches change
  useEffect(() => {
    setIsExpanded(false);
  }, [selectedCategory, searchQuery]);

  // Fetch episodes from self Express endpoint at mount
  useEffect(() => {
    setIsLoading(true);
    fetch("/api/episodes")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP status: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (data && Array.isArray(data) && data.length > 0) {
          console.log(`[Podcasts] Received ${data.length} episodes from Live RSS feed.`);
          setEpisodes(data);
        }
      })
      .catch((err) => {
        console.warn("[Podcasts] Failed fetching live RSS; using offline backup.", err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  // Compute unique categories dynamically from loaded episodes list
  const categories = ["All", ...Array.from(new Set(episodes.map(ep => ep.category)))];

  // Filter episodes
  const filteredEpisodes = episodes.filter((ep) => {
    const matchesSearch = ep.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          ep.guest.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          ep.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          ep.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = selectedCategory === "All" || ep.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  // Handle Play/Pause trigger
  const handlePlayToggle = (episode: Episode) => {
    if (activeEpisode?.id === episode.id) {
      setIsPlaying(!isPlaying);
    } else {
      setActiveEpisode(episode);
      setIsPlaying(true);
      setCurrentTime(0);
    }
  };

  // Skip progress helper
  const seekToTime = (seconds: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = seconds;
      setIsPlaying(true);
    }
  };

  // Synchronize audio element playing state
  useEffect(() => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.play().catch(() => {
        setIsPlaying(false);
      });
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying, activeEpisode]);

  // Sync volume change
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  // Formatter for elapsed audio time
  const formatTime = (secs: number) => {
    if (isNaN(secs)) return "0:00";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  // Utility to parse chapter string timestamps (e.g. "04:18" or "00:00:23") into seconds
  const parseTimestampToSeconds = (timestampStr: string): number => {
    const parts = timestampStr.split(":").map(Number);
    if (parts.length === 3) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    } else if (parts.length === 2) {
      return parts[0] * 60 + parts[1];
    }
    return 0;
  };

  // Copy episode link to clipboard
  const copyEpisodeLink = (id: string, feedUrl: string) => {
    navigator.clipboard.writeText(feedUrl || window.location.href);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Helper to format dynamic publish dates into friendly Apple Podcast labels
  const getRelativeDateLabel = (dateStr: string): string => {
    try {
      const pubDate = new Date(dateStr);
      if (isNaN(pubDate.getTime())) return dateStr;
      
      const now = new Date("2026-06-06T12:13:26Z"); // Anchored current time
      const diffMs = now.getTime() - pubDate.getTime();
      const diffSecs = Math.floor(diffMs / 1000);
      const diffMins = Math.floor(diffSecs / 60);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMs < 0) {
        return dateStr;
      }

      if (diffHours < 24) {
        if (diffHours === 0) {
          return diffMins <= 1 ? "Just now" : `${diffMins}m ago`;
        }
        return `${diffHours}h ago`;
      } else if (diffDays < 7) {
        return `${diffDays}d ago`;
      } else {
        return pubDate.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: pubDate.getFullYear() !== now.getFullYear() ? "numeric" : undefined
        });
      }
    } catch (e) {
      return dateStr;
    }
  };

  // Helper to append "[E]" explicit badge to sexology, arousal, or clinical sex topics
  const hasExplicitContent = (ep: Episode): boolean => {
    const textToScan = `${ep.title} ${ep.description}`.toLowerCase();
    return textToScan.includes("sex") || 
           textToScan.includes("libido") || 
           textToScan.includes("desire") || 
           textToScan.includes("orgasm") || 
           textToScan.includes("arousal") ||
           textToScan.includes("testicular") ||
           textToScan.includes("pregnancy") ||
           textToScan.includes("childbirth");
  };

  return (
    <section id="expertise" className="pt-20 pb-16 px-5 sm:px-8 md:px-12 bg-page-bg border-b border-zinc-800/40 relative">
      <div className="max-w-7xl mx-auto">
        
        {/* Hidden HTML5 Audio Element */}
        {activeEpisode && (
          <audio
            ref={audioRef}
            src={activeEpisode.audioUrl}
            onTimeUpdate={() => {
              if (audioRef.current) {
                setCurrentTime(audioRef.current.currentTime);
              }
            }}
            onLoadedMetadata={() => {
              if (audioRef.current) {
                setDuration(audioRef.current.duration || 180);
              }
            }}
            onEnded={() => {
              setIsPlaying(false);
              setCurrentTime(0);
            }}
          />
        )}

        {/* Categories Pills & Search row (Sleek Apple style) */}
        {!selectedDetailEpisode && (
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
            {/* Elegant Header with clickable chevron style */}
            <div className="flex flex-col gap-1.5">
              <div 
                className="flex items-center cursor-pointer text-white tracking-tight"
                onClick={() => setSelectedCategory("All")}
              >
                <h2 className="text-2xl sm:text-3.5xl font-extrabold text-white uppercase tracking-wider">
                  Episodes
                </h2>
              </div>
              <p className="text-zinc-500 text-xs tracking-wider uppercase font-semibold">
                Explore the Complete Clinical & Wellness Vault
              </p>
            </div>

            {/* Smart Search Bar */}
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" size={14} />
              <input
                type="text"
                placeholder="Search catalog, tags, guests..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-card-pill border border-zinc-700/50 focus:border-[#9DAAF2] text-white rounded-lg pl-10 pr-4 py-2 text-xs font-semibold tracking-wider placeholder-zinc-500 transition-colors focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* Full-width stage */}
        <div className="w-full">
          
          {/* Main Stage (List or inline beautiful Episode Details Page) */}
          <div className="w-full">
            <AnimatePresence mode="wait">
              {selectedDetailEpisode ? (
                /* REDESIGNED: INLINE EPISODE PAGE VIEW (NO MODAL POPUP WINDOW!) */
                <motion.div
                  key="detail-page"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  className="flex flex-col gap-8 select-text"
                >
                  {/* Detailed Page Breadcrumb / Navigation back flow */}
                  <div className="flex items-center justify-between pb-6 border-b border-zinc-800/65">
                    <button
                      onClick={() => setSelectedDetailEpisode(null)}
                      className="flex items-center gap-1.5 text-xs text-[#bf9ef9] hover:text-white tracking-widest font-bold uppercase transition-colors cursor-pointer group"
                    >
                      <ChevronLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
                      All Episodes
                    </button>
                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider bg-[#1C1C1E] px-2.5 py-1 rounded">
                      EPISODE #{selectedDetailEpisode.number}
                    </span>
                  </div>

                  {/* Header Title Metadata details block */}
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-wrap items-center gap-2.5 text-xs text-zinc-400 font-semibold uppercase tracking-wider">
                      <span>{getRelativeDateLabel(selectedDetailEpisode.publishedAt)}</span>
                      {hasExplicitContent(selectedDetailEpisode) && (
                        <span className="inline-flex items-center justify-center bg-card-pill text-[#a1a1a6] text-[10px] font-extrabold px-1.5 py-[0.5px] rounded-sm tracking-normal leading-none" title="Explicit Content">
                          E
                        </span>
                      )}
                      <span className="text-zinc-650">•</span>
                      <span className="text-[#9DAAF2]">{selectedDetailEpisode.category}</span>
                    </div>

                    <h1 className="text-2xl sm:text-3xl md:text-3.5xl font-extrabold text-white tracking-tight leading-tight uppercase">
                      {selectedDetailEpisode.title}
                    </h1>

                    <div className="flex items-center gap-3.5 p-4 rounded-lg bg-card-pill border border-zinc-700/50 my-1">
                      <div className="w-10 h-10 rounded-full bg-page-bg border border-zinc-700/50 flex items-center justify-center text-[#9DAAF2] font-bold text-xs">
                        {selectedDetailEpisode.guest.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs text-zinc-500 tracking-wider uppercase font-bold">FEATURING EXPERT</span>
                        <span className="text-sm font-bold text-white tracking-wide">{selectedDetailEpisode.guest}</span>
                        <span className="text-xs text-zinc-400 font-normal">{selectedDetailEpisode.guestTitle}</span>
                      </div>
                    </div>

                    {/* Platform Listen Links */}
                    {(episodeMeta?.spotifyUrl || episodeMeta?.applePodcastsUrl || episodeMeta?.youtubeUrl) && (
                      <div className="flex flex-col gap-2 mt-2">
                        <span className="text-[10px] text-zinc-500 tracking-widest uppercase font-black">Listen / Watch on Platforms</span>
                        <div className="flex flex-wrap items-center gap-2">
                          {episodeMeta?.spotifyUrl && (
                            <a
                              href={episodeMeta.spotifyUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3.5 py-1.5 bg-card-pill border border-zinc-700/50 hover:border-zinc-500 rounded-full flex items-center gap-2 transition-all duration-300 hover:bg-card-pill/90 hover:scale-[1.03] active:scale-[0.97] group cursor-pointer mr-0.5"
                            >
                              <div className="w-5 h-5 rounded-full bg-[#1DB954] flex items-center justify-center shrink-0">
                                <Radio size={10} className="text-black" />
                              </div>
                              <span className="text-[10px] sm:text-[11px] font-semibold tracking-wide text-zinc-300 group-hover:text-white transition-colors">
                                Spotify
                              </span>
                            </a>
                          )}
                          {episodeMeta?.applePodcastsUrl && (
                            <a
                              href={episodeMeta.applePodcastsUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3.5 py-1.5 bg-card-pill border border-zinc-700/50 hover:border-zinc-500 rounded-full flex items-center gap-2 transition-all duration-300 hover:bg-card-pill/90 hover:scale-[1.03] active:scale-[0.97] group cursor-pointer mr-0.5"
                            >
                              <div className="w-5 h-5 rounded bg-[#9C33EC] flex items-center justify-center shrink-0">
                                <Podcast size={10} className="text-white" />
                              </div>
                              <span className="text-[10px] sm:text-[11px] font-semibold tracking-wide text-zinc-300 group-hover:text-white transition-colors">
                                Apple Podcasts
                              </span>
                            </a>
                          )}
                          {episodeMeta?.youtubeUrl && (
                            <a
                              href={episodeMeta.youtubeUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3.5 py-1.5 bg-card-pill border border-zinc-700/50 hover:border-zinc-500 rounded-full flex items-center gap-2 transition-all duration-300 hover:bg-card-pill/90 hover:scale-[1.03] active:scale-[0.97] group cursor-pointer"
                            >
                              <div className="w-5 h-5 rounded bg-[#FF0000] flex items-center justify-center shrink-0">
                                <Play size={8} className="text-white fill-white translate-x-[0.5px]" />
                              </div>
                              <span className="text-[10px] sm:text-[11px] font-semibold tracking-wide text-zinc-300 group-hover:text-white transition-colors">
                                YouTube
                              </span>
                            </a>
                          )}
                        </div>
                      </div>
                    )}
                  </div>



                  {/* Tabs Selection Row */}
                  {(() => {
                    const hasTimestamps = !!(episodeMeta?.timestamps && episodeMeta.timestamps.length > 0);
                    const hasTranscript = !!(episodeMeta?.transcript && episodeMeta.transcript.trim().length > 0);

                    return (
                      <>
                        <div className="flex gap-6 mt-6 pb-2">
                          <button
                            type="button"
                            onClick={() => setDetailTab("notes")}
                            className={`pb-1 text-xs font-bold uppercase tracking-widest transition-all cursor-pointer relative ${
                              detailTab === "notes" ? "text-white font-extrabold" : "text-zinc-500 hover:text-zinc-300"
                            }`}
                          >
                            Notes
                            {detailTab === "notes" && (
                              <motion.div layoutId="activeDetailLine" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#9DAAF2]" />
                            )}
                          </button>

                          {hasTimestamps && (
                            <button
                              type="button"
                              onClick={() => setDetailTab("timestamps")}
                              className={`pb-1 text-xs font-bold uppercase tracking-widest transition-all cursor-pointer relative ${
                                detailTab === "timestamps" ? "text-white font-extrabold" : "text-zinc-500 hover:text-zinc-300"
                              }`}
                            >
                              <span>Timestamps</span>
                              {episodeMeta?.timestamps?.length > 0 && (
                                <span className="bg-[#9DAAF2]/15 text-[#9DAAF2] text-[9px] font-extrabold px-1.5 py-[0.5px] rounded-full ml-1.5 align-middle select-none">
                                  {episodeMeta.timestamps.length}
                                </span>
                              )}
                              {detailTab === "timestamps" && (
                                <motion.div layoutId="activeDetailLine" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#9DAAF2]" />
                              )}
                            </button>
                          )}

                          {hasTranscript && (
                            <button
                              type="button"
                              onClick={() => setDetailTab("transcript")}
                              className={`pb-1 text-xs font-bold uppercase tracking-widest transition-all cursor-pointer relative ${
                                detailTab === "transcript" ? "text-white font-extrabold" : "text-zinc-500 hover:text-zinc-300"
                              }`}
                            >
                              Transcript
                              {detailTab === "transcript" && (
                                <motion.div layoutId="activeDetailLine" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#9DAAF2]" />
                              )}
                            </button>
                          )}
                        </div>

                        {/* Switch away from hidden tab if selected tab becomes empty */}
                        <TabRedirector 
                          detailTab={detailTab} 
                          setDetailTab={setDetailTab} 
                          hasTimestamps={hasTimestamps} 
                          hasTranscript={hasTranscript} 
                        />
                      </>
                    );
                  })()}

                  {/* Dynamic Tab Body Render */}
                  <div className="pt-2 min-h-[160px]">
                    
                    {/* tab 1: Standard RSS Show Notes */}
                    {detailTab === "notes" && (
                      <div className="flex flex-col gap-4 font-sans text-xs sm:text-sm text-zinc-300 leading-relaxed pt-2">
                        {selectedDetailEpisode.description.split("\n").map((line, index) => {
                          const timeMatch = line.match(/(\d{2}:\d{2}(?::\d{2})?)/);
                          if (timeMatch) {
                            const stampStr = timeMatch[1];
                            const textLabel = line.replace(stampStr, "").trim().replace(/^▶️Chapters:|^▶️|^:/, "").trim();
                            
                            return (
                              <p key={index} className="normal-case leading-relaxed mb-0.5">
                                <span className="font-mono font-bold underline mr-2.5 tracking-wider text-white">
                                  {stampStr}
                                </span>
                                <span className="text-zinc-300 font-medium font-sans">
                                  {textLabel}
                                </span>
                              </p>
                            );
                          }
                          
                          return (
                            <p key={index} className="normal-case font-normal text-zinc-300 leading-relaxed mb-0.5 font-sans">
                              {line}
                            </p>
                          );
                        })}
                      </div>
                    )}

                    {/* tab 2: Bespoke Curated Timestamps with fallback */}
                    {detailTab === "timestamps" && (
                      <div className="flex flex-col gap-4 font-sans text-xs sm:text-sm text-zinc-300 leading-relaxed pt-2">
                        {isLoadingMeta ? (
                          <div className="flex flex-col items-center justify-center py-10 text-xs text-zinc-500 gap-2 uppercase font-semibold">
                            <div className="w-5 h-5 rounded-full border-2 border-zinc-700 border-t-[#9DAAF2] animate-spin" />
                            <span>Loading Curation Chapters...</span>
                          </div>
                        ) : episodeMeta.timestamps && episodeMeta.timestamps.length > 0 ? (
                          episodeMeta.timestamps.map((stamp, index) => (
                            <p key={index} className="normal-case leading-relaxed mb-0.5">
                              <span className="font-mono font-bold underline mr-2.5 tracking-wider text-white">
                                {stamp.time}
                              </span>
                              <span className="text-zinc-300 font-medium font-sans">
                                {stamp.label}
                              </span>
                            </p>
                          ))
                        ) : (
                          <div className="p-8 border border-dashed border-zinc-800 text-center rounded-lg py-12 flex flex-col items-center justify-center gap-4">
                            <span className="w-10 h-10 rounded-full bg-accent-blue/15 flex items-center justify-center text-[#9DAAF2]">
                              <Clock size={18} />
                            </span>
                            <div className="flex flex-col gap-1 max-w-sm">
                              <h4 className="text-xs sm:text-sm font-bold text-white uppercase tracking-widest">
                                Timestamps Empty
                              </h4>
                              <p className="text-xs text-zinc-550 leading-relaxed normal-case">
                                Curated timestamps are not loaded yet. You can add them instantly using the new <strong>Admin Panel</strong> at the top of page!
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* tab 3: Full Custom Show Transcript */}
                    {detailTab === "transcript" && (
                      <div className="flex flex-col gap-4 font-sans text-xs sm:text-sm text-zinc-300 leading-relaxed pt-2">
                        {isLoadingMeta ? (
                          <div className="flex flex-col items-center justify-center py-10 text-xs text-zinc-500 gap-2 uppercase font-semibold font-sans">
                            <div className="w-5 h-5 rounded-full border-2 border-zinc-700 border-t-[#9DAAF2] animate-spin" />
                            <span>Loading Transcript text...</span>
                          </div>
                        ) : episodeMeta.transcript ? (
                          <div className="flex flex-col gap-4 pr-1">
                            {episodeMeta.transcript.split("\n").map((line, index) => {
                              if (!line.trim()) return <div key={index} className="h-2" />;

                              // Match time brackets like [12:30]
                              const stampMatch = line.match(/\[(\d{1,2}:\d{2}(?::\d{2})?)\]/);
                              const stampStr = stampMatch ? stampMatch[1] : null;
                              const cleanLine = stampStr ? line.replace(stampMatch[0], "").trim() : line;
                              const secs = stampStr ? parseTimestampToSeconds(stampStr) : null;

                              // Split Speaker
                              const speakerMatch = cleanLine.match(/^([^:]+):/);
                              const speaker = speakerMatch ? speakerMatch[1].trim() : null;
                              const speechText = speaker ? cleanLine.replace(speakerMatch[0], "").trim() : cleanLine;
                              const isShowSpeaker = speaker && !speaker.toLowerCase().includes("speaker");

                              return (
                                <p key={index} className="normal-case font-normal text-zinc-300 leading-relaxed mb-0.5 font-sans">
                                  {stampStr && secs !== null && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setActiveEpisode(selectedDetailEpisode);
                                        setTimeout(() => seekToTime(secs), 100);
                                      }}
                                      className="font-mono font-bold underline mr-2 tracking-wider text-white hover:text-[#9DAAF2] transition-colors cursor-pointer"
                                      title={`Jump to ${stampStr}`}
                                    >
                                      [{stampStr}]
                                    </button>
                                  )}
                                  {isShowSpeaker && (
                                    <span className="font-bold text-white mr-2">
                                      {speaker}:
                                    </span>
                                  )}
                                  <span>{speechText}</span>
                                </p>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="p-8 border border-dashed border-zinc-800 text-center rounded-lg py-12 flex flex-col items-center justify-center gap-4">
                            <span className="w-10 h-10 rounded-full bg-accent-blue/15 flex items-center justify-center text-[#9DAAF2]">
                              <FileText size={18} />
                            </span>
                            <div className="flex flex-col gap-1 max-w-sm">
                              <h4 className="text-xs sm:text-sm font-bold text-white uppercase tracking-widest">
                                Transcript Empty
                              </h4>
                              <p className="text-xs text-zinc-550 leading-relaxed normal-case">
                                Curated transcript is not loaded yet. You can add one instantly using the new <strong>Admin Panel</strong> at the top of page!
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                  </div>

                  {/* Keywords and tags */}
                  <div className="flex flex-wrap gap-2 pt-6 border-t border-zinc-700/30">
                    {selectedDetailEpisode.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] text-zinc-400 tracking-wider font-semibold uppercase bg-card-pill px-3 py-1.5 rounded-full border border-zinc-700/50"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>

                </motion.div>
              ) : (
                /* ALIGNED REPLICA: APPLE PODCAST CATALOG LIST LAYOUT */
                <motion.div
                  key="list"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col"
                >
                  {filteredEpisodes.length === 0 ? (
                    <div className="p-12 text-center rounded-lg bg-card-pill border border-zinc-700/50 flex flex-col items-center gap-4 py-16">
                      <Music className="text-zinc-500 mb-1" size={32} />
                      <p className="text-zinc-400 text-xs tracking-widest uppercase font-semibold">
                        No episodes match your search query.
                      </p>
                      <button
                        onClick={() => { setSearchQuery(""); setSelectedCategory("All"); }}
                        className="text-[#9DAAF2] hover:underline text-xs tracking-wider font-semibold uppercase cursor-pointer"
                      >
                        Reset filters
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col">
                      {filteredEpisodes.slice(0, isExpanded ? undefined : 20).map((ep) => {
                        const isCurrent = activeEpisode?.id === ep.id;
                        const isCurPlaying = isCurrent && isPlaying;
                        const hasExplicit = hasExplicitContent(ep);
                        const relativeLabel = getRelativeDateLabel(ep.publishedAt);

                        return (
                          <div
                            key={ep.id}
                            id={`episode-row-${ep.id}`}
                            className="py-6 border-b border-zinc-800/50 last:border-b-0 cursor-pointer group flex flex-col gap-2 transition-opacity hover:opacity-95"
                            onClick={() => setSelectedDetailEpisode(ep)}
                          >
                            {/* Meta & explicit indicator row */}
                            <div className="flex items-center gap-2 text-[10px] sm:text-xs text-zinc-500 font-bold uppercase tracking-wider">
                              <span>{relativeLabel}</span>
                              {hasExplicit && (
                                <>
                                  <span className="text-zinc-700">•</span>
                                  <span className="inline-flex items-center justify-center bg-card-pill text-[#a1a1a6] text-[9px] font-extrabold px-1.5 py-[0.5px] rounded-sm tracking-normal leading-none" title="Explicit Content">
                                    E
                                  </span>
                                </>
                              )}
                              <span className="text-zinc-700">•</span>
                              <span className="text-[#9DAAF2]/90 tracking-wide font-semibold">{ep.category}</span>
                            </div>

                            {/* Episode Title */}
                            <h3 className="text-base sm:text-[18px] font-extrabold text-white tracking-tight leading-snug group-hover:text-[#9DAAF2] transition-colors">
                              {ep.title}
                            </h3>

                            {/* Decentered / lighter styled description */}
                            <p className="text-zinc-450 text-xs sm:text-[13.5px] leading-relaxed tracking-wider normal-case font-normal line-clamp-2 mt-0.5 text-zinc-400">
                              {ep.description}
                            </p>

                            {/* Circular Play CTA row matching layout screenshot */}
                            <div className="flex items-center justify-between pt-1 mt-1">
                              <div className="flex items-center gap-3">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handlePlayToggle(ep);
                                  }}
                                  className="w-10 h-10 rounded-full bg-card-pill border border-zinc-700/50 hover:bg-zinc-750 hover:scale-105 active:scale-95 flex items-center justify-center transition-all cursor-pointer group/play shrink-0 shadow-sm"
                                >
                                  {isCurPlaying ? (
                                    <Pause size={12} className="text-[#9DAAF2] fill-[#9DAAF2]" />
                                  ) : (
                                    <Play size={12} className="text-[#9DAAF2] fill-[#9DAAF2] translate-x-0.5" />
                                  )}
                                </button>
                                
                                <span className="text-xs font-bold text-[#9DAAF2] tracking-wide uppercase">
                                  {ep.duration}
                                </span>
                              </div>

                              <div className="flex items-center gap-2">
                                <span className="text-[10px] text-zinc-500 group-hover:text-[#9DAAF2] font-bold tracking-widest uppercase transition-colors pr-2">
                                  Notes
                                </span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    copyEpisodeLink(ep.id, ep.audioUrl);
                                  }}
                                  title="Copy share link"
                                  className="w-8 h-8 rounded-full bg-transparent hover:bg-card-pill flex items-center justify-center text-zinc-500 hover:text-white transition-colors cursor-pointer"
                                >
                                  <MoreHorizontal size={14} />
                                </button>
                              </div>
                            </div>

                          </div>
                        );
                      })}
                      
                      {!isExpanded && filteredEpisodes.length > 20 && (
                        <div className="pt-4 mt-2">
                          <button
                            onClick={() => setIsExpanded(true)}
                            className="text-[#9DAAF2] hover:text-[#b4c3ff] text-base sm:text-lg font-bold tracking-tight transition-all duration-300 cursor-pointer"
                          >
                            See All ({filteredEpisodes.length})
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>

      </div>
    </section>
  );
}
