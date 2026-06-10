/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Shield, Save, Plus, Trash2, CheckCircle, AlertCircle, 
  Clock, FileText, Search, LogOut, ArrowLeft, Lock, User,
  Eye, EyeOff, Check, X, ArrowUpRight, ChevronLeft, Play, Pause,
  Calendar, Music, ExternalLink, MoreHorizontal, Volume2,
  Phone, Mail, MapPin, Facebook, Linkedin, Twitter, Instagram, Youtube, ChevronUp, Edit, Edit3, Sparkles,
  Mic, ArrowUp, Sliders, Undo, Database, RefreshCw, StopCircle, Loader2, Cpu
} from "lucide-react";
import { Episode } from "../types";

interface AdminPageProps {
  onBackToMain: () => void;
  currentPath?: string;
}

interface TimestampRow {
  time: string;
  label: string;
}

export default function AdminPage({ onBackToMain, currentPath }: AdminPageProps) {
  // Footer state
  const [footerEmail, setFooterEmail] = useState("");
  const [isFooterSubscribed, setIsFooterSubscribed] = useState(false);

  // Mobile Menu State
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Authentication State
  const [authToken, setAuthToken] = useState<string | null>(() => {
    return localStorage.getItem("rena_malik_admin_token");
  });
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Workspace State
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEpisodeId, setSelectedEpisodeId] = useState<string>(() => {
    const path = window.location.pathname;
    if (path.startsWith("/admin/episode/")) {
      return path.substring("/admin/episode/".length);
    }
    return "";
  });

  // Synchronize route with selectedEpisodeId on URL updates
  useEffect(() => {
    if (currentPath) {
      if (currentPath.startsWith("/admin/episode/")) {
        const id = currentPath.substring("/admin/episode/".length);
        if (selectedEpisodeId !== id) {
          setSelectedEpisodeId(id);
        }
      } else if (currentPath === "/admin") {
        if (selectedEpisodeId !== "") {
          setSelectedEpisodeId("");
        }
      }
    }
  }, [currentPath]);

  // Sync selectedEpisodeId back to browser location path
  useEffect(() => {
    if (authToken) {
      if (selectedEpisodeId) {
        const targetPath = `/admin/episode/${selectedEpisodeId}`;
        if (window.location.pathname !== targetPath) {
          window.history.pushState({}, "", targetPath);
        }
      } else {
        const targetPath = "/admin";
        if (window.location.pathname !== targetPath) {
          window.history.pushState({}, "", targetPath);
        }
      }
    }
  }, [selectedEpisodeId, authToken]);

  const [selectedCategory, setSelectedCategory] = useState("All");
  const [isExpanded, setIsExpanded] = useState(false);
  const [detailTab, setDetailTab] = useState<"notes" | "timestamps" | "transcript" | "links">("notes");

  // Audio Player State
  const [activeEpisode, setActiveEpisode] = useState<Episode | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.85);

  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  
  // Form State
  const [timestamps, setTimestamps] = useState<TimestampRow[]>([]);
  const [transcript, setTranscript] = useState<string>("");
  const [spotifyUrl, setSpotifyUrl] = useState<string>("");
  const [applePodcastsUrl, setApplePodcastsUrl] = useState<string>("");
  const [youtubeUrl, setYoutubeUrl] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");
  const [isLoadingMeta, setIsLoadingMeta] = useState(false);
  const [isEditingTimestamps, setIsEditingTimestamps] = useState(false);
  const [isEditingTranscript, setIsEditingTranscript] = useState(false);
  const [isEditingLinks, setIsEditingLinks] = useState(false);
  const [showConfirmDeleteTimestamps, setShowConfirmDeleteTimestamps] = useState(false);
  const [showConfirmDeleteTranscript, setShowConfirmDeleteTranscript] = useState(false);
  const [showConfirmDeleteLinks, setShowConfirmDeleteLinks] = useState(false);
  const [revealEditTabId, setRevealEditTabId] = useState<string | null>(null);

  // Gemini AI Integration States
  const [isGeneratingGemini, setIsGeneratingGemini] = useState(false);
  const [geminiError, setGeminiError] = useState<string | null>(null);
  const [geminiSuccess, setGeminiSuccess] = useState<boolean>(false);
  const [geminiStep, setGeminiStep] = useState<string>("");
  const [geminiModel, setGeminiModel] = useState<string>((import.meta as any).env?.VITE_GEMINI_MODEL || "gemini-3.5-flash");
  const [isGrabbingLinks, setIsGrabbingLinks] = useState(false);
  const [grabLinksStatus, setGrabLinksStatus] = useState<"idle" | "success" | "error" | "no-links">("idle");
  const [grabLinksDebugLogs, setGrabLinksDebugLogs] = useState<string[]>([]);
  const [showDebugConsole, setShowDebugConsole] = useState<boolean>(true);
  const [customPrompt, setCustomPrompt] = useState<string>(
    "Please transcribe this podcast or show episode audio file. Generate a detailed, highly accurate transcript with Speaker Names and Timestamps in brackets (e.g., [12:30] Guest Speaker: text...) and split paragraphs cleanly. Also, extract 4-8 distinct seeker-friendly chapters/segment timestamps with MM:SS formatted times and concise, elegant segment labels."
  );

  // Gemini AI Generation Progression Steps
  const GEMINI_STEPS = [
    "Establishing connection with server...",
    "Downloading episode audio from resource feed...",
    "Converting waveforms and scanning audio streams...",
    "Uploading secure audio source to Gemini Files API...",
    "Converting audio format and analyzing vocal tracks...",
    "Gemini is listening to dialogues and recognizing speakers...",
    "Deep-parsing medical terminology and clinical references...",
    "Drafting scrolling high-fidelity transcript text...",
    "Creating seeker-friendly seekable chapter timestamps...",
    "Structuring JSON data schema...",
    "Success! Polishing final metadata layout..."
  ];

  // AI Bulk Manager States
  const [showBulkManager, setShowBulkManager] = useState(false);
  const [metadataMap, setMetadataMap] = useState<Record<string, any>>({});
  const [isLoadingMetadataMap, setIsLoadingMetadataMap] = useState(false);

  const [bulkProcessingStatus, setBulkProcessingStatus] = useState<"idle" | "running" | "paused">("idle");
  const [bulkQueue, setBulkQueue] = useState<string[]>([]);
  const [bulkCurrentId, setBulkCurrentId] = useState<string | null>(null);
  const [bulkCurrentStep, setBulkCurrentStep] = useState<string>("");
  const [bulkResults, setBulkResults] = useState<Record<string, { success: boolean; error?: string; step?: string; chaptersCount?: number; transcriptSnippet?: string }>>({});

  const bulkQueueRef = React.useRef<string[]>([]);
  const bulkProcessingStatusRef = React.useRef<"idle" | "running" | "paused">("idle");

  useEffect(() => {
    bulkQueueRef.current = bulkQueue;
  }, [bulkQueue]);

  useEffect(() => {
    bulkProcessingStatusRef.current = bulkProcessingStatus;
  }, [bulkProcessingStatus]);

  // Load overall metadata map
  const fetchMetadataMap = async () => {
    if (!authToken) return;
    setIsLoadingMetadataMap(true);
    try {
      const response = await fetch("/api/episode-meta");
      if (response.ok) {
        const data = await response.json();
        setMetadataMap(data || {});
      }
    } catch (err) {
      console.error("Failed to fetch general metadata map:", err);
    } finally {
      setIsLoadingMetadataMap(false);
    }
  };

  useEffect(() => {
    if (authToken) {
      fetchMetadataMap();
    }
  }, [authToken]);

  // Helper to determine if an episode has metadata populated
  const getEpisodeMeta = (epId: string) => {
    const cleanId = epId.toString().replace("episode-", "").replace("rss-item-", "");
    const keys = [cleanId, `episode-${cleanId}`, `rss-item-${cleanId}`];
    for (const key of keys) {
      if (metadataMap[key]) {
        const meta = metadataMap[key];
        const hasTimestamps = Array.isArray(meta.timestamps) && meta.timestamps.length > 0;
        const hasTranscript = typeof meta.transcript === "string" && meta.transcript.length > 50;
        if (hasTimestamps || hasTranscript) {
          return meta;
        }
      }
    }
    return null;
  };

  const stopBulkProcessing = () => {
    bulkProcessingStatusRef.current = "paused";
    setBulkProcessingStatus("paused");
    setBulkCurrentId(null);
    setBulkCurrentStep("");
  };

  const startBulkProcessing = async (queue: string[]) => {
    if (queue.length === 0) return;
    
    bulkQueueRef.current = queue;
    setBulkQueue(queue);
    
    bulkProcessingStatusRef.current = "running";
    setBulkProcessingStatus("running");
    
    const freshResults = { ...bulkResults };
    queue.forEach(id => {
      if (!freshResults[id] || freshResults[id].success === false) {
        freshResults[id] = { success: false, step: "Waiting..." };
      }
    });
    setBulkResults(freshResults);

    let remaining = [...queue];
    while (remaining.length > 0) {
      if (bulkProcessingStatusRef.current !== "running") {
        break;
      }

      const nextId = remaining[0];
      setBulkCurrentId(nextId);
      
      const ep = episodes.find(e => e.id === nextId);
      if (!ep) {
        remaining.shift();
        setBulkQueue([...remaining]);
        bulkQueueRef.current = [...remaining];
        continue;
      }

      setBulkCurrentStep(GEMINI_STEPS[0]);
      setBulkResults(prev => ({
        ...prev,
        [nextId]: { success: false, step: GEMINI_STEPS[0], chaptersCount: 0 }
      }));

      let currentStepIdx = 0;
      const stepInterval = setInterval(() => {
        if (currentStepIdx < GEMINI_STEPS.length - 2) {
          currentStepIdx++;
          const nextStepText = GEMINI_STEPS[currentStepIdx];
          setBulkCurrentStep(nextStepText);
          setBulkResults(prev => ({
            ...prev,
            [nextId]: { success: false, step: nextStepText, chaptersCount: 0 }
          }));
        }
      }, 5500);

      try {
        const response = await fetch("/api/admin/generate-episode-meta", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${authToken}`
          },
          body: JSON.stringify({
            episodeId: ep.id,
            audioUrl: ep.audioUrl,
            prompt: customPrompt,
            title: ep.title,
            guid: ep.guid
          })
        });

        clearInterval(stepInterval);

        if (bulkProcessingStatusRef.current !== "running") {
          break;
        }

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.message || "Failed during Gemini generation.");
        }

        const chaptersCount = Array.isArray(result.timestamps) ? result.timestamps.length : 0;
        setBulkResults(prev => ({
          ...prev,
          [nextId]: { 
            success: true, 
            step: "Success! Saved to DB", 
            chaptersCount,
            transcriptSnippet: typeof result.transcript === "string" ? result.transcript.substring(0, 100) + "..." : ""
          }
        }));

        setMetadataMap(prev => ({
          ...prev,
          [nextId]: {
            timestamps: result.timestamps || [],
            transcript: result.transcript || ""
          }
        }));

      } catch (err: any) {
        clearInterval(stepInterval);
        setBulkResults(prev => ({
          ...prev,
          [nextId]: { 
            success: false, 
            step: "Failed", 
            error: err.message || "Unknown error occurred" 
          }
        }));
      }

      remaining.shift();
      setBulkQueue([...remaining]);
      bulkQueueRef.current = [...remaining];
    }

    setBulkCurrentId(null);
    setBulkCurrentStep("");
    setBulkProcessingStatus("idle");
    bulkProcessingStatusRef.current = "idle";
    window.dispatchEvent(new CustomEvent("episode-meta-updated"));
  };

  // Fetch model name configuration on mount
  useEffect(() => {
    fetch("/api/admin/config")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.geminiModel) {
          setGeminiModel(data.geminiModel);
        }
      })
      .catch((err) => {
        console.warn("Failed retrieving dynamic engine configurations:", err);
      });
  }, []);

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

  // Fetch all episodes if logged in
  useEffect(() => {
    if (authToken) {
      setSaveStatus("idle");
      fetch("/api/episodes")
        .then((res) => {
          if (!res.ok) throw new Error();
          return res.json();
        })
        .then((data) => {
          if (Array.isArray(data)) {
            setEpisodes(data);
          }
        })
        .catch(() => {
          console.error("Failed to load list of episodes.");
        });
    }
  }, [authToken]);

  // Fetch episode specific metadata whenever select changes
  useEffect(() => {
    if (authToken && selectedEpisodeId) {
      setIsLoadingMeta(true);
      setSaveStatus("idle");
      fetch(`/api/episode-meta/${selectedEpisodeId}`)
        .then((res) => res.json())
        .then((data) => {
          const loadedTimestamps = Array.isArray(data?.timestamps) ? data.timestamps : [];
          const loadedTranscript = typeof data?.transcript === "string" ? data.transcript : "";
          const loadedSpotify = typeof data?.spotifyUrl === "string" ? data.spotifyUrl : "";
          const loadedApple = typeof data?.applePodcastsUrl === "string" ? data.applePodcastsUrl : "";
          const loadedYoutube = typeof data?.youtubeUrl === "string" ? data.youtubeUrl : "";
          setTimestamps(loadedTimestamps);
          setTranscript(loadedTranscript);
          setSpotifyUrl(loadedSpotify);
          setApplePodcastsUrl(loadedApple);
          setYoutubeUrl(loadedYoutube);
        })
        .catch(() => {
          setTimestamps([]);
          setTranscript("");
          setSpotifyUrl("");
          setApplePodcastsUrl("");
          setYoutubeUrl("");
        })
        .finally(() => {
          setIsLoadingMeta(false);
        });
    }
  }, [selectedEpisodeId, authToken]);

  // Handle Tab resetting and metadata synchronizer
  useEffect(() => {
    if (selectedEpisodeId) {
      setDetailTab("notes");
      setIsEditingTimestamps(false);
      setIsEditingTranscript(false);
      setIsEditingLinks(false);
      setShowConfirmDeleteTimestamps(false);
      setShowConfirmDeleteTranscript(false);
      setShowConfirmDeleteLinks(false);
      setRevealEditTabId(null);
    }
  }, [selectedEpisodeId]);

  // Reset confirmation states when detailTab changes
  useEffect(() => {
    setShowConfirmDeleteTimestamps(false);
    setShowConfirmDeleteTranscript(false);
    setShowConfirmDeleteLinks(false);
  }, [detailTab]);

  // Reset list expansion state when filters shift
  useEffect(() => {
    setIsExpanded(false);
  }, [selectedCategory, searchQuery]);

  // Tab long press mechanism
  const longPressTimeoutRef = useRef<any>(null);
  const touchStartPosRef = useRef<{ x: number; y: number } | null>(null);
  const isLongPressActive = useRef(false);

  const handleTabPressStart = (e: React.MouseEvent | React.TouchEvent, tabId: string) => {
    // Detect starting coordinates to prevent accidental triggers while scrolling
    if ("touches" in e && e.touches.length > 0) {
      const touch = e.touches[0];
      touchStartPosRef.current = { x: touch.clientX, y: touch.clientY };
    } else {
      touchStartPosRef.current = null;
    }

    isLongPressActive.current = false;
    if (longPressTimeoutRef.current) clearTimeout(longPressTimeoutRef.current);

    longPressTimeoutRef.current = setTimeout(() => {
      isLongPressActive.current = true;
      setRevealEditTabId(tabId);
      
      // Gentle haptic feedback on supported device browsers
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate(40);
      }
      // Immediately clear other selections that could interfere with text
      if (typeof window !== "undefined" && window.getSelection) {
        window.getSelection()?.removeAllRanges();
      }
    }, 450); // Shorter duration feels much cleaner and snappy
  };

  const handleTabPressEnd = (e: React.MouseEvent | React.TouchEvent, tabId: string) => {
    if (longPressTimeoutRef.current) {
      clearTimeout(longPressTimeoutRef.current);
    }

    // Cancel interaction if user dragged finger too far
    if ("changedTouches" in e && e.changedTouches.length > 0 && touchStartPosRef.current) {
      const touch = e.changedTouches[0];
      const dx = touch.clientX - touchStartPosRef.current.x;
      const dy = touch.clientY - touchStartPosRef.current.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance > 15) {
        isLongPressActive.current = false;
        return;
      }
    }

    if (!isLongPressActive.current) {
      // Direct standard click to transition screen focus
      setDetailTab(tabId as any);
      setRevealEditTabId(null);
    }
  };

  const handleTabPressCancel = () => {
    if (longPressTimeoutRef.current) {
      clearTimeout(longPressTimeoutRef.current);
    }
  };

  // Direct Seek Helper
  const seekToTime = (seconds: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = seconds;
      setCurrentTime(seconds);
      setIsPlaying(true);
    }
  };

  // Play toggle helper
  const handlePlayToggle = (episode: Episode) => {
    if (activeEpisode?.id === episode.id) {
      setIsPlaying(!isPlaying);
    } else {
      setActiveEpisode(episode);
      setIsPlaying(true);
      setCurrentTime(0);
    }
  };

  // Apple-style relative date formatter
  const getRelativeDateLabel = (dateStr: string): string => {
    try {
      const pubDate = new Date(dateStr);
      if (isNaN(pubDate.getTime())) return dateStr;
      
      const now = new Date("2026-06-06T17:10:00Z"); // anchored reference
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

  // Scan explicit clinical categories
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

  // Utility to parse chapter timestamps
  const parseTimestampToSeconds = (timestampStr: string): number => {
    const parts = timestampStr.split(":").map(Number);
    if (parts.length === 3) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    } else if (parts.length === 2) {
      return parts[0] * 60 + parts[1];
    }
    return 0;
  };

  // Login handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsLoggingIn(true);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (response.ok && data.success && data.token) {
        localStorage.setItem("rena_malik_admin_token", data.token);
        setAuthToken(data.token);
        // Clear login form
        setUsername("");
        setPassword("");
      } else {
        setLoginError(data.message || data.error || "Invalid credentials. Please attempt again.");
      }
    } catch (err: any) {
      setLoginError(`Server communication failure: ${err.message || "Please verify the backend states."} (Visit /api/debug on your domain in a new tab to view live MongoDB & RSS feed diagnostics)`);
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Logout handler
  const handleLogout = () => {
    localStorage.removeItem("rena_malik_admin_token");
    setAuthToken(null);
    setSelectedEpisodeId("");
    setEpisodes([]);
  };

  // Add new row helper
  const addTimestampRow = () => {
    setTimestamps([...timestamps, { time: "00:00", label: "" }]);
  };

  // Remove timestamp row helper
  const removeTimestampRow = (index: number) => {
    setTimestamps(timestamps.filter((_, i) => i !== index));
  };

  // Update specific timestamp field
  const updateTimestampField = (index: number, key: keyof TimestampRow, value: string) => {
    const updated = [...timestamps];
    updated[index] = { ...updated[index], [key]: value };
    setTimestamps(updated);
  };

  // Filter episodes list matching categories and queries
  const filteredEpisodes = episodes.filter((ep) => {
    const matchesSearch = ep.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          ep.guest.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          ep.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          ep.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = selectedCategory === "All" || ep.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  // AI-powered generation with Gemini client API proxied safely
  const handleGenerateWithGemini = async (selectedEpisode: Episode) => {
    if (!selectedEpisode) return;
    setIsGeneratingGemini(true);
    setGeminiError(null);
    setGeminiSuccess(false);
    
    let currentStepIdx = 0;
    setGeminiStep(GEMINI_STEPS[0]);
    const stepInterval = setInterval(() => {
      if (currentStepIdx < GEMINI_STEPS.length - 2) {
        currentStepIdx++;
        setGeminiStep(GEMINI_STEPS[currentStepIdx]);
      }
    }, 8000);

    try {
      const response = await fetch("/api/admin/generate-episode-meta", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authToken}`
        },
        body: JSON.stringify({
          episodeId: selectedEpisode.id,
          audioUrl: selectedEpisode.audioUrl,
          prompt: customPrompt,
          title: selectedEpisode.title
        })
      });

      const result = await response.json();
      clearInterval(stepInterval);

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Something went wrong during Gemini generation.");
      }

      setGeminiStep("Success! Synchronizing metadata panels...");
      setTimestamps(result.timestamps || []);
      setTranscript(result.transcript || "");
      setSpotifyUrl(result.spotifyUrl || "");
      setApplePodcastsUrl(result.applePodcastsUrl || "");
      setYoutubeUrl(result.youtubeUrl || "");
      setGrabLinksDebugLogs(result.searchDebugLogs || []);
      setGeminiSuccess(true);
      
      // Auto-switch to chapters/timestamps view
      setDetailTab("timestamps");
      
      setTimeout(() => {
        setIsGeneratingGemini(false);
      }, 2000);

    } catch (err: any) {
      clearInterval(stepInterval);
      setGeminiError(err.message || "Failed to generate metadata details using Gemini.");
      setIsGeneratingGemini(false);
    }
  };

  const handleAutoGrabLinks = async () => {
    const selectedEpisode = episodes.find(e => e.id === selectedEpisodeId);
    if (!selectedEpisode || !authToken) return;
    setIsGrabbingLinks(true);
    setGrabLinksStatus("idle");
    setGrabLinksDebugLogs([]); // reset
    try {
      const response = await fetch("/api/admin/auto-grab-links", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authToken}`
        },
        body: JSON.stringify({
          title: selectedEpisode.title,
          guid: selectedEpisode.guid
        })
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to grab links");
      }

      const hasAnyLink = !!(result.spotifyUrl || result.applePodcastsUrl || result.youtubeUrl);
      
      setSpotifyUrl(result.spotifyUrl || "");
      setApplePodcastsUrl(result.applePodcastsUrl || "");
      setYoutubeUrl(result.youtubeUrl || "");
      setGrabLinksDebugLogs(result.debugLogs || []);
      
      setGrabLinksStatus(hasAnyLink ? "success" : "no-links");
      
      setTimeout(() => {
        setGrabLinksStatus("idle");
      }, 4000);
    } catch (err: any) {
      setGrabLinksStatus("error");
      setGrabLinksDebugLogs([`[error] Client-side failure calling /api/admin/auto-grab-links: ${err.message || err}`]);
      setTimeout(() => {
        setGrabLinksStatus("idle");
      }, 4000);
    } finally {
      setIsGrabbingLinks(false);
    }
  };

  // Submit Handler
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEpisodeId || !authToken) return;

    setIsSaving(true);
    setSaveStatus("idle");

    try {
      const validTimestamps = timestamps.filter(t => t.time.trim() && t.label.trim());

      const response = await fetch(`/api/episode-meta/${selectedEpisodeId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authToken}`
        },
        body: JSON.stringify({
          timestamps: validTimestamps,
          transcript,
          spotifyUrl,
          applePodcastsUrl,
          youtubeUrl
        })
      });

      if (!response.ok) {
        throw new Error();
      }

      setSaveStatus("success");
      setIsEditingTimestamps(false);
      setIsEditingTranscript(false);
      setIsEditingLinks(false);
      
      // Dispatch a custom event to notify update
      const event = new CustomEvent("episode-meta-updated");
      window.dispatchEvent(event);

      setTimeout(() => {
        setSaveStatus("idle");
      }, 3000);
    } catch (err) {
      setSaveStatus("error");
    } finally {
      setIsSaving(false);
    }
  };

  // Delete Timestamps handler
  const handleDeleteTimestamps = async () => {
    if (!selectedEpisodeId || !authToken) return;

    setIsSaving(true);
    setSaveStatus("idle");

    try {
      const response = await fetch(`/api/episode-meta/${selectedEpisodeId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authToken}`
        },
        body: JSON.stringify({
          timestamps: [],
          transcript,
          spotifyUrl,
          applePodcastsUrl,
          youtubeUrl
        })
      });

      if (!response.ok) {
        throw new Error();
      }

      setTimestamps([]);
      setSaveStatus("success");
      setIsEditingTimestamps(false);
      setShowConfirmDeleteTimestamps(false);

      const event = new CustomEvent("episode-meta-updated");
      window.dispatchEvent(event);

      setTimeout(() => {
        setSaveStatus("idle");
      }, 3000);
    } catch (err) {
      setSaveStatus("error");
    } finally {
      setIsSaving(false);
    }
  };

  // Delete Transcript handler
  const handleDeleteTranscript = async () => {
    if (!selectedEpisodeId || !authToken) return;

    setIsSaving(true);
    setSaveStatus("idle");

    try {
      const response = await fetch(`/api/episode-meta/${selectedEpisodeId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authToken}`
        },
        body: JSON.stringify({
          timestamps,
          transcript: "",
          spotifyUrl,
          applePodcastsUrl,
          youtubeUrl
        })
      });

      if (!response.ok) {
        throw new Error();
      }

      setTranscript("");
      setSaveStatus("success");
      setIsEditingTranscript(false);
      setShowConfirmDeleteTranscript(false);

      const event = new CustomEvent("episode-meta-updated");
      window.dispatchEvent(event);

      setTimeout(() => {
        setSaveStatus("idle");
      }, 3000);
    } catch (err) {
      setSaveStatus("error");
    } finally {
      setIsSaving(false);
    }
  };

  // Delete Platform Links handler
  const handleDeleteLinks = async () => {
    if (!selectedEpisodeId || !authToken) return;

    setIsSaving(true);
    setSaveStatus("idle");

    try {
      const response = await fetch(`/api/episode-meta/${selectedEpisodeId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authToken}`
        },
        body: JSON.stringify({
          timestamps,
          transcript,
          spotifyUrl: "",
          applePodcastsUrl: "",
          youtubeUrl: ""
        })
      });

      if (!response.ok) {
        throw new Error();
      }

      setSpotifyUrl("");
      setApplePodcastsUrl("");
      setYoutubeUrl("");
      setSaveStatus("success");
      setIsEditingLinks(false);
      setShowConfirmDeleteLinks(false);

      const event = new CustomEvent("episode-meta-updated");
      window.dispatchEvent(event);

      setTimeout(() => {
        setSaveStatus("idle");
      }, 3000);
    } catch (err) {
      setSaveStatus("error");
    } finally {
      setIsSaving(false);
    }
  };

  // Rendering 1: Login Form Page
  if (!authToken) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-4 min-h-[85vh] font-sans bg-page-bg text-zinc-300">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm bg-[#141416] border border-zinc-800/80 rounded-3xl shadow-2xl p-8 sm:p-10 flex flex-col relative overflow-hidden"
        >
          {/* Heading block */}
          <div className="flex flex-col items-center text-center mb-10 select-none">
            <h1 className="text-3xl sm:text-[36px] font-black text-white tracking-tight leading-tight">
              Welcome Back!
            </h1>
            <p className="text-zinc-500 text-xs sm:text-sm leading-normal mt-2">
              Enter Your Details Below
            </p>
          </div>

          <form onSubmit={handleLogin} className="flex flex-col gap-6">
            
            {/* Username/Email Input with elegant flat line design */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest select-none">
                Username
              </label>
              <input
                type="text"
                required
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-transparent border-b border-zinc-800 focus:border-[#9DAAF2] outline-none py-2 px-0 text-white placeholder-zinc-700 text-sm tracking-wide transition-colors focus:ring-0 rounded-none shadow-none"
              />
            </div>

            {/* Password Input with eye toggler and flat bottom-line style */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest select-none">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-transparent border-b border-zinc-800 focus:border-[#9DAAF2] outline-none py-2 pr-10 pl-0 text-white placeholder-zinc-750 text-sm tracking-wide transition-colors focus:ring-0 rounded-none shadow-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-0 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors cursor-pointer p-1.5 focus:outline-none"
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Options bar: Custom Checkbox and Forgot Handler */}
            <div className="flex items-center justify-between text-xs my-1 select-none">
              <label className="flex items-center gap-2 cursor-pointer text-zinc-400 hover:text-zinc-200 transition-colors">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="hidden"
                />
                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all duration-150 ${
                  rememberMe 
                    ? "bg-[#9DAAF2] border-[#9DAAF2] text-zinc-950" 
                    : "border-zinc-800 hover:border-zinc-650 bg-transparent text-transparent"
                }`}>
                  <Check size={11} className="stroke-[3.5]" />
                </div>
                <span>Remember me</span>
              </label>
              
              <button
                type="button"
                onClick={() => setLoginError("Please contact support at hello@renamalikmd.com for admin credentials.")}
                className="text-zinc-500 hover:text-[#F4DB7D] transition-colors font-semibold cursor-pointer"
              >
                Forgot credentials?
              </button>
            </div>

            {/* Error messaging block */}
            <AnimatePresence>
              {loginError && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-3.5 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl flex items-start gap-2 leading-relaxed"
                >
                  <AlertCircle size={14} className="shrink-0 mt-0.5 text-red-400" />
                  <span>{loginError}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Premium primary login button (sleek accent-blue pill) */}
            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full mt-4 py-3.5 rounded-full bg-accent-blue hover:bg-[#b2bdec] active:bg-[#8d9ceb] disabled:opacity-50 text-zinc-950 font-bold text-sm tracking-wide flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer shadow-lg hover:shadow-accent-blue/5 select-none"
            >
              {isLoggingIn ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-zinc-950 border-t-transparent animate-spin" />
                  Logging in...
                </>
              ) : (
                "Log in"
              )}
            </button>

            {/* Secondary Option Button: Return to podcast list */}
            <button
              type="button"
              onClick={onBackToMain}
              className="w-full py-3.5 rounded-full bg-[#1e1e21] hover:bg-[#252529] active:bg-[#1a1a1c] border border-zinc-800 hover:border-zinc-700 text-zinc-350 hover:text-white font-semibold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-[0.99] cursor-pointer shadow-md select-none mb-1"
            >
              <ArrowLeft size={13} />
              <span>Return to Podcasts</span>
            </button>
          </form>

          {/* Footer warning */}
          <div className="mt-8 text-center select-none">
            <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest flex items-center justify-center gap-1.5">
              <Lock size={10} className="text-zinc-700" />
              Protected Admin Panel
            </span>
          </div>

        </motion.div>
      </div>
    );
  }

  // Rendering 2: Full-screen Dashboard Page (Authenticated)
  const navLinks = [
    { name: "Story", href: "#about" },
    { name: "Expertise", href: "#expertise" },
    { name: "Studios", href: "#studios" },
    { name: "Feedback", href: "#feedback" }
  ];

  const handleNavLinkClick = (e: React.MouseEvent, href: string) => {
    e.preventDefault();
    setIsMenuOpen(false);
    onBackToMain();
    setTimeout(() => {
      window.location.hash = href;
    }, 120);
  };

  return (
    <div className="flex-1 w-full flex flex-col min-h-screen bg-page-bg font-sans">
      
      {/* GLOBAL NAVIGATION BAR MATCHING THE MAIN WEBSITE */}
      <nav
        id="main-nav-bar"
        className="w-full flex items-center justify-between px-5 sm:px-8 md:px-12 py-4 z-20 relative bg-[#1c1c1f]/80 backdrop-blur-md shrink-0 border-b border-zinc-800"
      >
        {/* Logo (pointing to main page) */}
        <button
          type="button"
          onClick={onBackToMain}
          className="w-8 h-8 rounded-full border-2 border-accent flex items-center justify-center select-none cursor-pointer hover:scale-[1.05] transition-transform animate-pulse"
          title="Return to home page"
        >
          <div className="w-2.5 h-2.5 rounded-full bg-accent" />
        </button>

        {/* Center Links (Visible md+) */}
        <div id="nav-links-desktop" className="hidden md:flex items-center gap-10 select-none">
          {navLinks.map((link) => (
            <a
              key={link.name}
              id={`nav-link-${link.name.toLowerCase()}`}
              href={link.href}
              onClick={(e) => handleNavLinkClick(e, link.href)}
              className="text-[14px] font-semibold text-zinc-300 hover:text-white tracking-widest transition-colors duration-300 relative group"
            >
              {link.name}
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-accent group-hover:w-full transition-all duration-300" />
            </a>
          ))}
        </div>

        {/* Right Actions & Buttons */}
        <div className="flex items-center gap-3 select-none">
          {/* Logout Button */}
          <button
            type="button"
            onClick={handleLogout}
            className="w-9 h-9 rounded-full bg-zinc-800/40 border border-zinc-800 hover:bg-red-500/10 hover:border-red-500/20 text-zinc-400 hover:text-red-400 flex items-center justify-center cursor-pointer transition-colors active:scale-95 duration-200"
            title="Logout"
          >
            <LogOut size={14} />
          </button>

          {/* Hamburger Menu Trigger */}
          <button
            id="hamburger-menu-btn"
            onClick={() => setIsMenuOpen(true)}
            className="w-9 h-9 rounded-full bg-white flex flex-col items-center justify-center gap-1 focus:outline-none cursor-pointer hover:bg-zinc-200 transition-colors active:scale-95 shrink-0"
            aria-label="Toggle Mobile Menu"
          >
            <span className="w-4 h-0.5 bg-black block" />
            <span className="w-4 h-0.5 bg-black block" />
            <span className="w-4 h-0.5 bg-black block" />
          </button>
        </div>
      </nav>

      {/* MOBILE MENU NAV OVERLAY FOR ADMIN PAGE */}
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
                  onClick={(e) => handleNavLinkClick(e, link.href)}
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
                  e.preventDefault();
                  setIsMenuOpen(false);
                  onBackToMain();
                  setTimeout(() => {
                    window.location.hash = "#feedback";
                  }, 120);
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

      {/* Main Panel Content Container */}
      <div className="flex-1 w-full max-w-5xl mx-auto px-5 sm:px-8 md:px-12 py-12 flex flex-col">
        {/* VIEW A: MULTI-EPISODE VAULT CATALOG DESIGN or AI BATCH PROCESSOR CONTROL ROOM */}
        {!selectedEpisodeId && showBulkManager ? (
          <div className="flex-1 flex flex-col gap-6 font-sans animate-fade-in">
            
            {/* Breadcrumb row */}
            <div className="flex items-center justify-between pb-4 border-b border-zinc-850/60 flex-wrap gap-4">
              <button
                onClick={() => {
                  stopBulkProcessing();
                  setShowBulkManager(false);
                }}
                className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white tracking-widest font-bold uppercase transition-colors cursor-pointer bg-transparent border-none"
              >
                <ChevronLeft size={16} />
                Back to Catalog
              </button>
              
              <span className="flex items-center gap-2 text-[10px] text-zinc-400 font-extrabold uppercase tracking-widest bg-zinc-900/60 border border-zinc-800 px-3 py-1 rounded-full">
                <Database size={12} className="text-[#9DAAF2]" />
                Auto-Archive Engine
              </span>
            </div>

            {/* Title & description */}
            <div className="flex flex-col gap-1">
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight uppercase">
                AI COGNITIVE BATCH PROCESSOR
              </h2>
              <p className="text-zinc-500 text-xs tracking-wider uppercase">
                Extract hi-fi dialogue transcriptions and chapters in a single automatic pass.
              </p>
            </div>

            {/* Premium, Slim Metrics Row */}
            {(() => {
              const total = episodes.length;
              const withMeta = episodes.filter(ep => getEpisodeMeta(ep.id) !== null);
              const withMetaCount = withMeta.length;
              const withoutMetaCount = total - withMetaCount;
              const progressPercent = total > 0 ? Math.round((withMetaCount / total) * 100) : 0;

              return (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-zinc-950/25 border border-zinc-850/50 rounded-xl p-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Archive Status</span>
                    <span className="text-sm font-extrabold text-white">
                      {withMetaCount} / {total} Saved <span className="text-[#9DAAF2] font-mono font-medium ml-1">({progressPercent}%)</span>
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Awaiting Curation</span>
                    <span className="text-sm font-extrabold text-amber-500">
                      {withoutMetaCount} Profiles Pending
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Selected Engine</span>
                    <span className="text-sm font-extrabold text-zinc-300">
                      {geminiModel.replace("-latest", "").replace("-preview", "")}
                    </span>
                  </div>
                </div>
              );
            })()}

            {/* Active Single-pass Processing Console */}
            {bulkProcessingStatus !== "idle" && (
              <div className="bg-zinc-950/50 border border-indigo-500/25 rounded-xl p-5 flex flex-col gap-4 shadow-[0_0_20px_rgba(157,170,242,0.05)]">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex flex-col gap-1 min-w-0">
                    <span className="text-[9px] text-[#9DAAF2] font-extrabold uppercase tracking-widest animate-pulse">
                      PROCESSING EPISODE {episodes.find(e => e.id === bulkCurrentId)?.number || "QUEUE"}
                    </span>
                    <h4 className="text-xs sm:text-sm font-extrabold text-white truncate max-w-lg">
                      {bulkCurrentId ? episodes.find(e => e.id === bulkCurrentId)?.title : "Initializing Transaction Stream..."}
                    </h4>
                  </div>

                  <button
                    type="button"
                    onClick={stopBulkProcessing}
                    className="flex items-center gap-1.5 bg-zinc-900 border border-red-500/25 text-red-400 hover:bg-red-500/10 hover:border-red-500/55 px-3.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-colors cursor-pointer"
                  >
                    <StopCircle size={12} />
                    <span>Cancel Processing</span>
                  </button>
                </div>

                {/* Progress Indicators matching individual episode generator exactly */}
                <div className="flex flex-col gap-1 bg-zinc-950/40 p-3 rounded-lg border border-zinc-850/40">
                  <div className="flex items-center justify-between text-[10px] text-zinc-400 font-bold tracking-wide">
                    <span className="uppercase text-[#9DAAF2] animate-pulse">Running extract scan...</span>
                    <span className="text-zinc-500 font-mono text-[10px]">{bulkCurrentStep}</span>
                  </div>
                  
                  <div className="w-full bg-zinc-900 rounded-full h-1 overflow-hidden mt-1.5">
                    <motion.div 
                      key={bulkCurrentId || "batch-progress"}
                      className="bg-[#9DAAF2] h-1 rounded-full shadow-[0_0_8px_#9DAAF2]"
                      initial={{ width: "5%" }}
                      animate={{ width: "95%" }}
                      transition={{ duration: 45, ease: "linear" }}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between mt-1.5 text-[9px] text-zinc-500 font-bold uppercase tracking-wider">
                    <span>Multi-modal wave synthesis in progress</span>
                    <span>{bulkQueue.length} Remaining in batch</span>
                  </div>
                </div>
              </div>
            )}

            {/* CONTROL PANEL CARD */}
            {bulkProcessingStatus === "idle" && (
              <div className="bg-zinc-950/25 border border-zinc-850/50 rounded-xl p-5 flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-1.5">
                    <Sliders size={12} className="text-[#9DAAF2]" />
                    Processor Controls
                  </h3>
                  <p className="text-zinc-500 text-[11px]">
                    Gemini will scan and generate records. It bypasses already curated profiles unless standard re-generation is forced below.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 mt-1">
                  {(() => {
                    const withoutMeta = episodes.filter(ep => getEpisodeMeta(ep.id) === null).map(ep => ep.id);
                    const allIds = episodes.map(ep => ep.id);

                    return (
                      <>
                        <button
                          type="button"
                          onClick={() => startBulkProcessing(withoutMeta)}
                          disabled={withoutMeta.length === 0}
                          className="flex items-center gap-2 bg-white hover:bg-zinc-200 disabled:bg-zinc-900 disabled:opacity-30 disabled:cursor-not-allowed text-black px-4 py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all hover:-translate-y-0.5"
                        >
                          <Sparkles size={12} className={withoutMeta.length > 0 ? "animate-pulse" : ""} />
                          <span>Process Missing Profiles ({withoutMeta.length})</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm("Are you absolutely sure you want to force re-generate ALL metadata? This will overwrite existing high-fidelity transcripts and notes with a fresh Gemini run.")) {
                              startBulkProcessing(allIds);
                            }
                          }}
                          className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 hover:bg-zinc-850 text-zinc-400 hover:text-white px-4 py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all hover:-translate-y-0.5"
                        >
                          <RefreshCw size={11} />
                          <span>Force Reprocess All ({allIds.length})</span>
                        </button>
                      </>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* DIRECTORY DOSSIER STATUS GRID LIST */}
            <div className="border border-zinc-850 bg-zinc-950/15 rounded-xl overflow-hidden flex flex-col">
              <div className="bg-zinc-950/40 border-b border-zinc-850 px-5 py-3.5 flex items-center justify-between">
                <span className="text-[10px] text-zinc-400 font-extrabold uppercase tracking-widest">
                  Indexed Video & Audio catalog ({episodes.length} Items Indexed)
                </span>
                <button
                  type="button"
                  onClick={fetchMetadataMap}
                  disabled={isLoadingMetadataMap}
                  className="p-1 px-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white text-[9px] font-bold uppercase tracking-widest rounded border border-zinc-800 cursor-pointer flex items-center gap-1.5 transition-colors"
                >
                  <RefreshCw size={9} className={isLoadingMetadataMap ? "animate-spin" : ""} />
                  <span>Sync DB state</span>
                </button>
              </div>

              <div className="divide-y divide-zinc-850/40 max-h-[480px] overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-800">
                {episodes.map((ep) => {
                  const hasMeta = getEpisodeMeta(ep.id) !== null;
                  const meta = getEpisodeMeta(ep.id);
                  const isCurrent = bulkCurrentId === ep.id;
                  const isQueued = bulkQueue.includes(ep.id);
                  const stepResult = bulkResults[ep.id];

                  return (
                    <div 
                      key={ep.id}
                      className={`flex flex-col transition-colors ${
                        isCurrent 
                          ? "bg-indigo-505/[0.03] border-l-2 border-[#9DAAF2]" 
                          : isQueued 
                          ? "bg-zinc-900/10" 
                          : "hover:bg-zinc-950/20"
                      }`}
                    >
                      <div className="px-5 py-3.5 flex items-center justify-between gap-6">
                        <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] text-[#9DAAF2] font-black uppercase tracking-wider shrink-0 bg-[#9DAAF2]/10 border border-[#9DAAF2]/20 px-1.5 py-[0.5px] rounded">
                              EP {ep.number}
                            </span>
                            <span className="text-[9px] text-zinc-500 font-bold tracking-wider uppercase">{ep.category}</span>
                          </div>
                          <h4 className="text-xs sm:text-sm font-extrabold text-white truncate max-w-[380px]" title={ep.title}>
                            {ep.title}
                          </h4>
                          <p className="text-[10px] text-zinc-500 truncate" title={ep.guest}>
                            Guest: <span className="text-zinc-400 font-medium">{ep.guest || "Rena Malik Solo"}</span>
                          </p>
                        </div>

                        {/* Status / Steps Detail */}
                        <div className="flex items-center gap-3 shrink-0">
                          {isCurrent ? (
                            <span className="inline-flex items-center gap-1.5 bg-[#9DAAF2]/10 border border-[#9DAAF2]/30 text-[#9DAAF2] text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full animate-pulse">
                              <Loader2 size={10} className="animate-spin" />
                              <span>Analysing Track</span>
                            </span>
                          ) : isQueued ? (
                            <span className="inline-flex items-center gap-1 bg-zinc-900 border border-zinc-800 text-zinc-500 text-[9px] font-bold uppercase px-2 py-0.5 rounded-full">
                              <span>Queued</span>
                            </span>
                          ) : stepResult?.success ? (
                            <span className="inline-flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full animate-fade-in">
                              <CheckCircle size={10} />
                              <span>Synced ({stepResult.chaptersCount} Ch)</span>
                            </span>
                          ) : stepResult?.success === false ? (
                            <div className="flex items-center gap-1.5">
                              <span className="inline-flex items-center gap-1 bg-red-500/10 border border-red-500/30 text-red-400 text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full">
                                <AlertCircle size={10} />
                                <span>Failed</span>
                              </span>
                              <span className="text-[9px] text-red-500 hidden sm:inline truncate max-w-[100px]" title={stepResult.error}>
                                {stepResult.error}
                              </span>
                            </div>
                          ) : hasMeta ? (
                            <span className="inline-flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400/80 text-[9px] font-semibold uppercase px-2 py-0.5 rounded-full">
                              <CheckCircle size={10} className="text-emerald-400" />
                              <span>Curated ({meta?.timestamps?.length || 0} Ch)</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 bg-zinc-900 border border-zinc-850 text-zinc-500 text-[9px] font-semibold uppercase px-2 py-0.5 rounded-full">
                              <span>Pending</span>
                            </span>
                          )}

                          {/* Line-level trigger button */}
                          {bulkProcessingStatus === "idle" && (
                            <button
                              type="button"
                              onClick={() => startBulkProcessing([ep.id])}
                              className="bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 hover:border-zinc-700 font-bold uppercase text-[9px] px-2 py-1 rounded transition-colors cursor-pointer shrink-0"
                            >
                              Extract
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Line-level Active Progress View EXACTLY matching individual episode generator! */}
                      {isCurrent && (
                        <div className="px-5 pb-3.5 pt-0 animate-fade-in">
                          <div className="flex flex-col gap-1.5 bg-zinc-950/60 p-3.5 border border-zinc-850/60 rounded-xl">
                            <div className="flex items-center justify-between text-[10px] text-zinc-400 font-bold tracking-wide">
                              <span className="uppercase tracking-widest text-[10px] text-[#9DAAF2] animate-pulse">Processing Stream...</span>
                              <span className="text-zinc-500 font-mono text-[10px]">{bulkCurrentStep}</span>
                            </div>
                            
                            <div className="w-full bg-zinc-900 rounded-full h-1 overflow-hidden mt-1">
                              <motion.div 
                                className="bg-[#9DAAF2] h-1 rounded-full shadow-[0_0_8px_#9DAAF2]"
                                initial={{ width: "5%" }}
                                animate={{ width: "95%" }}
                                transition={{ duration: 45, ease: "linear" }}
                              />
                            </div>
                            <span className="text-[9px] text-zinc-500 tracking-wider">Note: This is executing a deep multi-modal sound file scanner. Please leave browser tab open.</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        ) : !selectedEpisodeId && !showBulkManager ? (
          <div className="flex-1 flex flex-col">
            
            {/* Catalog Brand Display Header & Search row matching home page layout exactly */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
              <div className="flex flex-col gap-1.5 font-sans">
                <div 
                  className="flex items-center cursor-pointer text-white tracking-tight"
                  onClick={() => setSelectedCategory("All")}
                >
                  <h2 className="text-2xl sm:text-3.5xl font-extrabold text-white uppercase tracking-wider">
                    Episodes
                  </h2>
                </div>
                <p className="text-zinc-500 text-xs tracking-wider uppercase font-semibold">
                  Explore the Complete Clinical & Wellness Vault (Curator Panel)
                </p>
              </div>

              {/* Action and Search Row */}
              <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
                <button
                  type="button"
                  onClick={() => setShowBulkManager(true)}
                  className="flex items-center gap-2 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 hover:from-indigo-500/35 hover:to-purple-500/35 border border-indigo-400/30 hover:border-indigo-400/50 text-[#C4D0FF] shadow-[0_0_15px_rgba(99,102,241,0.15)] px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all hover:-translate-y-0.5"
                >
                  <Sparkles size={13} className="animate-pulse text-[#b1c0fc]" />
                  <span>AI Bulk Manager</span>
                </button>

                {/* Smart Search Bar */}
                <div className="relative w-full md:w-64">
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
            </div>

            {/* Catalog Grid View List matching homepage style */}
            <div className="flex flex-col">
              {filteredEpisodes.length === 0 ? (
                <div className="py-24 text-center select-none bg-[#141416]/20 border border-dashed border-zinc-800 rounded-3xl">
                  <span className="text-xs text-zinc-500 font-bold uppercase tracking-widest block">
                    No clinical episode dossiers match your selection parameters.
                  </span>
                </div>
              ) : (
                filteredEpisodes.slice(0, isExpanded ? undefined : 20).map((ep) => {
                  const isCurrent = activeEpisode?.id === ep.id;
                  const isCurPlaying = isCurrent && isPlaying;
                  const hasExplicit = hasExplicitContent(ep);
                  const relativeLabel = getRelativeDateLabel(ep.publishedAt);

                  return (
                    <div
                      key={ep.id}
                      id={`episode-row-${ep.id}`}
                      className="py-6 border-b border-zinc-800/50 last:border-b-0 cursor-pointer group flex flex-col gap-2 transition-opacity hover:opacity-95"
                      onClick={() => setSelectedEpisodeId(ep.id)}
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
                        <span className="text-[#9DAAF2]/90 tracking-wide font-extrabold">{ep.category}</span>
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
                      </div>

                    </div>
                  );
                })
              )}
            </div>

            {/* Toggle show-all block */}
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
        ) : (
          /* VIEW B: INTEGRATED BEAUTIFUL EPISODE EDIT & METADATA VIEW */
          (() => {
            const selectedEpisode = episodes.find(e => e.id === selectedEpisodeId);
            if (!selectedEpisode) return null;

            return (
              <div className="flex-1 flex flex-col gap-8">
                
                {/* Back Flow Breadcrumb matching EpisodesSection details view */}
                <div className="flex items-center justify-between pb-6 border-b border-zinc-800/65 flex-wrap gap-4">
                  <button
                    onClick={() => setSelectedEpisodeId("")}
                    className="flex items-center gap-1.5 text-xs text-[#9DAAF2] hover:text-white tracking-widest font-bold uppercase transition-colors cursor-pointer bg-transparent border-none"
                  >
                    <ChevronLeft size={16} />
                    All Episodes
                  </button>
                  
                  <span className="text-[10px] text-zinc-500 font-extrabold uppercase tracking-widest bg-zinc-900/60 border border-zinc-850 px-3 py-1.5 rounded-lg">
                    EPISODE #{selectedEpisode.number}
                  </span>
                </div>

                {/* Header Title Metadata details block */}
                <div className="flex flex-col gap-4">
                  <div className="flex flex-wrap items-center gap-2.5 text-xs text-zinc-400 font-semibold uppercase tracking-wider">
                    <span>{getRelativeDateLabel(selectedEpisode.publishedAt)}</span>
                    {hasExplicitContent(selectedEpisode) && (
                      <span className="inline-flex items-center justify-center bg-[#1d1d1f] text-[#a1a1a6] text-[10px] font-extrabold px-1.5 py-[0.5px] rounded-sm tracking-normal leading-none" title="Explicit Content">
                        E
                      </span>
                    )}
                    <span className="text-zinc-650">•</span>
                    <span className="text-[#9DAAF2]">{selectedEpisode.category}</span>
                  </div>

                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-tight uppercase font-sans">
                    {selectedEpisode.title}
                  </h1>

                  {/* Elegant featured guest card block */}
                  <div className="flex items-center gap-3.5 p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/70 my-1">
                    <div className="w-10 h-10 rounded-full bg-zinc-850 border border-zinc-800 flex items-center justify-center text-[#9DAAF2] font-extrabold text-sm select-none">
                      {selectedEpisode.guest.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[9px] text-[#9DAAF2] tracking-wider uppercase font-extrabold">FEATURING EXPERT</span>
                      <span className="text-sm font-bold text-white tracking-wide mt-0.5">{selectedEpisode.guest}</span>
                      <span className="text-xs text-zinc-500 font-normal mt-0.5">{selectedEpisode.guestTitle}</span>
                    </div>
                  </div>
                </div>

                {/* Unified AI Assistant Panel with Gemini */}
                <div className="flex flex-col gap-5 mt-4 mb-2 z-10">
                  {/* Greeting header row from the screenshot */}
                  <div className="flex flex-col gap-1.5 animate-fade-in select-none">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-[#5E0ED7] to-[#9DAAF2] flex items-center justify-center text-white shrink-0 shadow-md">
                        <Sparkles size={12} className="text-white fill-current" />
                      </div>
                      <span className="text-sm font-extrabold text-[#9DAAF2]/85 tracking-widest uppercase">Hi Rena</span>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight uppercase">
                      What's the opening move?
                    </h3>
                  </div>

                  {/* Gorgeous main prompt wrapper with glowing gradient border */}
                  <div className="relative rounded-2xl p-[1px] bg-gradient-to-r from-[#5E0ED7]/40 via-[#9DAAF2]/50 to-zinc-800/60 shadow-[0_0_25px_-5px_rgba(94,14,215,0.15)] focus-within:shadow-[0_0_30px_-2px_rgba(157,170,242,0.25)] transition-all duration-300">
                    <div className="rounded-2xl bg-[#141416] p-4 flex flex-col gap-3 min-h-[170px]">
                      {/* Top bar indicating selected model */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 cursor-pointer">
                          <span className="text-[10px] text-zinc-400 font-bold">Ask</span>
                          <span className="text-[10px] text-[#9DAAF2] font-black tracking-widest bg-[#9DAAF2]/10 border border-[#9DAAF2]/20 px-2.5 py-0.5 rounded-md hover:bg-[#9DAAF2]/15 transition-colors uppercase">
                            {geminiModel} ▾
                          </span>
                        </div>
                      </div>

                      {/* Translucent textarea for inline prompt editing */}
                      <textarea
                        value={customPrompt}
                        onChange={(e) => setCustomPrompt(e.target.value)}
                        placeholder="Customize the prompt for Gemini here..."
                        disabled={isGeneratingGemini}
                        rows={3}
                        className="w-full bg-transparent border-0 resize-none text-zinc-300 text-xs sm:text-sm font-normal focus:outline-none focus:ring-0 leading-relaxed scrollbar-thin scrollbar-thumb-zinc-850 placeholder:text-zinc-650"
                      />

                      {/* Action buttons footer inside the container matching screenshot layout */}
                      <div className="flex items-center justify-between pt-1 mt-auto">
                        <div className="flex items-center gap-2">
                          {selectedEpisode.audioUrl && (
                            <div 
                              className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-950 border border-zinc-850 text-xs text-[#9DAAF2] font-semibold tracking-wide transition-all"
                              title={selectedEpisode.audioUrl}
                            >
                              <Music size={12} className="text-[#9DAAF2]/80 shrink-0 animate-pulse" />
                              <span className="truncate max-w-[280px] lowercase font-mono">{selectedEpisode.audioUrl.split('/').pop()}</span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleGenerateWithGemini(selectedEpisode)}
                            disabled={isGeneratingGemini || !customPrompt.trim()}
                            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center bg-white text-black hover:bg-zinc-200 disabled:opacity-30 disabled:hover:bg-white active:scale-95 transition-all cursor-pointer shadow-lg"
                            title="Trigger Gemini Generation"
                          >
                            {isGeneratingGemini ? (
                              <div className="w-4 h-4 rounded-full border-2 border-black border-t-transparent animate-spin" />
                            ) : (
                              <ArrowUp size={16} className="text-black" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Floating presets pills underneath the container matching screenshot options */}
                  <div className="flex items-center gap-2 flex-wrap select-none">
                    <button
                      type="button"
                      onClick={() => setCustomPrompt("Please transcribe this podcast or show episode audio file. Generate a detailed, highly accurate transcript with Speaker Names and Timestamps in brackets (e.g., [12:30] Guest Speaker: text...) and split paragraphs cleanly. Also, extract 4-8 distinct seeker-friendly chapters/segment timestamps with MM:SS formatted times and concise, elegant segment labels.")}
                      className="px-3.5 py-1.5 rounded-full bg-zinc-900/70 border border-zinc-850 hover:bg-zinc-800 hover:border-zinc-700 text-[11px] text-zinc-400 hover:text-white font-medium tracking-wide transition-all cursor-pointer active:scale-95"
                    >
                      Chapters & Transcript
                    </button>
                    <button
                      type="button"
                      onClick={() => setCustomPrompt("Extract the main clinical medical topics, actionable health advice, and key summaries from Dr. Rena Malik and her guest. Format these takeaways into MM:SS timestamps and draft a premium educational transcript.")}
                      className="px-3.5 py-1.5 rounded-full bg-zinc-900/70 border border-zinc-850 hover:bg-zinc-800 hover:border-zinc-700 text-[11px] text-zinc-400 hover:text-white font-medium tracking-wide transition-all cursor-pointer active:scale-95"
                    >
                      Structured Medical Insights
                    </button>
                    <button
                      type="button"
                      onClick={() => setCustomPrompt("Analyze speech transitions to generate 8-12 beautiful search-ready chapter timestamps with concise summaries for this segment. Optimize specifically for YouTube and RSS feeds, and draft a high-level transcript overview.")}
                      className="px-3.5 py-1.5 rounded-full bg-zinc-900/70 border border-zinc-850 hover:bg-zinc-800 hover:border-zinc-700 text-[11px] text-zinc-400 hover:text-white font-medium tracking-wide transition-all cursor-pointer active:scale-95"
                    >
                      Extract Chapters Only
                    </button>
                    <button
                      type="button"
                      onClick={() => setCustomPrompt("Focus heavily on professional transcription of this show. Generate speaker diarization, highlighting the main discussion topics with speaker tags and precise timestamps in bracket format [MM:SS].")}
                      className="px-3.5 py-1.5 rounded-full bg-zinc-900/70 border border-zinc-850 hover:bg-zinc-800 hover:border-zinc-700 text-[11px] text-zinc-400 hover:text-white font-medium tracking-wide transition-all cursor-pointer active:scale-95"
                    >
                      High-Fidelity Dialogue
                    </button>
                  </div>

                  {/* AI Status / Processing States integrated elegantly */}
                  {(geminiError || geminiSuccess || isGeneratingGemini) && (
                    <div className="pt-2 mt-1 flex flex-col gap-3">
                      {geminiError && (
                        <div className="text-xs font-bold text-red-400 bg-red-950/10 border border-red-900/30 px-4 py-3 rounded-xl flex items-start gap-2.5 leading-relaxed animate-fade-in">
                          <AlertCircle size={15} className="shrink-0 text-red-400 mt-0.5" />
                          <div>
                            <span className="block font-black uppercase tracking-wider text-[10px] text-red-500 mb-0.5">Generation Failed</span>
                            <span>{geminiError}</span>
                          </div>
                        </div>
                      )}

                      {geminiSuccess && (
                        <div className="text-xs font-bold text-emerald-400 bg-emerald-950/10 border border-emerald-900/30 px-4 py-3 rounded-xl flex items-start gap-2.5 leading-relaxed animate-fade-in">
                          <CheckCircle size={15} className="shrink-0 text-emerald-400 mt-0.5" />
                          <div>
                            <span className="block font-black uppercase tracking-wider text-[10px] text-emerald-500 mb-0.5">Success</span>
                            <span>High-fidelity transcript, chapter timestamps & platform links auto-fetched using Gemini Search Grounding successfully. Please review the populated metadata panels, then lock the details using the "SAVE" action.</span>
                          </div>
                        </div>
                      )}

                      {isGeneratingGemini && (
                        <div className="flex flex-col gap-2.5 bg-zinc-950/40 p-4 border border-zinc-850/60 rounded-xl">
                          <div className="flex items-center justify-between text-xs text-zinc-400 font-bold tracking-wide">
                            <span className="uppercase tracking-widest text-[10px] text-[#9DAAF2] animate-pulse">Processing Stream...</span>
                            <span className="text-zinc-500 font-mono text-[10px]">{geminiStep}</span>
                          </div>
                          
                          <div className="w-full bg-zinc-900 rounded-full h-1 overflow-hidden mt-1">
                            <motion.div 
                              className="bg-[#9DAAF2] h-1 rounded-full shadow-[0_0_8px_#9DAAF2]"
                              initial={{ width: "5%" }}
                              animate={{ width: "95%" }}
                              transition={{ duration: 55, ease: "linear" }}
                            />
                          </div>
                          <span className="text-[10px] text-zinc-500 tracking-wider">Note: This analyzes full multi-modal sound waves. You can safely let it process.</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Feedback status lines */}
                <AnimatePresence>
                  {saveStatus !== "idle" && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      {saveStatus === "success" && (
                        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wide rounded-xl flex items-center gap-2">
                          <CheckCircle size={14} />
                          <span>Episode Metadata details synchronized successfully!</span>
                        </div>
                      )}
                      {saveStatus === "error" && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold uppercase tracking-wide rounded-xl flex items-center gap-2">
                          <AlertCircle size={14} />
                          <span>Unable to save data. Please check authorization token credentials.</span>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Tab layout switching hubs (Show Notes, Chapters Timestamps, Interactive Transcript) */}
                <div className="flex flex-col gap-6">

                  {/* Tabs Row (no separator line below the tabs) */}
                  <div className="flex items-center justify-between gap-4 mt-2 pb-2">
                    <div className="flex items-end gap-6 overflow-x-auto whitespace-nowrap pt-10 pb-1.5 scrollbar-none max-w-full relative">
                      {[
                        { id: "notes", name: "Notes" },
                        { id: "timestamps", name: "Timestamps" },
                        { id: "transcript", name: "Transcript" },
                        { id: "links", name: "Platform Links" }
                      ].map((tab) => {
                        const isEditable = ["timestamps", "transcript", "links"].includes(tab.id);
                        const isRevealed = revealEditTabId === tab.id;
                        return (
                          <div
                            key={tab.id}
                            className="relative flex flex-col items-center select-none"
                            onContextMenu={(e) => e.preventDefault()}
                            style={{
                              WebkitTouchCallout: "none",
                              WebkitUserSelect: "none",
                              userSelect: "none"
                            }}
                          >
                            <button
                              type="button"
                              onMouseDown={(e) => handleTabPressStart(e, tab.id)}
                              onTouchStart={(e) => handleTabPressStart(e, tab.id)}
                              onMouseUp={(e) => handleTabPressEnd(e, tab.id)}
                              onTouchEnd={(e) => handleTabPressEnd(e, tab.id)}
                              onMouseLeave={handleTabPressCancel}
                              onTouchCancel={handleTabPressCancel}
                              style={{
                                WebkitUserSelect: "none",
                                WebkitTouchCallout: "none",
                                userSelect: "none"
                              }}
                              className={`pb-1 text-xs font-bold uppercase tracking-widest transition-all cursor-pointer relative select-none outline-none ${
                                detailTab === tab.id 
                                  ? "text-white font-extrabold" 
                                  : "text-zinc-500 hover:text-zinc-300"
                              }`}
                              title={isEditable ? "Hold to edit" : undefined}
                            >
                              {tab.name}
                              {detailTab === tab.id && (
                                <motion.div
                                  layoutId="activeTabUnderline"
                                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#9DAAF2]"
                                />
                              )}
                            </button>

                            {isRevealed && isEditable && (
                              <motion.button
                                initial={{ scale: 0.8, opacity: 0, y: 5 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                exit={{ scale: 0.8, opacity: 0, y: 5 }}
                                type="button"
                                onMouseDown={(e) => e.stopPropagation()}
                                onTouchStart={(e) => e.stopPropagation()}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDetailTab(tab.id as any);
                                  if (tab.id === "timestamps") setIsEditingTimestamps(true);
                                  if (tab.id === "transcript") setIsEditingTranscript(true);
                                  if (tab.id === "links") setIsEditingLinks(true);
                                  setRevealEditTabId(null);
                                }}
                                className="absolute -top-9 left-1/2 -translate-x-1/2 z-50 px-2.5 py-1.5 rounded-full bg-[#9DAAF2] hover:bg-[#b5c2ff] text-zinc-950 text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 cursor-pointer leading-none whitespace-nowrap shadow-xl"
                                style={{
                                  WebkitUserSelect: "none",
                                  WebkitTouchCallout: "none",
                                  userSelect: "none"
                                }}
                                title={`Edit ${tab.name}`}
                              >
                                <Edit size={10} />
                                EDIT
                              </motion.button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Active tab body views */}
                  <div className="min-h-[300px]">
                    {isLoadingMeta ? (
                      <div className="flex flex-col items-center justify-center py-24 text-xs font-bold tracking-widest text-zinc-500 uppercase gap-3">
                        <div className="w-5 h-5 rounded-full border-2 border-zinc-800 border-t-[#9DAAF2] animate-spin" />
                        <span>Fetching saved records...</span>
                      </div>
                    ) : (
                      <>
                        {detailTab === "notes" && (
                          <div className="flex flex-col gap-4 font-sans text-xs sm:text-sm text-zinc-300 leading-relaxed pt-2">
                            {selectedEpisode.description.split("\n").map((line, index) => {
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

                        {detailTab === "timestamps" && (
                          <div className="flex flex-col gap-4 font-sans text-xs sm:text-sm text-zinc-300 leading-relaxed pt-2">
                            {isEditingTimestamps ? (
                              <div className="flex flex-col gap-4">
                                {timestamps.length === 0 ? (
                                  <div className="p-8 border border-dashed border-zinc-850 text-center rounded-2xl text-zinc-500 text-xs py-14 select-none">
                                    No chapter markers currently configured. Click "+ Add Timestamp Marker" to create elegant, seekable segments!
                                  </div>
                                ) : (
                                  <div className="space-y-3 pr-1">
                                    {timestamps.map((item, index) => (
                                      <div key={index} className="flex gap-2.5 items-center bg-[#151517] p-2 rounded-xl border border-zinc-800/40">
                                        {/* Chapter Time */}
                                        <input
                                          type="text"
                                          value={item.time}
                                          placeholder="00:00"
                                          onChange={(e) => updateTimestampField(index, "time", e.target.value)}
                                          className="w-20 px-3 py-2 bg-[#1C1C1E] border border-zinc-800 focus:border-[#9DAAF2] text-xs font-black tracking-wider text-[#9DAAF2] text-center rounded-lg outline-none focus:ring-0 shadow-none border-t border-b border-l border-r"
                                        />
                                        {/* Topic Segment */}
                                        <input
                                          type="text"
                                          value={item.label}
                                          placeholder="Curate segment topic or title..."
                                          onChange={(e) => updateTimestampField(index, "label", e.target.value)}
                                          className="flex-1 px-3 py-2 bg-[#1C1C1E] border border-zinc-800 focus:border-[#9DAAF2] text-xs text-zinc-200 placeholder-zinc-700 rounded-lg outline-none focus:ring-0 leading-none shadow-none border-t border-b border-l border-r"
                                        />
                                        
                                        {/* Actions */}
                                        <button
                                          type="button"
                                          onClick={() => removeTimestampRow(index)}
                                          className="p-2 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 cursor-pointer transition-colors"
                                          title="Delete segment row"
                                        >
                                          <Trash2 size={13} />
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {/* Editor Save & Cancel buttons directly below editing area */}
                                <div className="flex items-center gap-3 mt-4 pt-2 flex-wrap">
                                  <button
                                    type="button"
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    className="px-6 py-2.5 rounded-full bg-[#9DAAF2] hover:bg-[#b2bdec] disabled:opacity-40 text-zinc-950 font-black text-xs uppercase tracking-widest flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-md select-none"
                                  >
                                    {isSaving ? (
                                      <>
                                        <div className="w-3 h-3 rounded-full border-2 border-zinc-950 border-t-transparent animate-spin" />
                                        Saving...
                                      </>
                                    ) : (
                                      <>
                                        <Save size={12} />
                                        SAVE
                                      </>
                                    )}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={addTimestampRow}
                                    className="px-5 py-2.5 rounded-full border border-[#9DAAF2]/30 bg-[#9DAAF2]/5 hover:bg-[#9DAAF2]/10 text-[#9DAAF2] font-bold text-xs uppercase tracking-widest transition-all cursor-pointer flex items-center gap-1 shadow-sm leading-none"
                                    title="Add new timestamp segment row"
                                  >
                                    <Plus size={12} />
                                    Add Row
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setIsEditingTimestamps(false);
                                      setShowConfirmDeleteTimestamps(false);
                                    }}
                                    className="px-5 py-2.5 rounded-full border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white font-bold text-xs uppercase tracking-widest transition-all cursor-pointer select-none"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setShowConfirmDeleteTimestamps(true)}
                                    disabled={isSaving}
                                    className="px-5 py-2.5 rounded-full border border-zinc-800 hover:border-red-500 hover:bg-red-500/5 text-zinc-400 hover:text-red-400 font-bold text-xs uppercase tracking-widest transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-40 select-none text-[11px]"
                                    title="Delete Timestamps"
                                  >
                                    <Trash2 size={12} />
                                    DELETE
                                  </button>
                                </div>
                              </div>
                            ) : (
                              /* Display Chapters Identical to Homepage */
                              <>
                                {timestamps && timestamps.length > 0 ? (
                                  timestamps.map((stamp, index) => (
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
                                  <div className="p-8 border border-dashed border-zinc-850 text-center rounded-xl py-12 flex flex-col items-center justify-center gap-4 animate-none">
                                    <span className="w-10 h-10 rounded-full bg-accent-blue/15 flex items-center justify-center text-[#9DAAF2]">
                                      <Clock size={18} />
                                    </span>
                                    <div className="flex flex-col gap-1 max-w-sm">
                                      <span className="text-xs text-zinc-400 font-bold uppercase tracking-wider">No Timestamps Prepared</span>
                                      <p className="text-xs text-zinc-555 leading-relaxed normal-case">
                                        This episode does not have high-precision chapter-marker timestamps configured yet. Click "Edit Timestamps" above to specify segments.
                                      </p>
                                    </div>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        )}

                        {detailTab === "transcript" && (
                          <div className="flex flex-col gap-4 font-sans text-xs sm:text-sm text-zinc-300 leading-relaxed pt-2">
                            {isEditingTranscript ? (
                              <div className="flex flex-col gap-4">
                                <textarea
                                  value={transcript}
                                  onChange={(e) => setTranscript(e.target.value)}
                                  placeholder="Type or paste dynamic text scripts. Use double space to define speech bubbles.&#13;&#10;&#13;&#10;Reference syntax format:&#13;&#10;[00:00] Dr. Rena Malik: Welcome back to clinic sexology...&#13;&#10;&#13;&#10;[04:20] Expert Guest: Reproductive safety details..."
                                  rows={15}
                                  className="w-full rounded-2xl bg-[#151517] border border-[#2d2d30] focus:border-[#9DAAF2] p-4 text-xs sm:text-sm text-zinc-200 placeholder-zinc-750/80 focus:outline-none focus:ring-0 leading-relaxed font-sans resize-none"
                                />

                                {/* Editor Save & Cancel buttons directly below editing area */}
                                <div className="flex items-center gap-3 mt-4 pt-2 flex-wrap">
                                  <button
                                    type="button"
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    className="px-6 py-2.5 rounded-full bg-[#9DAAF2] hover:bg-[#b2bdec] disabled:opacity-40 text-zinc-950 font-black text-xs uppercase tracking-widest flex items-center gap-2 transition-all active:scale-95 cursor-pointer shadow-md"
                                  >
                                    {isSaving ? (
                                      <>
                                        <div className="w-3 h-3 rounded-full border-2 border-zinc-950 border-t-transparent animate-spin" />
                                        Saving...
                                      </>
                                    ) : (
                                      <>
                                        <Save size={12} />
                                        SAVE
                                      </>
                                    )}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setIsEditingTranscript(false)}
                                    className="px-5 py-2.5 rounded-full border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white font-bold text-xs uppercase tracking-widest transition-all cursor-pointer"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setShowConfirmDeleteTranscript(true)}
                                    disabled={isSaving}
                                    className="px-5 py-2.5 rounded-full border border-zinc-800 hover:border-red-500 hover:bg-red-500/5 text-zinc-400 hover:text-red-400 font-bold text-xs uppercase tracking-widest transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-40"
                                    title="Delete Transcript"
                                  >
                                    <Trash2 size={12} />
                                    DELETE
                                  </button>
                                </div>
                              </div>
                            ) : (
                              /* Display Transcript Identical to Homepage split by newline */
                              <>
                                {transcript ? (
                                  <div className="flex flex-col gap-4 pr-1">
                                    {transcript.split("\n").map((line, index) => {
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
                                                handlePlayToggle(selectedEpisode);
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
                                  <div className="p-8 border border-dashed border-zinc-805 text-center rounded-xl py-12 flex flex-col items-center justify-center gap-4 animate-none">
                                    <span className="w-10 h-10 rounded-full bg-accent-blue/15 flex items-center justify-center text-[#9DAAF2]">
                                      <FileText size={18} />
                                    </span>
                                    <div className="flex flex-col gap-1 max-w-sm">
                                      <span className="text-xs text-zinc-400 font-bold uppercase tracking-wider">No Transcript Prepared</span>
                                      <p className="text-xs text-zinc-550 leading-relaxed normal-case">
                                        This episode does not have a dynamic, scrollable transcription prepared yet. Click "Edit Transcript" above to add it.
                                      </p>
                                    </div>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        )}

                        {detailTab === "links" && (
                          <div className="flex flex-col gap-6 pt-2 font-sans text-xs sm:text-sm text-zinc-300">

                            {isEditingLinks ? (
                              /* Interactive Input Form */
                              <div className="flex flex-col gap-4">
                                <div className="flex items-center justify-between border-b border-zinc-900 pb-3.5 flex-wrap gap-3">
                                  <div>
                                    <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-widest">Auto-Detect Platform Links</h4>
                                    <p className="text-[10px] text-zinc-500 mt-1 font-sans">Leverages Gemini Search Grounding to scour the live web for this episode's links</p>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={handleAutoGrabLinks}
                                    disabled={isGrabbingLinks || !selectedEpisode}
                                    className="px-4.5 py-2 rounded-full border border-emerald-500/25 bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-400 font-bold text-[10px] uppercase tracking-widest transition-all cursor-pointer flex items-center gap-1.5 shadow-sm disabled:opacity-40 select-none"
                                  >
                                    {isGrabbingLinks ? (
                                      <>
                                        <div className="w-3 h-3 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin" />
                                        Searching...
                                      </>
                                    ) : (
                                      <>
                                        <Sparkles size={11} className="text-emerald-400" />
                                        AUTO-GRAB WITH GEMINI
                                      </>
                                    )}
                                  </button>
                                </div>

                                {grabLinksStatus === "success" && (
                                  <div className="text-[11px] text-emerald-400 bg-emerald-950/10 border border-emerald-900/20 px-3.5 py-2.5 rounded-xl flex items-center gap-2 font-bold uppercase tracking-wider animate-fade-in">
                                    <CheckCircle size={13} className="shrink-0" />
                                    <span>Successfully auto-grabbed listen URLs from web!</span>
                                  </div>
                                )}
                                {grabLinksStatus === "no-links" && (
                                  <div className="text-[11px] text-amber-500 bg-amber-950/10 border border-amber-900/20 px-3.5 py-2.5 rounded-xl flex items-center gap-2 font-bold uppercase tracking-wider animate-fade-in">
                                    <AlertCircle size={13} className="shrink-0" />
                                    <span>Gemini Search couldn't locate specific links for this episode.</span>
                                  </div>
                                )}
                                {grabLinksStatus === "error" && (
                                  <div className="text-[11px] text-red-400 bg-red-950/10 border border-red-900/20 px-3.5 py-2.5 rounded-xl flex items-center gap-2 font-bold uppercase tracking-wider animate-fade-in">
                                    <AlertCircle size={13} className="shrink-0" />
                                    <span>Server error searching platform links with Gemini.</span>
                                  </div>
                                )}

                                <div className="flex flex-col gap-2">
                                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
                                    Spotify URL
                                  </label>
                                  <input
                                    type="url"
                                    value={spotifyUrl}
                                    onChange={(e) => setSpotifyUrl(e.target.value)}
                                    placeholder="e.g. https://open.spotify.com/episode/..."
                                    className="w-full rounded-xl bg-[#151517] border border-[#2d2d30] focus:border-[#9DAAF2] p-3 text-xs sm:text-sm text-zinc-200 placeholder-zinc-800 focus:outline-none focus:ring-0"
                                  />
                                </div>

                                <div className="flex flex-col gap-2">
                                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
                                    Apple Podcasts URL
                                  </label>
                                  <input
                                    type="url"
                                    value={applePodcastsUrl}
                                    onChange={(e) => setApplePodcastsUrl(e.target.value)}
                                    placeholder="e.g. https://podcasts.apple.com/us/podcast/..."
                                    className="w-full rounded-xl bg-[#151517] border border-[#2d2d30] focus:border-[#9DAAF2] p-3 text-xs sm:text-sm text-zinc-200 placeholder-zinc-800 focus:outline-none focus:ring-0"
                                  />
                                </div>

                                <div className="flex flex-col gap-2">
                                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
                                    YouTube Video URL
                                  </label>
                                  <input
                                    type="url"
                                    value={youtubeUrl}
                                    onChange={(e) => setYoutubeUrl(e.target.value)}
                                    placeholder="e.g. https://www.youtube.com/watch?v=..."
                                    className="w-full rounded-xl bg-[#151517] border border-[#2d2d30] focus:border-[#9DAAF2] p-3 text-xs sm:text-sm text-zinc-200 placeholder-zinc-800 focus:outline-none focus:ring-0"
                                  />
                                </div>

                                {/* Manual Save Actions */}
                                <div className="flex items-center gap-3 mt-4 pt-2 w-full">
                                  <button
                                    type="button"
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    className="px-6 py-2.5 rounded-full bg-[#9DAAF2] hover:bg-[#b2bdec] disabled:opacity-40 text-zinc-950 font-black text-xs uppercase tracking-widest flex items-center gap-2 transition-all active:scale-95 cursor-pointer shadow-md"
                                  >
                                    {isSaving ? (
                                      <>
                                        <div className="w-3 h-3 rounded-full border-2 border-zinc-950 border-t-transparent animate-spin" />
                                        Saving...
                                      </>
                                    ) : (
                                      <>
                                        <Save size={12} />
                                        SAVE
                                      </>
                                    )}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setIsEditingLinks(false)}
                                    className="px-5 py-2.5 rounded-full border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white font-bold text-xs uppercase tracking-widest transition-all cursor-pointer select-none"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setShowConfirmDeleteLinks(true)}
                                    disabled={isSaving}
                                    className="px-5 py-2.5 rounded-full border border-zinc-800 hover:border-red-500 hover:bg-red-500/5 text-zinc-400 hover:text-red-400 font-bold text-xs uppercase tracking-widest transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-40 select-none text-[11px]"
                                    title="Delete Platform Links"
                                  >
                                    <Trash2 size={12} />
                                    DELETE
                                  </button>
                                  {saveStatus === "success" && (
                                    <span className="text-xs text-green-400 font-bold uppercase tracking-wider animate-pulse">
                                      ✓ Saved successfully
                                    </span>
                                  )}
                                  {saveStatus === "error" && (
                                    <span className="text-xs text-red-400 font-bold uppercase tracking-wider animate-pulse">
                                      ✗ Failed to save
                                    </span>
                                  )}
                                </div>
                              </div>
                            ) : (
                              /* Beautiful Reading view for configured platform links */
                              <>
                                {(spotifyUrl || applePodcastsUrl || youtubeUrl) ? (
                                  <div className="space-y-3.5 pt-1 max-w-2xl">
                                    {spotifyUrl && (
                                      <div className="flex items-center justify-between p-4.5 rounded-xl bg-[#141416]/70 border border-zinc-850 hover:border-zinc-800 transition-all">
                                        <div className="flex items-center gap-3">
                                          <div className="w-2.5 h-2.5 rounded-full bg-[#1DB954]" />
                                          <div className="flex flex-col">
                                            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Spotify</span>
                                            <span className="text-xs font-mono text-zinc-500 truncate max-w-[200px] sm:max-w-xs md:max-w-md normal-case">{spotifyUrl}</span>
                                          </div>
                                        </div>
                                        <a
                                          href={spotifyUrl}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-xs font-bold text-[#9DAAF2] hover:text-[#b8c2fa] uppercase tracking-widest flex items-center gap-1 cursor-pointer"
                                        >
                                          Visit
                                          <ExternalLink size={11} />
                                        </a>
                                      </div>
                                    )}
                                    {applePodcastsUrl && (
                                      <div className="flex items-center justify-between p-4.5 rounded-xl bg-[#141416]/70 border border-zinc-850 hover:border-zinc-800 transition-all">
                                        <div className="flex items-center gap-3">
                                          <div className="w-2.5 h-2.5 rounded-full bg-[#872EC4]" />
                                          <div className="flex flex-col">
                                            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Apple Podcasts</span>
                                            <span className="text-xs font-mono text-zinc-500 truncate max-w-[200px] sm:max-w-xs md:max-w-md normal-case">{applePodcastsUrl}</span>
                                          </div>
                                        </div>
                                        <a
                                          href={applePodcastsUrl}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-xs font-bold text-[#9DAAF2] hover:text-[#b8c2fa] uppercase tracking-widest flex items-center gap-1 cursor-pointer"
                                        >
                                          Visit
                                          <ExternalLink size={11} />
                                        </a>
                                      </div>
                                    )}
                                    {youtubeUrl && (
                                      <div className="flex items-center justify-between p-4.5 rounded-xl bg-[#141416]/70 border border-zinc-850 hover:border-zinc-800 transition-all">
                                        <div className="flex items-center gap-3">
                                          <div className="w-2.5 h-2.5 rounded-full bg-[#FF0000]" />
                                          <div className="flex flex-col">
                                            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">YouTube</span>
                                            <span className="text-xs font-mono text-zinc-500 truncate max-w-[200px] sm:max-w-xs md:max-w-md normal-case">{youtubeUrl}</span>
                                          </div>
                                        </div>
                                        <a
                                          href={youtubeUrl}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-xs font-bold text-[#9DAAF2] hover:text-[#b8c2fa] uppercase tracking-widest flex items-center gap-1 cursor-pointer"
                                        >
                                          Watch
                                          <ExternalLink size={11} />
                                        </a>
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <div className="p-8 border border-dashed border-zinc-850 text-center rounded-xl py-12 flex flex-col items-center justify-center gap-4 animate-none">
                                    <span className="w-10 h-10 rounded-full bg-[#9DAAF2]/15 flex items-center justify-center text-[#9DAAF2]">
                                      <ExternalLink size={18} />
                                    </span>
                                    <div className="flex flex-col gap-1 max-w-sm">
                                      <span className="text-xs text-zinc-400 font-bold uppercase tracking-wider">No Platform Links Configured</span>
                                      <p className="text-xs text-zinc-500 leading-relaxed normal-case">
                                        This episode does not have direct platform links connected yet. Click "Edit Platform Links" above to input links.
                                      </p>
                                    </div>
                                  </div>
                                )}
                              </>
                            )}

                            {/* Gemini Search Diagnostics Terminal */}
                            {grabLinksDebugLogs.length > 0 && (
                              <div className="mt-4 border border-zinc-900 rounded-xl overflow-hidden bg-zinc-950/40 animate-fade-in text-left">
                                <button
                                  type="button"
                                  onClick={() => setShowDebugConsole(!showDebugConsole)}
                                  className="w-full flex flex-row items-center justify-between px-4 py-3 bg-zinc-950/80 border-b border-zinc-900 text-[10px] sm:text-xs font-bold text-zinc-400 uppercase tracking-wider hover:text-white transition-colors cursor-pointer"
                                >
                                  <div className="flex items-center gap-1.5 flex-1">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                    <span>Gemini Web Search Diagnostics</span>
                                  </div>
                                  <span>{showDebugConsole ? "Collapse Logs" : "Expand Logs"}</span>
                                </button>
                                {showDebugConsole && (
                                  <div className="p-4 font-mono text-[10px] leading-relaxed text-zinc-500 bg-zinc-950/95 overflow-y-auto max-h-[250px] scrollbar-thin flex flex-col gap-1.5 select-text">
                                    {grabLinksDebugLogs.map((log, idx) => {
                                      let styleClass = "text-zinc-500";
                                      if (log.startsWith("[info]")) styleClass = "text-emerald-400";
                                      else if (log.startsWith("[prompt]")) styleClass = "text-zinc-400 font-bold font-sans";
                                      else if (log.startsWith("[raw_response]")) styleClass = "text-amber-300 font-sans whitespace-pre-wrap brightness-90 bg-zinc-900/40 p-2 rounded-md border border-zinc-850 my-1 self-stretch";
                                      else if (log.startsWith("[grounding_queries]")) styleClass = "text-[#9DAAF2] bg-[#9DAAF2]/5 px-2 py-0.5 rounded";
                                      else if (log.startsWith("[grounding_chunks]")) styleClass = "text-[#9DAAF2]/80 font-semibold";
                                      else if (log.startsWith("[warning]")) styleClass = "text-amber-500 font-semibold";
                                      else if (log.startsWith(" [source]")) styleClass = "text-zinc-500 hover:text-zinc-300 truncate transition-colors";
                                      else if (log.startsWith("[success]")) styleClass = "text-emerald-500 font-bold bg-emerald-950/20 px-2 py-0.5 rounded border border-emerald-900/20";
                                      else if (log.startsWith("[error]")) styleClass = "text-red-400 font-black bg-red-950/20 px-2 py-1 rounded border border-red-900/20";

                                      return (
                                        <div key={idx} className={`${styleClass} break-all`}>
                                          {log}
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            )}

                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>

              </div>
            );
          })()
        )}

      </div>

      {/* 3. SOLID CREDITS FOOTER (MATCHING HOME PAGE) */}
      <footer id="master-platform-footer" className="w-full bg-footer-bg border-t border-zinc-800/40 pt-16 pb-8 px-5 sm:px-8 md:px-12 text-zinc-300 tracking-wider relative select-none mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col">
          
          {/* Main 4-Column Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 md:gap-8 lg:gap-12 pb-12">
            
            {/* Column 1: Be Future-Ready (Newsletter Subscription) */}
            <div className="lg:col-span-4 flex flex-col gap-4">
              <h3 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight uppercase font-sans">
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
                <a href="#about" onClick={(e) => { e.preventDefault(); onBackToMain(); setTimeout(() => { window.location.hash = "#about"; }, 150); }} className="hover:text-accent duration-200">Our Team</a>
                <a href="#expertise" onClick={(e) => { e.preventDefault(); onBackToMain(); setTimeout(() => { window.location.hash = "#expertise"; }, 150); }} className="hover:text-accent duration-200">Episode Hub</a>
                <a href="#feedback" onClick={(e) => { e.preventDefault(); onBackToMain(); setTimeout(() => { window.location.hash = "#feedback"; }, 150); }} className="hover:text-accent duration-200">Patient Stories</a>
                <a href="#about" onClick={(e) => { e.preventDefault(); onBackToMain(); setTimeout(() => { window.location.hash = "#about"; }, 150); }} className="hover:text-accent duration-200">Host Biography</a>
              </nav>
            </div>

            {/* Column 3: Resource Center */}
            <div className="lg:col-span-2 md:col-span-1 flex flex-col gap-4">
              <h4 className="text-xs sm:text-sm font-bold text-white tracking-widest uppercase">
                Resources
              </h4>
              <nav className="flex flex-col gap-2.5 text-xs font-semibold text-zinc-400 uppercase">
                <a href="#about" onClick={(e) => { e.preventDefault(); onBackToMain(); setTimeout(() => { window.location.hash = "#about"; }, 150); }} className="hover:text-accent duration-200">Disclaimer</a>
                <a href="#expertise" onClick={(e) => { e.preventDefault(); onBackToMain(); setTimeout(() => { window.location.hash = "#expertise"; }, 150); }} className="hover:text-accent duration-200">Sponsors</a>
                <a href="/admin" onClick={(e) => { e.preventDefault(); }} className="hover:text-[#E2C33B] font-extrabold text-[#E2C33B] tracking-wider duration-200">Admin Portal</a>
                <a href="#feedback" onClick={(e) => { e.preventDefault(); onBackToMain(); setTimeout(() => { window.location.hash = "#feedback"; }, 150); }} className="hover:text-accent duration-200">General FAQ</a>
              </nav>
            </div>

            {/* Column 4: Contact Us */}
            <div className="lg:col-span-4 flex flex-col gap-4">
              <h4 className="text-xs sm:text-sm font-bold text-white tracking-widest uppercase">
                Contact Us
              </h4>
              <div className="flex flex-col gap-3 text-xs sm:text-[13px] font-semibold text-zinc-400 normal-case tracking-normal animate-none">
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
          <div className="border-t border-zinc-700/40 w-full my-6 font-sans"></div>

          {/* Bottom Bar: Copyright, Socials, and Policies */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 uppercase text-[10px] sm:text-[11px] font-bold text-zinc-400 tracking-wider">
            
            {/* Copyright */}
            <div className="text-zinc-500 text-center md:text-left order-3 md:order-1 font-sans">
              <span>© 2026 The Rena Malik Show. All Rights Reserved.</span>
            </div>

            {/* Social Circle Links */}
            <div className="flex items-center justify-center gap-2.5 order-1 md:order-2">
              {[
                { icon: <Facebook size={12} />, href: "https://facebook.com" },
                { icon: <Linkedin size={12} />, href: "https://linkedin.com" },
                { icon: <Twitter size={12} />, href: "https://twitter.com" },
                { icon: <Instagram size={12} />, href: "https://instagram.com/renamalikmd" },
                { icon: <Youtube size={12} />, href: "https://youtube.com/@RenaMalikMD" },
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
              <a href="#about" onClick={(e) => { e.preventDefault(); onBackToMain(); setTimeout(() => { window.location.hash = "#about"; }, 150); }} className="hover:text-white transition-colors text-zinc-500">Terms</a>
              <a href="#about" onClick={(e) => { e.preventDefault(); onBackToMain(); setTimeout(() => { window.location.hash = "#about"; }, 150); }} className="hover:text-white transition-colors text-zinc-500">Privacy</a>
              
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

      {/* Hidden HTML5 Audio Element for Preview Playback */}
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

      {/* 4. DYNAMIC MODAL WINDOW CONFIRMATION */}
      <AnimatePresence>
        {(showConfirmDeleteTimestamps || showConfirmDeleteTranscript || showConfirmDeleteLinks) && (
          <motion.div
            key="delete-confirm-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 select-none"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="w-full max-w-sm bg-[#363636] rounded-3xl shadow-2xl p-6 sm:p-8 flex flex-col items-center text-center relative overflow-hidden"
            >
              {/* Alert Indicator */}
              <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center mb-4">
                <Trash2 size={20} className="stroke-[2.5]" />
              </div>

              {/* Title */}
              <h3 className="text-xl font-bold text-white tracking-tight uppercase font-sans">
                {showConfirmDeleteTimestamps ? "Delete Timestamps?" : showConfirmDeleteTranscript ? "Delete Transcript?" : "Delete Platform Links?"}
              </h3>

              {/* Subtitle */}
              <p className="text-zinc-400 text-xs sm:text-[13px] leading-relaxed normal-case mt-2.5 font-normal">
                Are you sure you want to permanently clear the curated {showConfirmDeleteTimestamps ? "timestamps" : showConfirmDeleteTranscript ? "transcript" : "platform links"} data for this episode? This action is irreversible.
              </p>

              {/* Button Groups */}
              <div className="flex items-center gap-3 w-full mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowConfirmDeleteTimestamps(false);
                    setShowConfirmDeleteTranscript(false);
                    setShowConfirmDeleteLinks(false);
                  }}
                  className="flex-1 py-2.5 rounded-full border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white font-bold text-xs uppercase tracking-widest transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={showConfirmDeleteTimestamps ? handleDeleteTimestamps : showConfirmDeleteTranscript ? handleDeleteTranscript : handleDeleteLinks}
                  disabled={isSaving}
                  className="flex-1 py-2.5 rounded-full bg-red-600 hover:bg-red-500 disabled:bg-red-900 disabled:opacity-55 text-white font-bold text-xs uppercase tracking-widest transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <div className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    "Delete"
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
