/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Episode {
  id: string;
  number: number;
  title: string;
  guest: string;
  guestTitle: string;
  duration: string;
  publishedAt: string;
  category: string;
  description: string;
  audioUrl: string;
  youtubeId?: string;
  tags: string[];
  timestamps?: Array<{ time: string; label: string }>;
  transcript?: string;
  spotifyUrl?: string;
  applePodcastsUrl?: string;
  youtubeUrl?: string;
}

export interface PodcastCategory {
  id: string;
  title: string;
  description: string;
  iconName: string;
  episodeCount: number;
}

export interface PlatformLink {
  name: string;
  url: string;
  iconName: string;
  colorClass: string;
}

// Static Data for "The Rena Malik Show"
export const podcastCategories: PodcastCategory[] = [
  {
    id: "urology",
    title: "Urology Demystified",
    description: "The science of bladder health, kidney stones, prostate care, and cutting-edge urological treatments.",
    iconName: "Activity",
    episodeCount: 48,
  },
  {
    id: "sexual-health",
    title: "Sexual Wellness",
    description: "Taboo-free, science-backed discussions about performance, satisfaction, hormones, and physical wellness.",
    iconName: "Flame",
    episodeCount: 74,
  },
  {
    id: "pelvic-floor",
    title: "Pelvic Floor Power",
    description: "Expert guidance on pelvic muscle training, core stability, rehabilitation, and full-body posture.",
    iconName: "Shield",
    episodeCount: 32,
  },
  {
    id: "relationships",
    title: "Intimacy & Science",
    description: "Deep dives with world-class psychologists and sex researchers into communication, desire, and connection.",
    iconName: "Heart",
    episodeCount: 55,
  },
];

export const platformLinks: PlatformLink[] = [
  {
    name: "YouTube",
    url: "https://youtube.com/@renamalikmd",
    iconName: "Youtube",
    colorClass: "hover:text-red-500",
  },
  {
    name: "Spotify",
    url: "https://open.spotify.com/show/30xyW3ExCD3f9FZR8Wf2Mn",
    iconName: "Radio",
    colorClass: "hover:text-green-500",
  },
  {
    name: "Apple Podcasts",
    url: "https://podcasts.apple.com/us/podcast/rena-malik-md-podcast/id1709412238",
    iconName: "Podcast",
    colorClass: "hover:text-purple-400",
  },
  {
    name: "Amazon Music",
    url: "https://music.amazon.com",
    iconName: "Music",
    colorClass: "hover:text-blue-400",
  },
];

export const podcastEpisodes: Episode[] = [
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
    tags: ["Pelvic Floor", "Muscle Release", "Core Strength"],
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
    tags: ["Libido", "Psychology", "Intimacy"],
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
    tags: ["Urology", "Bladder Health", "Hydration Tips"],
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
    tags: ["Relationships", "Stress Reduction", "Longevity"],
  },
];
