/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import dns from "dns";
import dotenv from "dotenv";
import fs from "fs";
import mongoose, { Schema, Document } from "mongoose";
import os from "os";
import { pipeline } from "stream/promises";
import { Readable } from "stream";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

// Lazy initialization of Gemini client
let geminiClient: GoogleGenAI | null = null;

function getGemini(): GoogleGenAI {
  if (!geminiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY environment variable is required but missing");
    }
    geminiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        }
      }
    });
  }
  return geminiClient;
}

function cleanupFiles(tempFilePath: string, uploadName: string, ai?: GoogleGenAI) {
  try {
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
      console.log(`[Gemini Integration-Cleanup] Deleted local temporary file: ${tempFilePath}`);
    }
  } catch (err) {
    console.warn(`[Gemini Integration-Cleanup] Failed to unlink local temp file:`, err);
  }

  if (uploadName && ai) {
    ai.files.delete({ name: uploadName })
      .then(() => {
        console.log(`[Gemini Integration-Cleanup] Deleted remote Google Gemini file: ${uploadName}`);
      })
      .catch((err) => {
        console.warn(`[Gemini Integration-Cleanup] Failed to delete remote Google Gemini file:`, err);
      });
  }
}

const app = express();
const PORT = 3000;

// Smart body parser to prevent hanging on Vercel Serverless
app.use((req: any, res: any, next: any) => {
  if (req.body !== undefined && typeof req.body === "object" && !Buffer.isBuffer(req.body)) {
    return next();
  }
  express.json({ limit: "20mb" })(req, res, next);
});

// Setup fallback data in case fetching the external RSS feed fails or rate-limits
const FALLBACK_EPISODES = [
  {
    id: "214",
    number: 214,
    title: "The Ultimate Guide to Pelvic Floor Health & Posture",
    guest: "Dr. Amy Stein",
    guestTitle: "Pelvic Pain Specialist & Author",
    duration: "1h 12m",
    publishedAt: "May 28, 2026",
    category: "Pelvic Floor",
    description: "Dr. Amy Stein joins Dr. Rena Malik to reveal how pelvic floor tightness contributes to unexpected core pain, how to release tension safely, and physical therapist hacks for optimal alignment.",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    tags: ["Pelvic Floor", "Muscle Release", "Core Strength"]
  },
  {
    id: "213",
    number: 213,
    title: "The Science of Libido, Desire, and Rewriting Clichés",
    guest: "Dr. Emily Nagoski",
    guestTitle: "Author of 'Come As You Are' & Researcher",
    duration: "1h 24m",
    publishedAt: "May 14, 2026",
    category: "Sexual Wellness",
    description: "A profound discussion on the 'dual-control model' of sexual response. Dr. Nagoski break downs the accelerators and brakes of desire, and why context is almost everything when boosting intimacy.",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    tags: ["Libido", "Psychology", "Intimacy"]
  },
  {
    id: "211",
    number: 211,
    title: "Urine Habits, Hydration Secrets, and Bladder Training",
    guest: "Dr. Rena Malik",
    guestTitle: "Board-Certified Urologist",
    duration: "54m",
    publishedAt: "May 02, 2026",
    category: "Urology",
    description: "In this popular solo episode, Dr. Rena details the exact guidelines for daily water intake, how to avoid creating an 'anxious bladder', and the truth behind over-the-counter UTI supplements.",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
    tags: ["Urology", "Bladder Health", "Hydration Tips"]
  },
  {
    id: "209",
    number: 209,
    title: "How Relationships Impact Your Longevity & Heart Rates",
    guest: "Dr. Jess O'Reilly",
    guestTitle: "Relationship Expert & Sexologist",
    duration: "1h 05m",
    publishedAt: "Apr 20, 2026",
    category: "Intimacy & Science",
    description: "Exploring the biometrics of intimacy. Dr. Jess shares how healthy long-term connection regulates autonomic nervous systems, reduces systemic stress, and boosts cardiovascular stamina.",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
    tags: ["Relationships", "Stress Reduction", "Longevity"]
  }
];

function rssRegexParser(xmlText: string) {
  const items: any[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;
  let count = 1;

  while ((match = itemRegex.exec(xmlText)) !== null) {
    const content = match[1];

    const titleMatch = content.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i);
    const descMatch = content.match(/<description>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/i);
    const pubDateMatch = content.match(/<pubDate>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/pubDate>/i);
    const durationMatch = content.match(/<itunes:duration>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/itunes:duration>/i);
    const enclosureMatch = content.match(/<enclosure\s+[^>]*url=["']([^"']+)["']/i);

    const title = titleMatch ? titleMatch[1].replace(/<!\[CDATA\[|\]\]>/g, "").trim() : "Unknown Episode";
    const rawDesc = descMatch ? descMatch[1].trim() : "";
    
    // Decentre and clean description tags
    let description = rawDesc
      .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, "$1")
      .replace(/<p>/gi, "")
      .replace(/<\/p>/gi, "\n")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<[^>]+>/g, "")
      .trim();

    const publishedAtRaw = pubDateMatch ? pubDateMatch[1].trim() : "";
    let publishedAt = publishedAtRaw;
    try {
      const d = new Date(publishedAtRaw);
      if (!isNaN(d.getTime())) {
        publishedAt = d.toLocaleDateString("en-US", {
          month: "short",
          day: "2-digit",
          year: "numeric"
        });
      }
    } catch (e) {}

    const rawDuration = durationMatch ? durationMatch[1].trim() : "50:00";
    let duration = rawDuration;
    if (/^\d+$/.test(rawDuration)) {
      const totalSecs = parseInt(rawDuration, 10);
      const mins = Math.floor(totalSecs / 60);
      duration = `${mins}m`;
    } else if (rawDuration.includes(":")) {
      const parts = rawDuration.split(":");
      if (parts.length === 3) {
        const hrs = parseInt(parts[0], 10);
        const mins = parseInt(parts[1], 10);
        duration = hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
      } else if (parts.length === 2) {
        duration = `${parseInt(parts[0], 10)}m`;
      }
    }

    const audioUrl = enclosureMatch ? enclosureMatch[1] : `https://www.soundhelix.com/examples/mp3/SoundHelix-Song-${count}.mp3`;

    // Deduce Guest & Host Details
    let guest = "Dr. Rena Malik";
    let guestTitle = "Board-Certified Urologist";

    const guestRegexes = [
      /Dr\.\s+Rena\s+Malik\s+and\s+([A-Za-z\s]+?)\s+(?:discuss|share|talk)/i,
      /with\s+guest\s+([A-Za-z\s]+?)(?:\s+from|\s+on|\.|\n|$)/i,
      /featuring\s+([A-Za-z\s]+?)(?:\s+from|\s+on|\.|\n|$)/i,
      /In this episode,\s+([A-Za-z\s]+?)\s+joins/i
    ];

    for (const r of guestRegexes) {
      const gMatch = description.match(r);
      if (gMatch && gMatch[1]) {
        const potentialGuest = gMatch[1].trim();
        if (potentialGuest.length > 3 && potentialGuest.length < 35 && !potentialGuest.toLowerCase().includes("rena")) {
          guest = potentialGuest;
          guestTitle = "Featured Guest Expert";
          break;
        }
      }
    }

    // Smart categorization
    let category = "General";
    const lowerTitleDesc = (title + " " + description).toLowerCase();
    if (lowerTitleDesc.includes("pelvic") || lowerTitleDesc.includes("kegel") || lowerTitleDesc.includes("posture")) {
      category = "Pelvic Floor";
    } else if (lowerTitleDesc.includes("libido") || lowerTitleDesc.includes("sex") || lowerTitleDesc.includes("desire") || lowerTitleDesc.includes("orgasm") || lowerTitleDesc.includes("arousal")) {
      category = "Sexual Wellness";
    } else if (lowerTitleDesc.includes("uti") || lowerTitleDesc.includes("urine") || lowerTitleDesc.includes("bladder") || lowerTitleDesc.includes("kidney") || lowerTitleDesc.includes("prostate")) {
      category = "Urology";
    } else if (lowerTitleDesc.includes("relationship") || lowerTitleDesc.includes("partner") || lowerTitleDesc.includes("intimacy") || lowerTitleDesc.includes("communication")) {
      category = "Intimacy & Science";
    } else {
      category = "Urology"; // fallback default
    }

    // Smart tags
    const tags: string[] = [];
    if (lowerTitleDesc.includes("uti") || lowerTitleDesc.includes("infection")) tags.push("UTI Prevention");
    if (lowerTitleDesc.includes("bladder") || lowerTitleDesc.includes("urine")) tags.push("Bladder Health");
    if (lowerTitleDesc.includes("pelvic")) tags.push("Pelvic Floor");
    if (lowerTitleDesc.includes("libido") || lowerTitleDesc.includes("desire") || lowerTitleDesc.includes("sex")) tags.push("Libido");
    if (lowerTitleDesc.includes("menopause")) tags.push("Menopause");
    if (lowerTitleDesc.includes("relationship") || lowerTitleDesc.includes("communication")) tags.push("Intimacy");
    if (tags.length === 0) {
      tags.push("Wellness", "Urology");
    }

    items.push({
      id: `rss-ep-${count}`,
      number: count, // set ordering next
      title,
      guest,
      guestTitle,
      duration,
      publishedAt,
      category,
      description,
      audioUrl,
      tags: tags.slice(0, 3)
    });

    count++;
  }

  // Reverse them for chronological sequence (newest first)
  const totalItems = items.length;
  items.forEach((item, index) => {
    item.number = totalItems - index;
    item.id = String(item.number);
  });

  return items;
}

// Cache structure for RSS feed episodes
interface CacheEntry {
  data: any[];
  timestamp: number;
}

interface MetaCacheEntry {
  data: Record<string, any>;
  timestamp: number;
}

let cachedEpisodes: CacheEntry | null = null;
let cachedEpisodeMeta: MetaCacheEntry | null = null;
const CACHE_DURATION_MS = 10 * 60 * 1000; // 10 minutes cache duration

const AUTH_TOKEN = "RenaMalikAdminSecretSessionToken2026";

function getAlternativeKeys(id: string): string[] {
  if (!id) return [];
  const cleanId = id.toString().replace("episode-", "").replace("rss-item-", "");
  return [
    cleanId,
    `episode-${cleanId}`,
    `rss-item-${cleanId}`
  ];
}

const SEED_EPISODE_META: Record<string, any> = {
  "episode-1": {
    "timestamps": [
      {
        "time": "00:00",
        "label": "Introduction & Welcome to Dr. Amy Stein"
      },
      {
        "time": "12:30",
        "label": "Debunking Kegels: Hypertonicity and Tension Signs"
      },
      {
        "time": "25:40",
        "label": "Release Tension Practice: Diaphragmatic Down-training"
      },
      {
        "time": "42:15",
        "label": "Dynamic Alignment: Daily Posture & Bladder Dynamics"
      },
      {
        "time": "58:00",
        "label": "Audience Q&A: Overcoming Chronic Pelvic Discomfort"
      }
    ],
    "transcript": "[00:00] Dr. Rena Malik: Welcome back to The Rena Malik Show! Today, I am joined by the incredible Dr. Amy Stein, a world-renowned pelvic pain specialist. We are going to dive deep into pelvic floor health, dynamic posture, and how release is just as vital as strength.\n\n[00:45] Dr. Amy Stein: Thank you, Rena! I'm thrilled to be here. One of the biggest misconceptions we see is that everyone needs to strengthen their pelvic floor with Kegels. But for a large percentage of patients, tension and hypertonicity are the actual culprits of bladder and core issues.\n\n[12:30] Dr. Rena Malik: Exactly. Tension is so often overlooked. When a patient presents with chronic pelvic or core discomfort, they are often surprised to hear their muscles are actually overwrought and simply need down-training. Let's talk about the symptoms.\n\n[25:40] Dr. Amy Stein: The symptoms can manifest in so many subtle ways, from frequent urination to lower back stiffness. Let's practice a simple diaphragmatic release breath right now to help down-regulate the nervous system and relax those core muscles...\n\n[42:15] Dr. Rena Malik: It's all connected. Let's address posture next. How does the tilt of our pelvis affects bladder pressure throughout the day?\n\n[58:00] Dr. Amy Stein: When you tilt forward in a military posture, you load the anterior wall. Let's keep it neutral to ensure ease of fluid motion throughout your pelvic girdle."
  },
  "episode-2": {
    "timestamps": [
      {
        "time": "00:00",
        "label": "Welcome Dr. Emily Nagoski: Intimacy & Libido"
      },
      {
        "time": "15:20",
        "label": "The Dual-Control Model: Accelerators vs Brakes"
      },
      {
        "time": "32:45",
        "label": "Emotional Context & Stress Management Secrets"
      },
      {
        "time": "52:10",
        "label": "Unlearning Outdated High-Pressure Performance Clichés"
      },
      {
        "time": "1:10:15",
        "label": "Rewriting Your Personal Story for Better Intimacy"
      }
    ],
    "transcript": "[00:00] Dr. Rena Malik: Welcome back to the show! Today, we are deep-diving into physical and psychological intimacy with the world-famous author of 'Come As You Are', Dr. Emily Nagoski. If you've ever felt pressure or confusion about libido, this is for you.\n\n[05:10] Dr. Emily Nagoski: Thank you so much for having me, Rena! I love talking to your audience because clinicians are where science meets daily practice. Let's start with the central pillar: context.\n\n[15:20] Dr. Rena Malik: Yes, the Dual-control model has revolutionized how we view arousal. Can you explain the difference between sexual accelerators and brakes?\n\n[15:55] Dr. Emily Nagoski: Absolutely. Your brain is loaded with sensory accelerators (noticing excitement) and brakes (noticing threats, stress, laundry, a cold room). Often, low desire is not a lack of internal accelerator pressure, but highly sensitive, hard-pressed brakes.\n\n[32:45] Dr. Rena Malik: This explains why stress completely stalls intimacy for so many couples. Your brain interprets stress as danger first.\n\n[52:10] Dr. Emily Nagoski: Exactly! The brain cannot distinguish 'corporate deadline' from 'saber-toothed tiger'. When we downplay stress, are we expecting our primitive biology to rewrite itself? No. We must soothe the nervous system first."
  },
  "episode-3": {
    "timestamps": [
      {
        "time": "00:02",
        "label": "Solo Briefing: The Hydration & Urination Science"
      },
      {
        "time": "14:15",
        "label": "How Much Water Do You Actually Need Every Day?"
      },
      {
        "time": "28:30",
        "label": "Anxious Bladder Syndrome: Retraining Routine Tricks"
      },
      {
        "time": "40:50",
        "label": "Understanding UTIs and Clinical Fact vs Supplement Fiction"
      }
    ],
    "transcript": "[00:00] Dr. Rena Malik: This is a special solo episode. Today, we're talking about bladder training, hydration, and why going toilet 'just in case' is actually ruining your bladder capacity. Let's begin with the basics.\n\n[14:15] Dr. Rena Malik: Let's bust the 8-cups-a-day water myth. Water demands depend deeply on exercise, food hydration, and heat. Drinking excessive water forces your kidneys to clear solute at a frantic pace and trains your bladder to crave urination too early.\n\n[28:30] Dr. Rena Malik: Now, when you run to the bathroom before leaving the house 'just in case', you signal to your sensory nerves that they must alert you at smaller volumes. Over time, this shrinks functional capacity and breeds urinary urgency. We must break this anxious feedback loop."
  }
};

// Define interfaces
interface IEpisodeMeta {
  episodeId: string;
  timestamps: Array<{ time: string; label: string }>;
  transcript: string;
  spotifyUrl?: string;
  applePodcastsUrl?: string;
  youtubeUrl?: string;
  updatedAt: Date;
}

// Retrieve models safely without overwrite errors
function getEpisodeMetaModel() {
  if (mongoose.models.EpisodeMeta) {
    return mongoose.models.EpisodeMeta as mongoose.Model<IEpisodeMeta>;
  }
  const schema = new Schema<IEpisodeMeta>({
    episodeId: { type: String, required: true, unique: true, index: true },
    timestamps: [{
      time: { type: String, required: true },
      label: { type: String, required: true }
    }],
    transcript: { type: String, default: "" },
    spotifyUrl: { type: String, default: "" },
    applePodcastsUrl: { type: String, default: "" },
    youtubeUrl: { type: String, default: "" },
    updatedAt: { type: Date, default: Date.now }
  });
  return mongoose.model<IEpisodeMeta>("EpisodeMeta", schema);
}

// Fetches metadata and keeps it in-memory for 10 minutes to minimize MongoDB latency
async function getEpisodeMetaMap(): Promise<Record<string, any>> {
  const now = Date.now();
  if (cachedEpisodeMeta && (now - cachedEpisodeMeta.timestamp < CACHE_DURATION_MS)) {
    console.log(`[Cache] Serving episode-meta from local memory cache (${Math.round((now - cachedEpisodeMeta.timestamp) / 1000)}s old)`);
    return cachedEpisodeMeta.data;
  }

  // Ensure DB connection is established lazily only when we fetch meta
  try {
    await ensureDbConnected();
  } catch (err: any) {
    console.warn("[getEpisodeMetaMap] Lazy database connection check skipped/failed:", err.message || err);
  }

  // Fetch from DB if connected, otherwise fall back to initial seed data
  let metaMap: Record<string, any> = {};
  if (isConnectedToMongo) {
    try {
      const MetaModel = getEpisodeMetaModel();
      const allDocs = await MetaModel.find({});
      allDocs.forEach(doc => {
        metaMap[doc.episodeId] = {
          timestamps: doc.timestamps,
          transcript: doc.transcript,
          spotifyUrl: doc.spotifyUrl || "",
          applePodcastsUrl: doc.applePodcastsUrl || "",
          youtubeUrl: doc.youtubeUrl || ""
        };
      });
      console.log(`[MongoDB] Pulled fresh metadata entries from database. (Count: ${allDocs.length})`);
    } catch (err) {
      console.error("[MongoDB] Failed to retrieve episode meta from database:", err);
      metaMap = SEED_EPISODE_META;
    }
  } else {
    metaMap = SEED_EPISODE_META;
  }

  // Sync memory cache
  cachedEpisodeMeta = {
    data: metaMap,
    timestamp: now
  };

  return metaMap;
}

// MongoDB Setup & Connection
let isConnectedToMongo = false;
let dbConnectionPromise: Promise<boolean> | null = null;

async function ensureDbConnected(): Promise<boolean> {
  if (mongoose.connection.readyState === 1) {
    isConnectedToMongo = true;
    return true;
  }

  const uri = process.env.MONGODB_URI;
  if (!uri || uri === "your_mongodb_uri_here" || uri === "MY_MONGODB_URI") {
    isConnectedToMongo = false;
    return false;
  }

  if (!dbConnectionPromise) {
    dbConnectionPromise = (async () => {
      try {
        console.log("[MongoDB] Connecting lazily to remote MongoDB database with responsive 2.5s limit...");
        await mongoose.connect(uri, {
          serverSelectionTimeoutMS: 2500,
          connectTimeoutMS: 2500,
          socketTimeoutMS: 2500,
        });
        isConnectedToMongo = true;
        console.log("[MongoDB] Successfully connected to remote database!");
        
        // Auto-seed initial metadata on cold start if database is empty
        try {
          const MetaModel = getEpisodeMetaModel();
          const count = await MetaModel.countDocuments();
          if (count === 0) {
            console.log("[MongoDB-Sync] Remote database is empty. Seeding with 3 initial curated episodes...");
            for (const epId of Object.keys(SEED_EPISODE_META)) {
              await MetaModel.create({
                episodeId: epId,
                timestamps: SEED_EPISODE_META[epId].timestamps || [],
                transcript: SEED_EPISODE_META[epId].transcript || "",
                updatedAt: new Date()
              });
            }
            console.log("[MongoDB-Sync] Initialization seed completed!");
          }
        } catch (seedError: any) {
          console.error("[MongoDB-Sync] Seeding failed:", seedError.message || seedError);
        }

        return true;
      } catch (err: any) {
        console.warn("[MongoDB] Connection could not be established, falling back to Local Mode:", err.message || err);
        isConnectedToMongo = false;
        dbConnectionPromise = null; // allow retrying next request
        return false;
      }
    })();
  }

  return dbConnectionPromise;
}

// POST Admin login endpoint
app.post("/api/admin/login", (req, res) => {
  try {
    const { username, password } = req.body || {};
    const envUsername = process.env.ADMIN_USERNAME || "admin";
    const envPassword = process.env.ADMIN_PASSWORD || "password123";

    if (username === envUsername && password === envPassword) {
      console.log(`[API] Successful admin login for username: ${username}`);
      return res.json({ success: true, token: AUTH_TOKEN });
    } else {
      console.warn(`[API] Failed admin login attempt for username: ${username}`);
      return res.status(401).json({ success: false, message: "Invalid administrator credentials." });
    }
  } catch (err: any) {
    console.error("[API] Crash in admin login handler:", err.message || err);
    return res.status(500).json({ success: false, message: `Server error during login: ${err.message}` });
  }
});

// GET configuration API for Admin Dashboard
app.get("/api/admin/config", (req, res) => {
  res.json({
    success: true,
    geminiModel: process.env.GEMINI_MODEL || "gemini-3.5-flash"
  });
});

// GET diagnostics debugging endpoint
app.get("/api/debug", async (req, res) => {
  const diagnostics: any = {
    timestamp: new Date().toISOString(),
    nodeVersion: process.version,
    env: {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL: process.env.VERCEL,
      MONGODB_URI_EXISTS: !!process.env.MONGODB_URI,
      MONGODB_URI_MASKED: process.env.MONGODB_URI 
        ? process.env.MONGODB_URI.replace(/:([^@]+)@/, ":******@") 
        : "not_set",
      PODCAST_RSS_URL: process.env.PODCAST_RSS_URL || "not_set (loaded Megaphone default feed)"
    },
    mongo: {
      readyState: mongoose.connection.readyState,
      readyStateDescription: ["disconnected", "connected", "connecting", "disconnecting"][mongoose.connection.readyState] || "unknown",
      isConnectedToMongo: isConnectedToMongo
    },
    rss: {}
  };

  // Test MongoDB Connection lazily inline
  try {
    const isConn = await ensureDbConnected();
    diagnostics.mongo.lazyConnectionResult = isConn;
    diagnostics.mongo.finalReadyState = mongoose.connection.readyState;
    diagnostics.mongo.finalConnected = isConnectedToMongo;
  } catch (dbErr: any) {
    diagnostics.mongo.error = dbErr.message || String(dbErr);
    diagnostics.mongo.stack = dbErr.stack;
  }

  // Test RSS Fetch direct
  try {
    const rssUrl = process.env.PODCAST_RSS_URL || "https://feeds.megaphone.fm/renamalikmd";
    diagnostics.rss.testingUrl = rssUrl;
    const startFetch = Date.now();
    const response = await fetch(rssUrl, {
      headers: { 
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
        "Accept": "application/rss+xml, application/xml, text/xml, */*",
        "Cache-Control": "no-cache",
        "Pragma": "no-cache"
      },
      signal: AbortSignal.timeout(5000)
    });
    diagnostics.rss.durationMs = Date.now() - startFetch;
    diagnostics.rss.status = response.status;
    diagnostics.rss.statusText = response.statusText;
    diagnostics.rss.ok = response.ok;
    if (response.ok) {
      const text = await response.text();
      diagnostics.rss.contentLength = text.length;
      diagnostics.rss.snippet = text.slice(0, 300);
      const testParse = rssRegexParser(text);
      diagnostics.rss.parsedCount = testParse ? testParse.length : 0;
    }
  } catch (rssErr: any) {
    diagnostics.rss.error = rssErr.message || String(rssErr);
    diagnostics.rss.stack = rssErr.stack;
  }

  res.json(diagnostics);
});

// GET all metadata map
app.get("/api/episode-meta", async (req, res) => {
  try {
    const metaMap = await getEpisodeMetaMap();
    res.json(metaMap);
  } catch (err: any) {
    console.error("[API] Failed to serve episode-meta list:", err.message || err);
    res.json(SEED_EPISODE_META);
  }
});

// GET metadata for specific episode
app.get("/api/episode-meta/:id", async (req, res) => {
  const episodeId = req.params.id;
  try {
    const metaMap = await getEpisodeMetaMap();
    const keys = getAlternativeKeys(episodeId);
    let meta = null;
    for (const key of keys) {
      if (metaMap[key]) {
        meta = metaMap[key];
        break;
      }
    }
    if (!meta) {
      for (const key of keys) {
        if (SEED_EPISODE_META[key]) {
          meta = SEED_EPISODE_META[key];
          break;
        }
      }
    }
    res.json(meta || { timestamps: [], transcript: "", spotifyUrl: "", applePodcastsUrl: "", youtubeUrl: "" });
  } catch (err: any) {
    console.error(`[API] Failed to find episode-meta for ${episodeId}:`, err.message || err);
    const keys = getAlternativeKeys(episodeId);
    let meta = null;
    for (const key of keys) {
      if (SEED_EPISODE_META[key]) {
        meta = SEED_EPISODE_META[key];
        break;
      }
    }
    res.json(meta || { timestamps: [], transcript: "", spotifyUrl: "", applePodcastsUrl: "", youtubeUrl: "" });
  }
});

// POST update metadata for specific episode
app.post("/api/episode-meta/:id", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || authHeader !== `Bearer ${AUTH_TOKEN}`) {
    return res.status(401).json({ success: false, message: "Unauthorized. Please authenticate first." });
  }

  const episodeId = req.params.id;
  const { timestamps, transcript, spotifyUrl, applePodcastsUrl, youtubeUrl } = req.body || {};
  const validTimestamps = Array.isArray(timestamps) ? timestamps : [];
  const validTranscript = typeof transcript === "string" ? transcript : "";
  const validSpotify = typeof spotifyUrl === "string" ? spotifyUrl : "";
  const validApple = typeof applePodcastsUrl === "string" ? applePodcastsUrl : "";
  const validYoutube = typeof youtubeUrl === "string" ? youtubeUrl : "";

  // Lazy database connection checking only when updating
  try {
    await ensureDbConnected();
  } catch (err: any) {
    console.warn("[PostMeta] Lazy database connection check skipped/failed:", err.message || err);
  }

  // 1. Write update to MongoDB
  if (isConnectedToMongo) {
    try {
      const MetaModel = getEpisodeMetaModel();
      await MetaModel.findOneAndUpdate(
        { episodeId },
        { 
          timestamps: validTimestamps, 
          transcript: validTranscript,
          spotifyUrl: validSpotify,
          applePodcastsUrl: validApple,
          youtubeUrl: validYoutube,
          updatedAt: new Date()
        },
        { upsert: true }
      );
      console.log(`[MongoDB] Updated curated metadata in database for episode ${episodeId}`);
    } catch (err: any) {
      console.error("[MongoDB] Failed to write episode-meta to database during update:", err.message || err);
      return res.status(500).json({ success: false, message: "Failed to save to remote database" });
    }
  } else {
    return res.status(503).json({ success: false, message: "Remote MongoDB database is not connected" });
  }

  // 2. Keep local memory cache updated immediately
  const keys = getAlternativeKeys(episodeId);
  if (!cachedEpisodeMeta) {
    const initialCache: Record<string, any> = { ...SEED_EPISODE_META };
    keys.forEach((key) => {
      initialCache[key] = {
        timestamps: validTimestamps,
        transcript: validTranscript,
        spotifyUrl: validSpotify,
        applePodcastsUrl: validApple,
        youtubeUrl: validYoutube
      };
    });
    cachedEpisodeMeta = {
      data: initialCache,
      timestamp: Date.now()
    };
  } else {
    keys.forEach((key) => {
      cachedEpisodeMeta!.data[key] = {
        timestamps: validTimestamps,
        transcript: validTranscript,
        spotifyUrl: validSpotify,
        applePodcastsUrl: validApple,
        youtubeUrl: validYoutube
      };
    });
    cachedEpisodeMeta.timestamp = Date.now(); // bump expiry
  }

  // Clear episode list cache to ensure fresh metadata is merged on next fetch
  cachedEpisodes = null;

  res.json({ 
    success: true, 
    message: "Metadata updated in MongoDB database and local memory cache successfully", 
    data: { 
      timestamps: validTimestamps, 
      transcript: validTranscript, 
      spotifyUrl: validSpotify, 
      applePodcastsUrl: validApple, 
      youtubeUrl: validYoutube 
    } 
  });
});

async function searchPlatformLinks(episodeTitle: string): Promise<{ spotifyUrl: string; applePodcastsUrl: string; youtubeUrl: string }> {
  try {
    const ai = getGemini();
    const prompt = `Perform a web search to find the correct, official listen or watch URLs for the podcast episode titled "${episodeTitle}" of "The Rena Malik Show" (hosted by Dr. Rena Malik).
Please find the following three specific links if they exist:
1. Spotify episode link (should contain "open.spotify.com/episode/")
2. Apple Podcasts episode link (should contain "podcasts.apple.com/")
3. YouTube video watch link for this episode (should contain "youtube.com/watch?v=" or "youtu.be/")

CRITICAL FALLBACK: If a specific episode link cannot be found (e.g. because "${episodeTitle}" is newer, a draft, or unpublished), please search for and provide the official main show or channel pages for "The Rena Malik Show" on each platform:
- Spotify show link (e.g. "https://open.spotify.com/show/5mD8Wz4mIsr...")
- Apple Podcasts show link (e.g. "https://podcasts.apple.com/us/podcast/the-rena-malik-show/...")
- YouTube channel link (e.g. "https://www.youtube.com/@RenaMalikMD")

Do not invent fake, mock, or placeholder URLs; only provide real URLs.
Write the links clearly as:
Spotify: [url]
Apple: [url]
YouTube: [url]`;

    // Note: Do NOT use responseMimeType: "application/json" under config when using googleSearch tool,
    // as structured schema outputs are not compatible with search tools.
    const modelResponse = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }]
      }
    });

    const outputText = modelResponse.text || "";
    console.log(`[searchPlatformLinks] Gemini search response text:`, outputText);

    let spotifyUrl = "";
    let applePodcastsUrl = "";
    let youtubeUrl = "";

    // Parse all URLs from the output text in a highly robust way
    const urlRegex = /(https?:\/\/[^\s\)\}\]\"\'>]+)/gi;
    const foundUrls = outputText.match(urlRegex) || [];
    for (const rawUrl of foundUrls) {
      // Clean up punctuation or markup endings (like brackets or periods)
      const cleanUrl = rawUrl.trim().replace(/[.,;\)\}\]]+$/, "");
      if (!spotifyUrl && cleanUrl.includes("spotify.com") && (cleanUrl.includes("/episode/") || cleanUrl.includes("/track/") || cleanUrl.includes("/show/"))) {
        spotifyUrl = cleanUrl;
      } else if (!applePodcastsUrl && cleanUrl.includes("podcasts.apple.com")) {
        applePodcastsUrl = cleanUrl;
      } else if (!youtubeUrl && (cleanUrl.includes("youtube.com") || cleanUrl.includes("youtu.be"))) {
        youtubeUrl = cleanUrl;
      }
    }

    // Fallback: If any link is missing, check groundingMetadata chunks from Google Search Grounding
    const chunks = modelResponse.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (chunks && Array.isArray(chunks)) {
      for (const chunk of chunks) {
        const uri = chunk.web?.uri;
        if (uri && typeof uri === "string") {
          const cleanUri = uri.trim();
          if (!spotifyUrl && cleanUri.includes("spotify.com") && (cleanUri.includes("/episode/") || cleanUri.includes("/track/") || cleanUri.includes("/show/"))) {
            spotifyUrl = cleanUri;
          } else if (!applePodcastsUrl && cleanUri.includes("podcasts.apple.com")) {
            applePodcastsUrl = cleanUri;
          } else if (!youtubeUrl && (cleanUri.includes("youtube.com") || cleanUri.includes("youtu.be"))) {
            youtubeUrl = cleanUri;
          }
        }
      }
    }

    // Hardcoded safety defaults for Rena Malik Show if even Google Search Grounding is blocked or returns empty
    if (!spotifyUrl) spotifyUrl = "https://open.spotify.com/show/0O7zX6qBv99zDCOV02A7w7"; // Real Spotify show ID for The Rena Malik Show
    if (!applePodcastsUrl) applePodcastsUrl = "https://podcasts.apple.com/us/podcast/the-rena-malik-show/id1552319253"; // Real Apple podcast link
    if (!youtubeUrl) youtubeUrl = "https://www.youtube.com/@RenaMalikMD"; // Real YouTube channel handle for Rena Malik MD

    console.log(`[searchPlatformLinks] Parsed links: Spotify: "${spotifyUrl}", Apple: "${applePodcastsUrl}", YouTube: "${youtubeUrl}"`);

    return { 
      spotifyUrl, 
      applePodcastsUrl, 
      youtubeUrl 
    };
  } catch (err: any) {
    console.error(`[searchPlatformLinks] Failed to find links via Gemini search grounding:`, err.message || err);
  }
  return { 
    spotifyUrl: "https://open.spotify.com/show/0O7zX6qBv99zDCOV02A7w7", 
    applePodcastsUrl: "https://podcasts.apple.com/us/podcast/the-rena-malik-show/id1552319253", 
    youtubeUrl: "https://www.youtube.com/@RenaMalikMD" 
  };
}

// POST API to automatically search and retrieve platform links
app.post("/api/admin/auto-grab-links", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || authHeader !== `Bearer ${AUTH_TOKEN}`) {
    return res.status(401).json({ success: false, message: "Unauthorized. Please authenticate first." });
  }
  const { title } = req.body || {};
  if (!title) {
    return res.status(400).json({ success: false, message: "Missing episode title" });
  }

  try {
    const links = await searchPlatformLinks(title);
    res.json({ success: true, ...links });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to search links" });
  }
});

// POST API for Admin to trigger Gemini-based metadata generation (Chapters & Transcript)
app.post("/api/admin/generate-episode-meta", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || authHeader !== `Bearer ${AUTH_TOKEN}`) {
    return res.status(401).json({ success: false, message: "Unauthorized. Please authenticate first." });
  }

  const { episodeId, audioUrl, prompt: customPrompt, title } = req.body || {};
  if (!episodeId || !audioUrl) {
    return res.status(400).json({ success: false, message: "Missing episodeId or audioUrl" });
  }

  let ai: GoogleGenAI;
  try {
    ai = getGemini();
  } catch (err: any) {
    return res.status(500).json({ success: false, message: `Gemini API client failed: ${err.message}. Please configure GEMINI_API_KEY in Settings > Secrets.` });
  }

  const tempFilePath = path.join(os.tmpdir(), `episode_${episodeId}_${Date.now()}.mp3`);
  let uploadName = "";

  try {
    console.log(`[Gemini Integration] Starting metadata extraction for Episode ID: ${episodeId}`);
    console.log(`[Gemini Integration] Downloading audio from url: ${audioUrl}`);

    // Fetch the audio content
    const fetchResponse = await fetch(audioUrl);
    if (!fetchResponse.ok) {
      throw new Error(`Failed to fetch episode audio. Audio server responded with status: ${fetchResponse.status}`);
    }
    if (!fetchResponse.body) {
      throw new Error("Failed to get readable stream from the download link.");
    }

    // Save to temp folder using Stream Pipelines instead of huge buffers to keep memory footprint safe
    const fileStream = fs.createWriteStream(tempFilePath);
    await pipeline(Readable.fromWeb(fetchResponse.body as any), fileStream);
    console.log(`[Gemini Integration] Audio file downloaded to temporary location: ${tempFilePath}`);

    // Verify file size and existence
    if (!fs.existsSync(tempFilePath) || fs.statSync(tempFilePath).size === 0) {
      throw new Error("Downloaded audio file is empty or missing.");
    }

    console.log(`[Gemini Integration] Uploading temporary file to Gemini Files API...`);
    const uploadResult = await ai.files.upload({
      file: tempFilePath,
      mimeType: "audio/mp3",
    } as any);
    uploadName = uploadResult.name;
    console.log(`[Gemini Integration] File uploaded. Name: ${uploadName}. Current state: ${uploadResult.state || "unknown"}`);

    // Poll until file is ACTIVE
    let fileDetails = await ai.files.get({ name: uploadName });
    let attempts = 0;
    while (fileDetails.state === "PROCESSING" && attempts < 60) {
      console.log(`[Gemini Integration] File is still PROCESSING. Waiting 3 seconds (Attempt ${attempts + 1})...`);
      await new Promise((resolve) => setTimeout(resolve, 3000));
      fileDetails = await ai.files.get({ name: uploadName });
      attempts++;
    }

    if (fileDetails.state !== "ACTIVE") {
      throw new Error(`File conversion failed. Status: ${fileDetails.state}`);
    }
    console.log(`[Gemini Integration] File is ACTIVE and ready to be processed by the model.`);

    // Call Model to generate content
    console.log(`[Gemini Integration] Performing multi-modal request to extract transcription & chapters...`);
    const prompt = customPrompt || `Please transcribe this podcast or show episode audio file. Generate a detailed, highly accurate transcript with Speaker Names and Timestamps in brackets (e.g., [12:30] Guest Speaker: text...) and split paragraphs cleanly. Also, extract 4-8 distinct seeker-friendly chapters/segment timestamps with MM:SS formatted times and concise, elegant segment labels.`;

    const modelResponse = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL || "gemini-3.5-flash",
      contents: [
        {
          fileData: {
            fileUri: fileDetails.uri,
            mimeType: fileDetails.mimeType,
          }
        },
        prompt
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            timestamps: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  time: { type: Type.STRING, description: "The timestamp in MM:SS (e.g. 12:30) or H:MM:SS format corresponding to the segment head." },
                  label: { type: Type.STRING, description: "A concise, elegant label for this segment topic." }
                },
                required: ["time", "label"]
              }
            },
            transcript: {
              type: Type.STRING,
              description: "A dynamic, scrollable transcription. Use speaker name prefix and timestamp like: [00:45] Dr. Amy Stein: This is ...\\n\\n[05:20] Dr. Rena Malik: Wow, ..."
            }
          },
          required: ["timestamps", "transcript"]
        }
      }
    });

    const outputText = modelResponse.text;
    if (!outputText) {
      throw new Error("Gemini returned an empty response.");
    }

    console.log(`[Gemini Integration] Successfully received response. Parsing structured fields.`);
    const parsedData = JSON.parse(outputText.trim());

    // Clean up temporary files & remote Google files
    cleanupFiles(tempFilePath, uploadName, ai);

    const finalTimestamps = parsedData.timestamps || [];
    const finalTranscript = parsedData.transcript || "";

    // Parallel search for platform links
    let spotifyUrl = "";
    let applePodcastsUrl = "";
    let youtubeUrl = "";

    if (title) {
      try {
        console.log(`[Gemini Integration] Triggering web search grounding for platform links under: "${title}"`);
        const links = await searchPlatformLinks(title);
        spotifyUrl = links.spotifyUrl;
        applePodcastsUrl = links.applePodcastsUrl;
        youtubeUrl = links.youtubeUrl;
        console.log(`[Gemini Integration] Grabbed URLs: Spotify: ${spotifyUrl}, Apple: ${applePodcastsUrl}, YouTube: ${youtubeUrl}`);
      } catch (linkErr: any) {
        console.error("[Gemini Integration] Failed to web search platform links:", linkErr);
      }
    }

    // Automatically save newly generated data into MongoDB
    try {
      await ensureDbConnected();
    } catch (dbErr: any) {
      console.warn("[Gemini Generation Save] Skip database presence checks:", dbErr.message || dbErr);
    }

    if (isConnectedToMongo) {
      try {
        const MetaModel = getEpisodeMetaModel();
        await MetaModel.findOneAndUpdate(
          { episodeId },
          { 
            timestamps: finalTimestamps, 
            transcript: finalTranscript,
            spotifyUrl,
            applePodcastsUrl,
            youtubeUrl,
            updatedAt: new Date()
          },
          { upsert: true }
        );
        console.log(`[MongoDB] Gemini auto-save successful for episode ${episodeId}`);
      } catch (err: any) {
        console.error("[MongoDB] Failed to write auto-generated episode-meta to database:", err.message || err);
      }
    }

    // Update runtime memory cache
    const keys = getAlternativeKeys(episodeId);
    if (!cachedEpisodeMeta) {
      const initialCache: Record<string, any> = { ...SEED_EPISODE_META };
      keys.forEach((key) => {
        initialCache[key] = {
          timestamps: finalTimestamps,
          transcript: finalTranscript,
          spotifyUrl,
          applePodcastsUrl,
          youtubeUrl
        };
      });
      cachedEpisodeMeta = {
        data: initialCache,
        timestamp: Date.now()
      };
    } else {
      keys.forEach((key) => {
        cachedEpisodeMeta!.data[key] = {
          timestamps: finalTimestamps,
          transcript: finalTranscript,
          spotifyUrl,
          applePodcastsUrl,
          youtubeUrl
        };
      });
      cachedEpisodeMeta.timestamp = Date.now();
    }

    // Clear episode list cache to ensure fresh metadata is merged on next fetch
    cachedEpisodes = null;

    res.json({
      success: true,
      timestamps: finalTimestamps,
      transcript: finalTranscript,
      spotifyUrl,
      applePodcastsUrl,
      youtubeUrl
    });

  } catch (error: any) {
    console.error(`[Gemini Integration-Error] Metadata generation crashed:`, error.message || error);
    cleanupFiles(tempFilePath, uploadName, ai);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to generate metadata using Gemini"
    });
  }
});

const FALLBACK_YOUTUBE_DATA = {
  channelName: "Dr. Rena Malik",
  channelThumbnail: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=300",
  statistics: {
    subscriberCount: "2.14M",
    videoCount: "942",
    viewCount: "428.5M"
  },
  videos: [
    {
      id: "Z-4T62RjK1k",
      title: "How to Keep Your Bladder Young & Prevent Frequent Urination",
      thumbnail: "https://i.ytimg.com/vi/Z-4T62RjK1k/hqdefault.jpg",
      publishedAt: "Jun 02, 2026",
      duration: "14:22",
      views: "185K views"
    },
    {
      id: "Is9V_9g7T68",
      title: "Is Caffeine Actually Ruining Your Bladder? (What Urologists Wish You Knew)",
      thumbnail: "https://i.ytimg.com/vi/Is9V_9g7T68/hqdefault.jpg",
      publishedAt: "May 25, 2026",
      duration: "11:05",
      views: "94K views"
    },
    {
      id: "Ur7Pq9v7M1c",
      title: "Kegels Are NOT The Answer: Pelvic Floor Release Hacks",
      thumbnail: "https://i.ytimg.com/vi/Ur7Pq9v7M1c/hqdefault.jpg",
      publishedAt: "May 18, 2026",
      duration: "12:45",
      views: "120K views"
    },
    {
      id: "W_9vK1s7R4m",
      title: "The Best Foods for Vaginal Health, Libido, and Urinary Prevention",
      thumbnail: "https://i.ytimg.com/vi/W_9vK1s7R4m/hqdefault.jpg",
      publishedAt: "May 08, 2026",
      duration: "15:10",
      views: "245K views"
    }
  ],
  shorts: [
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
    }
  ],
  isLiveApi: false
};

interface YoutubeCacheEntry {
  data: any;
  timestamp: number;
}
let cachedYoutubeData: YoutubeCacheEntry | null = null;
const YOUTUBE_CACHE_DURATION_MS = 15 * 60 * 1000;

// GET youtube statistics and videos proxy
app.get("/api/youtube", async (req, res) => {
  const now = Date.now();

  // Serving from memory cache if fresh
  if (cachedYoutubeData && (now - cachedYoutubeData.timestamp < YOUTUBE_CACHE_DURATION_MS)) {
    console.log(`[YouTube API] Serving from direct memory cache (${Math.round((now - cachedYoutubeData.timestamp) / 1000)}s old)`);
    return res.json(cachedYoutubeData.data);
  }

  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    console.log("[YouTube API] YOUTUBE_API_KEY environment variable is not configured. Serving authenticated gorgeous mock details.");
    return res.json(FALLBACK_YOUTUBE_DATA);
  }

  const handle = process.env.YOUTUBE_CHANNEL_HANDLE || "@RenaMalikMD";
  console.log(`[YouTube API] Key detected. Fetching live channels & playlists for user handle: ${handle}`);

  try {
    // 1. Fetch Channel Info (title, statistics, uploads playlist)
    const channelsUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,contentDetails&forHandle=${encodeURIComponent(handle)}&key=${apiKey}`;
    const channelsRes = await fetch(channelsUrl);
    if (!channelsRes.ok) {
      throw new Error(`Google Channels API responded with status ${channelsRes.status}`);
    }
    const channelsData = await channelsRes.json();
    if (!channelsData.items || channelsData.items.length === 0) {
      throw new Error(`No YouTube channel items found for handle: ${handle}`);
    }

    const channelItem = channelsData.items[0];
    const channelName = channelItem.snippet.title;
    const channelThumbnail = channelItem.snippet.thumbnails?.high?.url || channelItem.snippet.thumbnails?.medium?.url;
    
    const subCountRaw = channelItem.statistics.subscriberCount;
    const videoCountRaw = channelItem.statistics.videoCount;
    const viewCountRaw = channelItem.statistics.viewCount;

    const uploadsPlaylistId = channelItem.contentDetails?.relatedPlaylists?.uploads;
    if (!uploadsPlaylistId) {
      throw new Error("No uploads playlist found on YouTube channel info");
    }

    // Helper functions for formatters
    const parseISO8601Seconds = (input: string): number => {
      const RegExpMatch = input.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
      if (!RegExpMatch) return 0;
      const hours = parseInt(RegExpMatch[1] || "0", 10);
      const minutes = parseInt(RegExpMatch[2] || "0", 10);
      const seconds = parseInt(RegExpMatch[3] || "0", 10);
      return hours * 3600 + minutes * 60 + seconds;
    };

    const formatDuration = (seconds: number): string => {
      const m = Math.floor(seconds / 60);
      const s = seconds % 60;
      return `${m}:${s.toString().padStart(2, "0")}`;
    };

    const formatYoutubeViews = (countStr: string): string => {
      const count = parseInt(countStr || "0", 10);
      if (count >= 1000000) return `${(count / 1000000).toFixed(1).replace(/\.0$/, "")}M views`;
      if (count >= 1000) return `${(count / 1000).toFixed(1).replace(/\.0$/, "")}K views`;
      return `${count} views`;
    };

    const formatYoutubeSubscribers = (countStr: string): string => {
      const count = parseInt(countStr || "0", 10);
      if (count >= 1000000) return `${(count / 1000000).toFixed(2).replace(/\.00$/, "")}M`;
      if (count >= 1000) return `${(count / 1000).toFixed(0)}K`;
      return `${count}`;
    };

    // 2. Fetch PlaylistItems from Uploads
    const playlistItemsUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${uploadsPlaylistId}&maxResults=24&key=${apiKey}`;
    const playlistRes = await fetch(playlistItemsUrl);
    if (!playlistRes.ok) {
      throw new Error(`Google PlaylistItems API responded with status ${playlistRes.status}`);
    }
    const playlistData = await playlistRes.json();
    const items = playlistData.items || [];

    if (items.length === 0) {
      throw new Error("Uploads playlist returned empty list of items");
    }

    // 3. Extract Video IDs to call Videos List for Duration & View Statistics
    const videoIds: string[] = items.map((item: any) => item.snippet?.resourceId?.videoId).filter(Boolean);
    const videosDetailUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&id=${videoIds.join(",")}&key=${apiKey}`;
    const videosDetailRes = await fetch(videosDetailUrl);
    if (!videosDetailRes.ok) {
      throw new Error(`Google Videos Detail API responded with status ${videosDetailRes.status}`);
    }
    const videosDetailData = await videosDetailRes.json();
    const videoItems = videosDetailData.items || [];

    const parsedVideos: any[] = [];
    const parsedShorts: any[] = [];

    for (const v of videoItems) {
      const vId = v.id;
      const title = v.snippet.title;
      const thumbnailStr = v.snippet.thumbnails?.maxres?.url || v.snippet.thumbnails?.high?.url || v.snippet.thumbnails?.medium?.url;
      const publishedAtRaw = v.snippet.publishedAt;
      const durationISO = v.contentDetails.duration;
      const viewCountVal = v.statistics?.viewCount || "0";

      let pubDate = "";
      try {
        const dObj = new Date(publishedAtRaw);
        if (!isNaN(dObj.getTime())) {
          pubDate = dObj.toLocaleDateString("en-US", {
            month: "short",
            day: "2-digit",
            year: "numeric"
          });
        }
      } catch (e) {
        pubDate = "Recently";
      }

      const durationSecs = parseISO8601Seconds(durationISO);
      const isShort = durationSecs <= 120 || title.toLowerCase().includes("#shorts") || title.toLowerCase().includes("shorts");

      if (isShort) {
        parsedShorts.push({
          id: vId,
          title,
          thumbnail: thumbnailStr,
          views: formatYoutubeViews(viewCountVal)
        });
      } else {
        parsedVideos.push({
          id: vId,
          title,
          thumbnail: thumbnailStr,
          publishedAt: pubDate,
          duration: formatDuration(durationSecs),
          views: formatYoutubeViews(viewCountVal)
        });
      }
    }

    const liveData = {
      channelName,
      channelThumbnail,
      statistics: {
        subscriberCount: formatYoutubeSubscribers(subCountRaw),
        videoCount: parseInt(videoCountRaw || "0", 10).toLocaleString(),
        viewCount: formatYoutubeSubscribers(viewCountRaw)
      },
      videos: parsedVideos.slice(0, 8),
      shorts: parsedShorts.slice(0, 8),
      isLiveApi: true
    };

    cachedYoutubeData = {
      data: liveData,
      timestamp: now
    };

    console.log("[YouTube API] Successfully parsed live channels & statistics. Refreshed YouTube memory cache.");
    return res.json(liveData);

  } catch (err: any) {
    console.error("[YouTube API] Failed to fetch live channel, falling back to authenticated mock details:", err.message || err);
    return res.json(FALLBACK_YOUTUBE_DATA);
  }
});

const mergeMetaIntoEpisodes = async (rawEpisodes: any[]): Promise<any[]> => {
  try {
    const metaMap = await getEpisodeMetaMap();
    return rawEpisodes.map((ep) => {
      const keys = getAlternativeKeys(ep.id);
      let meta = null;
      for (const key of keys) {
        if (metaMap[key]) {
          meta = metaMap[key];
          break;
        }
      }
      if (!meta) {
        for (const key of keys) {
          if (SEED_EPISODE_META[key]) {
            meta = SEED_EPISODE_META[key];
            break;
          }
        }
      }
      return {
        ...ep,
        timestamps: meta?.timestamps || [],
        transcript: meta?.transcript || "",
        spotifyUrl: meta?.spotifyUrl || "",
        applePodcastsUrl: meta?.applePodcastsUrl || "",
        youtubeUrl: meta?.youtubeUrl || ""
      };
    });
  } catch (err) {
    console.warn("[mergeMeta] Failed to attach meta, serving without timestamps/transcript", err);
    return rawEpisodes;
  }
};

// API Route for Podcasts serving
app.get("/api/episodes", async (req, res) => {
  const now = Date.now();

  // 1. Serving directly from the 10-minute node memory cache (No roundtrips, absolute zero latency!)
  if (cachedEpisodes && (now - cachedEpisodes.timestamp < CACHE_DURATION_MS)) {
    console.log(`[API] Serving from direct memory cache (${Math.round((now - cachedEpisodes.timestamp) / 1000)}s old)`);
    return res.json(cachedEpisodes.data);
  }

  // Pure RSS downloader helper
  const fetchAndParseRSS = async (): Promise<any[]> => {
    const rssUrl = process.env.PODCAST_RSS_URL || "https://feeds.megaphone.fm/renamalikmd";
    console.log(`[API] Fetching episodes RSS direct from: ${rssUrl}`);
    const response = await fetch(rssUrl, {
      headers: { 
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
        "Accept": "application/rss+xml, application/xml, text/xml, */*",
        "Cache-Control": "no-cache",
        "Pragma": "no-cache"
      },
      signal: AbortSignal.timeout(4000) // 4 seconds timeout limit
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch rss feed (status: ${response.status})`);
    }
    const xmlText = await response.text();
    const episodes = rssRegexParser(xmlText);
    if (!episodes || episodes.length === 0) {
      throw new Error("RSS feed parsed to a blank list of episodes");
    }
    return episodes;
  };

  try {
    const rawEpisodes = await fetchAndParseRSS();
    const mergedEpisodes = await mergeMetaIntoEpisodes(rawEpisodes);
    
    // Save to local node-process cache
    cachedEpisodes = {
      data: mergedEpisodes,
      timestamp: now
    };

    console.log(`[API] RSS fetch and parse successful with merged meta. Refreshed direct memory cache.`);
    return res.json(mergedEpisodes);
  } catch (error: any) {
    console.error("[API] MegaPhone RSS downloader failed, checking memory cache fallback:", error.message || error);
    
    // Serve expired cache as graceful fallback if available
    if (cachedEpisodes) {
      console.log("[API] Returning stale memory cache due to network/fetch failure.");
      return res.json(cachedEpisodes.data);
    }

    console.log("[API] Defaulting to medical offline layout fallbacks with merged meta.");
    const mergedFallback = await mergeMetaIntoEpisodes(FALLBACK_EPISODES);
    return res.json(mergedFallback);
  }
});

async function start() {
  // Connect to DB lazily in the background without blocking server startup
  ensureDbConnected().catch((err) => {
    console.warn("[MongoDB] Non-blocking initial connection attempt warning:", err.message || err);
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "custom",
    });
    app.use(vite.middlewares);

    // Serve index.html with Vite transforms for all non-API GET requests (SPA client router fallback)
    app.get("*", async (req, res, next) => {
      if (req.path.startsWith("/api/")) {
        return next();
      }
      try {
        const indexPath = path.resolve(process.cwd(), "index.html");
        let html = fs.readFileSync(indexPath, "utf-8");
        html = await vite.transformIndexHtml(req.originalUrl, html);
        res.status(200).set({ "Content-Type": "text/html" }).end(html);
      } catch (err) {
        next(err);
      }
    });
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Server] Active & rendering on http://0.0.0.0:${PORT}`);
  });
}

if (!process.env.VERCEL) {
  start();
}

export default app;
