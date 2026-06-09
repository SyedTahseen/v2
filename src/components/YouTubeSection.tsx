import React, { useState, useEffect, useRef } from "react";
import { Youtube, Play, Loader, ArrowUpRight } from "lucide-react";
import { motion } from "motion/react";

interface YoutubeVideo {
  id: string;
  title: string;
  thumbnail: string;
  publishedAt?: string;
  duration?: string;
  views: string;
}

interface YoutubeStats {
  subscriberCount: string;
  videoCount: string;
  viewCount: string;
}

interface YoutubeData {
  channelName: string;
  channelThumbnail: string;
  statistics: YoutubeStats;
  videos: YoutubeVideo[];
  shorts: YoutubeVideo[];
  isLiveApi: boolean;
}

const MOCK_SHORTS: YoutubeVideo[] = [
  {
    id: "pT7v_9r7M1s",
    title: "Why you probably shouldn't hold your pee too long! 🚽",
    thumbnail: "https://i.ytimg.com/vi/pT7v_9r7M1s/hqdefault.jpg",
    views: "1.2M views"
  },
  {
    id: "zW9vK7s3R2x",
    title: "The ultimate pelvic floor release stretch! 🌸",
    thumbnail: "https://i.ytimg.com/vi/zW9vK7s3R2x/hqdefault.jpg",
    views: "890K views"
  },
  {
    id: "xR9vK2s1M4y",
    title: "Are you wiping correctly? (Urologist Shares) 🧻",
    thumbnail: "https://i.ytimg.com/vi/xR9vK2s1M4y/hqdefault.jpg",
    views: "3.4M views"
  },
  {
    id: "yW8vP9s4L1z",
    title: "Hydration Tip: How to know if you're actually drinking enough water!",
    thumbnail: "https://i.ytimg.com/vi/yW8vP9s4L1z/hqdefault.jpg",
    views: "540K views"
  },
  {
    id: "Z-4T62RjK1k",
    title: "Urologist advises: The absolute truth about frequent night urination 🌙",
    thumbnail: "https://i.ytimg.com/vi/Z-4T62RjK1k/hqdefault.jpg",
    views: "2M views"
  },
  {
    id: "Ur7Pq9v7M1c",
    title: "Why pelvic floor release exercises are key for intimate health",
    thumbnail: "https://i.ytimg.com/vi/Ur7Pq9v7M1c/hqdefault.jpg",
    views: "710K views"
  }
];

const MOCK_VIDEOS: YoutubeVideo[] = [
  {
    id: "Z-4T62RjK1k",
    title: "How to Keep Your Bladder Young & Prevent Frequent Urination",
    thumbnail: "https://i.ytimg.com/vi/Z-4T62RjK1k/hqdefault.jpg",
    views: "185K views"
  },
  {
    id: "Is9V_9g7T68",
    title: "Is Caffeine Actually Ruining Your Bladder? (What Urologists Wish You Knew)",
    thumbnail: "https://i.ytimg.com/vi/Is9V_9g7T68/hqdefault.jpg",
    views: "94K views"
  },
  {
    id: "Ur7Pq9v7M1c",
    title: "Kegels Are NOT The Answer: Pelvic Floor Release Hacks",
    thumbnail: "https://i.ytimg.com/vi/Ur7Pq9v7M1c/hqdefault.jpg",
    views: "120K views"
  },
  {
    id: "W_9vK1s7R4m",
    title: "The Best Foods for Vaginal Health, Libido, and Urinary Prevention",
    thumbnail: "https://i.ytimg.com/vi/W_9vK1s7R4m/hqdefault.jpg",
    views: "245K views"
  }
];

export default function YouTubeSection() {
  const [data, setData] = useState<YoutubeData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [isHovered, setIsHovered] = useState<boolean>(false);
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [blurredVideoId, setBlurredVideoId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchYouTubeFeed() {
      try {
        setLoading(true);
        const res = await fetch("/api/youtube");
        if (!res.ok) {
          throw new Error(`Failed to load media (Status ${res.status})`);
        }
        const parsed = await res.json();
        setData(parsed);
      } catch (err: any) {
        console.error("YouTube section fetch error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchYouTubeFeed();
  }, []);

  // Handle responsive check via matchMedia
  useEffect(() => {
    const media = window.matchMedia("(max-width: 640px)");
    const handleMediaChange = () => setIsMobile(media.matches);
    handleMediaChange();
    media.addEventListener("change", handleMediaChange);
    return () => media.removeEventListener("change", handleMediaChange);
  }, []);

  const activeShorts = (data?.shorts && data.shorts.length > 0) ? data.shorts : MOCK_SHORTS;

  const activeVideos = data?.videos 
    ? data.videos.filter((vid: YoutubeVideo) => {
        const titleLower = vid.title.toLowerCase();
        const containsShorts = titleLower.includes("#shorts") || titleLower.includes("shorts");
        if (containsShorts) return false;
        
        if (vid.duration) {
          const parts = vid.duration.split(":");
          if (parts.length === 2 && parts[0] === "0") {
            return false; // under 1 minute duration is a short video
          }
        }
        return true;
      })
    : MOCK_VIDEOS;

  // Auto scroll to next short unless hovered
  useEffect(() => {
    if (isHovered || activeShorts.length === 0) return;
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % activeShorts.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [activeShorts.length, isHovered]);

  if (loading) {
    return (
      <section className="py-16 md:py-24 px-6 md:px-12 bg-page-bg w-full flex flex-col items-center justify-center min-h-[400px] border-b border-zinc-800/40">
        <div className="flex flex-col items-center gap-4 text-center">
          <Loader size={36} className="text-accent animate-spin" />
          <p className="text-zinc-400 font-medium text-sm tracking-wide">
            Retrieving live subscriber metrics & YouTube Shorts video feed...
          </p>
        </div>
      </section>
    );
  }

  const liveStats = data?.statistics || {
    subscriberCount: "2.14M",
    videoCount: "942",
    viewCount: "428.5M"
  };

  const handleCardClick = (idx: number, isCenter: boolean, urlId: string) => {
    if (isCenter) {
      window.open(`https://youtube.com/shorts/${urlId}`, "_blank", "noopener,noreferrer");
    } else {
      setActiveIndex(idx);
    }
  };

  return (
    <section 
      id="youtube-shorts-carousel" 
      className="py-16 md:py-24 px-6 md:px-12 bg-page-bg border-b border-zinc-800/40 w-full relative overflow-hidden select-none"
    >
      {/* Sleek, continuous ambient overlays consistent with host hero section */}
      <div className="absolute inset-0 -z-10 bg-black/15 pointer-events-none" />
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-accent/3 rounded-full blur-[120px] pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto w-full z-10 relative">
        
        {/* CAROUSEL GRID WORKSPACE */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center">
          
          {/* COLUMN LEFT (5/12 width) - MAJESTIC TEXT DETAIL */}
          <div className="lg:col-span-5 flex flex-col justify-center min-h-[280px]">
            <div className="flex flex-col gap-2 mb-6">
              <span className="text-accent text-[10px] sm:text-xs tracking-[0.25em] font-extrabold uppercase animate-pulse">
                // Dynamic Library
              </span>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-white uppercase leading-none">
                Latest Videos
              </h2>
            </div>

            {/* YouTube metrics */}
            <div className="mb-10 mt-2">
              <div className="flex gap-6 sm:gap-10 items-center justify-start flex-wrap">
                {[
                  { value: liveStats.subscriberCount, label: "ACTIVE\nSUBSCRIBERS", id: "yt-subs" },
                  { value: liveStats.videoCount, label: "EPISODES\nUPLOADED", id: "yt-videos" },
                  { value: liveStats.viewCount, label: "TOTAL\nVIEWS", id: "yt-views" },
                ].map((stat, idx) => (
                  <motion.div
                    key={stat.id}
                    custom={idx + 2}
                    variants={{
                      initial: { opacity: 0, y: 15 },
                      animate: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: (idx + 2) * 0.1 } }
                    }}
                    initial="initial"
                    animate="animate"
                    className="flex flex-col items-start text-left"
                  >
                    <div className="font-extrabold text-white flex items-start text-2xl sm:text-3xl md:text-4xl leading-none">
                      <span className="text-accent tracking-tighter mr-0.5 order-first">+</span>
                      <span>{stat.value}</span>
                    </div>
                    <div className="text-[9px] sm:text-[10px] font-bold tracking-widest text-[#a1a1aa] whitespace-pre-line leading-tight mt-1 uppercase">
                      {stat.label}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Clean UI Actions */}
            <div className="flex items-center gap-4">
              <a
                id="join-youtube-channel"
                href="https://www.youtube.com/@RenaMalikMD?sub_confirmation=1"
                target="_blank"
                rel="noopener noreferrer"
                className="px-8 py-3.5 rounded-full border border-accent bg-transparent hover:bg-accent hover:text-zinc-950 text-white text-xs font-bold tracking-widest uppercase transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2 cursor-pointer group"
              >
                SUBSCRIBE ON YOUTUBE
                <ArrowUpRight size={20} className="shrink-0 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </a>
            </div>
          </div>

          {/* COLUMN RIGHT (7/12 width) - PREMIUM 3D COVER FLOW */}
          <div 
            className="lg:col-span-7 relative w-full h-[300px] sm:h-[390px] flex items-center justify-center overflow-visible"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <motion.div 
              className="relative w-full h-full flex items-center justify-center cursor-grab active:cursor-grabbing select-none"
              style={{ touchAction: "pan-y" }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.2}
              onDragEnd={(event, info) => {
                const swipeThreshold = 50;
                if (info.offset.x < -swipeThreshold) {
                  // Swiped left -> next
                  setActiveIndex((prev) => (prev + 1) % activeShorts.length);
                } else if (info.offset.x > swipeThreshold) {
                  // Swiped right -> prev
                  setActiveIndex((prev) => (prev - 1 + activeShorts.length) % activeShorts.length);
                }
              }}
            >
              {activeShorts.map((short, i) => {
                const N = activeShorts.length;
                let diff = i - activeIndex;
                if (diff > N / 2) diff -= N;
                if (diff < -N / 2) diff += N;

                const isActive = diff === 0;
                const isLeft = diff === -1;
                const isRight = diff === 1;
                const isVisible = isActive || isLeft || isRight;

                // Motion positioning values
                const xTranslate = diff * (isMobile ? 100 : 170);
                const yTranslate = isActive ? 0 : (isMobile ? 18 : 28);
                const cardScale = isActive ? (isMobile ? 1.1 : 1.2) : (isMobile ? 0.8 : 0.85);
                const opacityVal = isActive ? 1.0 : (isVisible ? 0.55 : 0);
                const zVal = isActive ? 30 : 10;

                return (
                  <motion.div
                    key={`${short.id}-${i}`}
                    style={{
                      zIndex: zVal,
                      transformOrigin: "center center",
                      pointerEvents: isVisible ? "auto" : "none",
                    }}
                    animate={{
                      x: xTranslate,
                      y: yTranslate,
                      scale: cardScale,
                      opacity: opacityVal,
                    }}
                    transition={{
                      type: "spring",
                      stiffness: 300,
                      damping: 28,
                    }}
                    className="absolute w-[150px] sm:w-[190px] aspect-[9/16] shrink-0 rounded-lg overflow-hidden bg-zinc-900 shadow-2xl group cursor-pointer"
                    onClick={() => handleCardClick(i, isActive, short.id)}
                  >
                    {/* Cover flow video thumbnail preview */}
                    <img
                      referrerPolicy="no-referrer"
                      src={short.thumbnail}
                      alt={short.title}
                      className="w-full h-full object-cover pointer-events-none transition-transform duration-500 group-hover:scale-105"
                    />

                    {/* Faded play button/link overlay for the active card, hovering triggers glow */}
                    {isActive && (
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center z-20">
                        <div className="w-12 h-12 rounded-full bg-accent text-zinc-950 flex items-center justify-center shadow-2xl transform scale-90 group-hover:scale-100 transition-transform duration-300">
                          <Play size={18} className="fill-current ml-0.5" />
                        </div>
                        <span className="text-[10px] font-bold tracking-widest text-white uppercase mt-3">
                          WATCH SHORT
                        </span>
                      </div>
                    )}

                    {/* Gradient title overlay */}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/25 to-transparent p-4 pb-5 pt-10 flex flex-col justify-end z-10 pointer-events-none">
                      <h3 className="font-sans text-[11px] sm:text-[12px] uppercase font-semibold leading-snug tracking-wide text-white line-clamp-2">
                        {short.title.replace(/[\u{1F300}-\u{1F9FF}]/gu, "").trim()}
                      </h3>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>

        </div>

        {/* Normal YouTube Videos below the Shorts Carousel inside a unified section wrapper */}
        {activeVideos.length > 0 && (
          <div className="mt-10 sm:mt-12 pt-8 border-t border-zinc-800/10">
            <div 
              ref={scrollContainerRef}
              className="flex gap-6 overflow-x-auto pb-4 pt-2 snap-x snap-mandatory scrollbar-none [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden focus:outline-none"
              style={{ scrollSnapType: "x mandatory" }}
            >
              {activeVideos.map((vid) => {
                const isBlurred = blurredVideoId === vid.id;
                return (
                  <motion.div
                    key={vid.id}
                    className="w-[280px] sm:w-[340px] md:w-[400px] flex-shrink-0 snap-start flex flex-col gap-2 relative group cursor-pointer"
                    whileHover={{ y: -3 }}
                    transition={{ duration: 0.15 }}
                    onClick={() => setBlurredVideoId(prev => prev === vid.id ? null : vid.id)}
                  >
                    {/* 1. Headline Title prominently on top matching layout */}
                    <h3 className="text-sm sm:text-base md:text-lg font-semibold text-white tracking-tight leading-snug group-hover:text-accent transition-colors line-clamp-2 min-h-[40px] sm:min-h-[48px] md:min-h-[56px] normal-case pr-1 text-left">
                      {vid.title}
                    </h3>

                    {/* 2. Rounded video thumbnail on the bottom of text block */}
                    <div 
                      className="aspect-[16/9] w-full bg-neutral-900 rounded-lg overflow-hidden relative shadow-lg"
                    >
                      <img
                        referrerPolicy="no-referrer"
                        src={vid.thumbnail}
                        alt={vid.title}
                        className={`w-full h-full object-cover transition-all duration-500 ${
                          isBlurred ? "blur-[5px] brightness-[0.5] scale-[1.03]" : "group-hover:scale-[1.03]"
                        }`}
                      />
                      {/* Visual ambient mask */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/10" />

                      {/* Standard Link-on-blur Overlay - Consistent with YouTube Shorts UI */}
                      <div 
                        className={`absolute inset-0 flex flex-col items-center justify-center bg-black/50 transition-all duration-300 z-20 px-4 text-center ${
                          isBlurred ? "opacity-100 backdrop-blur-[2px]" : "opacity-0 pointer-events-none"
                        }`}
                      >
                        <a
                          href={`https://youtube.com/watch?v=${vid.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => {
                            e.stopPropagation(); // Avoid triggering card click handler again
                          }}
                          className="w-11 h-11 rounded-full bg-accent text-zinc-950 flex items-center justify-center shadow-2xl transform hover:scale-115 active:scale-95 transition-all duration-300 mb-2 cursor-pointer"
                          title="Watch on YouTube"
                        >
                          <ArrowUpRight size={18} className="stroke-[2.5]" />
                        </a>
                        <span className="text-[10px] uppercase font-bold text-white tracking-widest font-sans">
                          Watch on YouTube
                        </span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </section>
  );
}
