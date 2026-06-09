/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Star, 
  ChevronRight, 
  Plus, 
  Check, 
  X, 
  ArrowLeft, 
  ArrowRight
} from "lucide-react";

interface Review {
  id: string;
  title: string;
  rating: number;
  author: string;
  date: string;
  content: string;
}

const initialReviews: Review[] = [
  {
    id: "review-1",
    title: "Excellent",
    rating: 5,
    author: "Juan Requena Pelucarte",
    date: "May 29",
    content: "Thank you so much for all the knowledge and passion."
  },
  {
    id: "review-2",
    title: "Prostate health",
    rating: 5,
    author: "Z1OBG",
    date: "Feb 7",
    content: "A few months ago I was diagnosed with grade group 1 prostate cancer and I found the episode with Dr. Scott Eggener exploring prostate cancer screening, diagnosis very informative."
  },
  {
    id: "review-3",
    title: "Doc Rena's the GOAT",
    rating: 5,
    author: "MichianaMan",
    date: "11/06/2025",
    content: "Everything you ever wanted to know about making your hog be all it can be. Take lots of notes fellas."
  },
  {
    id: "review-4",
    title: "Good pod",
    rating: 3,
    author: "CaliVet2025",
    date: "Jan 27",
    content: "Didn't like the schilling out for test pod. Just remind people to do the work. Don't rely on supps or test."
  },
  {
    id: "review-5",
    title: "Are you settling for less sex...",
    rating: 5,
    author: "EddieOakland",
    date: "06/06/2025",
    content: "As a male I have learned a great deal from Dr. Malik's podcasts. Her guests are always knowledgeable and I always come away with more knowledge. Men should subscribe."
  },
  {
    id: "review-6",
    title: "Steve",
    rating: 5,
    author: "acker44",
    date: "12/27/2024",
    content: "I listen to your shows because as I call it . I am in the \"Odman stage of life\" I went to my urologist about dripping and he installed an urology. But I have had seizure for most of my life..."
  },
  {
    id: "review-7",
    title: "Fantastic",
    rating: 5,
    author: "ry5838",
    date: "06/10/2024",
    content: "Such an insightful and helpful podcast. So much to learn!"
  },
  {
    id: "review-8",
    title: "Very informative",
    rating: 4,
    author: "Vincha7",
    date: "06/10/2024",
    content: "Dr Rena has been remarkable in the education"
  },
  {
    id: "review-9",
    title: "Educational",
    rating: 5,
    author: "Tyler_63",
    date: "06/10/2024",
    content: "Very educational listen"
  },
  {
    id: "review-10",
    title: "Great information on a wide...",
    rating: 5,
    author: "Azcanuck1971",
    date: "06/10/2024",
    content: "I came to listen first, about men's health, and issues pertaining to urology. But find, the other topics quite good, as well!"
  },
  {
    id: "review-11",
    title: "Extremely interesting and...",
    rating: 5,
    author: "cutie13754",
    date: "06/10/2024",
    content: "Many useful tips and knowledge to make relationships enjoyable."
  },
  {
    id: "review-12",
    title: "Informative & fun",
    rating: 5,
    author: "JJ77389",
    date: "06/10/2024",
    content: "Dr. Rena Malik's podcast is a must-listen! She turns complex health topics into easy-to-understand, fun conversations. From urology to sexual health, her insights are both informative and fun."
  },
  {
    id: "review-13",
    title: "Really Informative",
    rating: 5,
    author: "light_listener",
    date: "06/09/2024",
    content: "This podcast provides so much information on such a variety of topics! It's easy to stay engaged while listening!"
  },
  {
    id: "review-14",
    title: "Educational",
    rating: 5,
    author: "J_014",
    date: "06/09/2024",
    content: "Lots of topics to learn from and listen too!"
  },
  {
    id: "review-15",
    title: "Her YouTube Caught My Eye,...",
    rating: 5,
    author: "Noahsarcane",
    date: "06/09/2024",
    content: "The YouTube algo brought me to Rena and I was happy to discover her podcast. She gives a friendly, down-to-earth exploration of many different topics. If one doesn't apply to my case, there's always another helpful episode."
  },
  {
    id: "review-16",
    title: "Good podcast",
    rating: 5,
    author: "Ksax2006",
    date: "06/09/2024",
    content: "Dr. Malik provides a very educational and informative podcast platform. A vast variety of subjects providing a multitude of people with new information."
  },
  {
    id: "review-17",
    title: "I want to ask more...",
    rating: 5,
    author: "MasterJackZer0",
    date: "06/09/2024",
    content: "I have lots of chronic illnesses and chronic pain. I want to ask more spine specialists and rheumatologists and pelvic specialists and I want to know how that can affect sexual health."
  },
  {
    id: "review-18",
    title: "I've learned so much",
    rating: 5,
    author: "Shuag909",
    date: "06/09/2024",
    content: "These podcasts have opened my mind to so much !"
  },
  {
    id: "review-19",
    title: "Love this podcast!",
    rating: 5,
    author: "ctyfghy",
    date: "06/08/2024",
    content: "This podcast is very informative! I absolutely love listening to it. One of my favorites. Doc is great."
  },
  {
    id: "review-20",
    title: "Interesting Topics",
    rating: 4,
    author: "Macca Guy",
    date: "06/08/2024",
    content: "Great podcast; covers subjects that are impacting us all, but that you don't usually talk about! Provides some great information."
  },
  {
    id: "review-21",
    title: "Exceptional and Insightful!",
    rating: 5,
    author: "Alessandro CMB",
    date: "06/08/2024",
    content: "Dr. Rena Malik's podcast is an absolute gem! Her deep knowledge and passion for urology and pelvic health shine through in every episode. She has a remarkable ability to explain complex topics."
  },
  {
    id: "review-22",
    title: "Apple Podcast Review",
    rating: 5,
    author: "moejoetho",
    date: "06/08/2024",
    content: "I really like the fact that Dr. Malik brings other professionals to do her podcast. And the topics are not just about sexual intercourse. She talks about the entire sexual reproduction system and health aspects."
  },
  {
    id: "review-23",
    title: "Solid medical advice from a...",
    rating: 5,
    author: "Tanner2260",
    date: "06/08/2024",
    content: "So many topics of interest! Really enjoy the host and guests."
  },
  {
    id: "review-24",
    title: "Sexual Health!",
    rating: 5,
    author: "DaExtreme808",
    date: "06/08/2024",
    content: "As A Late 50's Married (Twice) Heterosexual Male w/ Three Children Two From My Wife's Previous Marriage & One Between Us. We Are Both In Our 50's. Menopause Destroyed our sexual flow and these episodes are helping us rebuild."
  },
  {
    id: "review-25",
    title: "Factual and Informative!",
    rating: 5,
    author: "Nate825",
    date: "06/08/2024",
    content: "Great useful information for a world that sometimes can consider the topic so taboo and makes it hard to get true reliable information. Truly a great helpful source!"
  },
  {
    id: "review-26",
    title: "More doctor-based podcasts!",
    rating: 5,
    author: "Hungncurious",
    date: "06/08/2024",
    content: "I really prefer informed, scientific information over gossip, clickbait. This great science about \"taboo\" that everyone has to deal with."
  },
  {
    id: "review-27",
    title: "lots of topics very intresting",
    rating: 5,
    author: "Hntimaster",
    date: "06/08/2024",
    content: "Just started listing but its very intresting and educational so far!"
  },
  {
    id: "review-28",
    title: "Informational",
    rating: 5,
    author: "S4mmy17",
    date: "06/08/2024",
    content: "Always like to listen to the latest tips and findings."
  },
  {
    id: "review-29",
    title: "Relationship Saver",
    rating: 5,
    author: "RichHomieKim",
    date: "06/08/2024",
    content: "This podcast saved my relationship! I have learned to be more aware of my partners needs and have a deeper understanding of healthy sexual habits. My partner and I have gained precious balance."
  },
  {
    id: "review-30",
    title: "Great show",
    rating: 5,
    author: "FresnoBrian",
    date: "06/08/2024",
    content: "I've been subscribed to her on YouTube for a long time now, this is a very interesting show."
  }
];

interface TestimonialColumnProps {
  testimonials: Review[];
  duration: number;
}

function TestimonialColumn({ testimonials, duration }: TestimonialColumnProps) {
  const duplicated = [...testimonials, ...testimonials];

  return (
    <div className="overflow-hidden h-full">
      <motion.div
        className="flex flex-col gap-4 py-2"
        animate={{ y: ["0%", "-50%"] }}
        transition={{
          duration: duration,
          ease: "linear",
          repeat: Infinity,
          repeatType: "loop",
        }}
      >
        {duplicated.map((rev, idx) => (
          <div 
            key={`${rev.id}-${idx}`}
            className="w-full bg-[#363636] border border-zinc-900/10 rounded-lg p-6 flex flex-col gap-4 relative"
          >
            {/* Header Grid */}
            <div className="flex flex-col gap-1.5 w-full">
              {/* Row 1: Title & Date (Exactly like screenshot) */}
              <div className="flex justify-between items-baseline w-full">
                <h3 className="font-bold text-white text-[16px] sm:text-[17px] tracking-tight leading-tight">
                  {rev.title}
                </h3>
                <span className="text-[13px] text-[#8e8e93] font-normal shrink-0">
                  {rev.date}
                </span>
              </div>

              {/* Row 2: Star Ratings & Author Name (Exactly like screenshot) */}
              <div className="flex justify-between items-center w-full mt-0.5">
                <div className="flex items-center gap-[2.5px]">
                  {Array.from({ length: 5 }).map((_, fS) => (
                    <Star 
                      key={fS}
                      size={13} 
                      className={fS < rev.rating ? "text-[#ff9500] fill-[#ff9500]" : "text-[#48484a] fill-[#48484a]"} 
                    />
                  ))}
                </div>
                
                <span className="text-[13px] text-[#8e8e93] truncate max-w-[170px]">
                  {rev.author}
                </span>
              </div>
            </div>

            {/* Body Content */}
            <p className="text-[14px] sm:text-[15px] text-[#e5e5ea] font-normal leading-relaxed mt-1">
              {rev.content}
            </p>
          </div>
        ))}
      </motion.div>
    </div>
  );
}

export default function RatingsReviewsSection() {
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [isSubmitOpen, setIsSubmitOpen] = useState(false);
  
  // Custom Form state
  const [newTitle, setNewTitle] = useState("");
  const [newRating, setNewRating] = useState(5);
  const [newAuthor, setNewAuthor] = useState("");
  const [newContent, setNewContent] = useState("");
  const [validationError, setValidationError] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const handleAddReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newAuthor.trim() || !newContent.trim()) {
      setValidationError("Please fill out all fields.");
      return;
    }
    
    const newRev: Review = {
      id: `review-custom-${Date.now()}`,
      title: newTitle,
      rating: newRating,
      author: newAuthor,
      date: "Today",
      content: newContent
    };

    setReviews([newRev, ...reviews]);
    setIsSuccess(true);
    setValidationError("");
    
    // reset form
    setNewTitle("");
    setNewRating(5);
    setNewAuthor("");
    setNewContent("");

    setTimeout(() => {
      setIsSuccess(false);
      setIsSubmitOpen(false);
    }, 2000);
  };

  const col1 = reviews.filter((_, idx) => idx % 3 === 0);
  const col2 = reviews.filter((_, idx) => idx % 3 === 1);
  const col3 = reviews.filter((_, idx) => idx % 3 === 2);

  return (
    <section 
      id="ratings-and-reviews-section" 
      className="w-full bg-page-bg pt-16 pb-20 px-5 sm:px-8 md:px-12 relative select-none"
    >
      <div className="max-w-7xl mx-auto flex flex-col gap-8">
        
        {/* Header Title */}
        <div className="flex items-center gap-1.5 w-fit select-none">
          <h2 className="text-[22px] sm:text-[24px] font-extrabold tracking-wider text-white uppercase">
            Ratings & Reviews
          </h2>
        </div>

        {/* Global Rating Stats Block - EXACT STYLE from Apple Podcasts screenshot */}
        <div id="ratings-summary-block" className="flex items-start gap-6 sm:gap-8 max-w-md select-none mt-1">
          
          {/* Big Score Column */}
          <div className="flex flex-col items-center shrink-0">
            <span className="text-[72px] sm:text-[84px] font-[800] text-white tracking-tighter leading-none">
              4.8
            </span>
            <span className="text-[13px] sm:text-[14px] text-[#8e8e93] font-semibold mt-1">
              out of 5
            </span>
          </div>

          {/* Star Cascade and Bars Column */}
          <div className="flex-grow flex flex-col gap-[7.5px] pt-2">
            
            {/* Stars Stack (5 Row right-aligned cascade with progress lines) */}
            {[
              { stars: 5, fillPercent: "85%" },
              { stars: 4, fillPercent: "8%" },
              { stars: 3, fillPercent: "4%" },
              { stars: 2, fillPercent: "2%" },
              { stars: 1, fillPercent: "1%" },
            ].map((row, index) => (
              <div key={index} className="flex items-center gap-3 w-full">
                
                {/* Micro stars column - matches cascading width exactly by right-aligning */}
                <div className="w-[50px] flex justify-end gap-[1px] select-none" aria-hidden="true">
                  {Array.from({ length: 5 }).map((_, starIdx) => {
                    const isVisible = starIdx >= 5 - row.stars;
                    return (
                      <span 
                        key={starIdx} 
                        className={`text-[8px] leading-none select-none transition-opacity ${
                          isVisible ? "text-[#8e8e93]" : "text-transparent pointer-events-none"
                        }`}
                      >
                        ★
                      </span>
                    );
                  })}
                </div>

                {/* Progress bar line */}
                <div className="flex-grow h-[3px] bg-[#2c2c2e] rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[#9DAAF2] rounded-full" 
                    style={{ width: row.fillPercent }}
                  />
                </div>
              </div>
            ))}

            {/* Total Ratings Count */}
            <div className="text-right w-full mt-2">
              <span className="text-[13px] text-[#8e8e93] font-medium tracking-tight">
                291 Ratings
              </span>
            </div>

          </div>

        </div>

        {/* Infinite Vertical Marquee Review Feed */}
        <div 
          className="relative h-[600px] overflow-hidden mt-6 w-full select-none"
          style={{
            maskImage: "linear-gradient(to bottom, transparent, black 12%, black 88%, transparent)",
            WebkitMaskImage: "linear-gradient(to bottom, transparent, black 12%, black 88%, transparent)",
          }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 h-full w-full">
            {/* Column 1 (displayed on all screens) */}
            <div className="h-full">
              <TestimonialColumn testimonials={col1} duration={15} />
            </div>

            {/* Column 2 (displayed on md and up - tablet/desktop) */}
            <div className="hidden md:block h-full">
              <TestimonialColumn testimonials={col2} duration={17} />
            </div>

            {/* Column 3 (displayed on lg and up - desktop) */}
            <div className="hidden lg:block h-full">
              <TestimonialColumn testimonials={col3} duration={19} />
            </div>
          </div>
        </div>

      </div>

      {/* Write a Review Overlay Form modal */}
      <AnimatePresence>
        {isSubmitOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-[#363636] border border-zinc-800 rounded-lg p-6 sm:p-8 w-full max-w-md shadow-2xl relative"
            >
              {/* Close Button */}
              <button 
                onClick={() => setIsSubmitOpen(false)}
                className="absolute top-4 right-4 w-7 h-7 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
                aria-label="Close modal"
              >
                <X size={14} />
              </button>

              <h3 className="text-lg sm:text-xl font-extrabold text-white uppercase tracking-tight mb-4">
                Write a Review
              </h3>

              {isSuccess ? (
                <div className="py-12 flex flex-col items-center justify-center text-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <Check size={24} />
                  </div>
                  <h4 className="text-sm font-extrabold text-white uppercase tracking-wider">
                    Thank you!
                  </h4>
                  <p className="text-xs text-zinc-400 font-medium max-w-xs leading-relaxed">
                    Your review has been successfully submitted and indexed onto the platform stream.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleAddReview} className="flex flex-col gap-4">
                  {validationError && (
                    <div className="text-xs text-rose-400 font-bold uppercase tracking-wider">
                      ⚠ {validationError}
                    </div>
                  )}

                  {/* Rating Selector */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-zinc-400">
                      Select Rating
                    </label>
                    <div className="flex items-center gap-1.5">
                      {[1, 2, 3, 4, 5].map((stars) => (
                        <button
                          key={stars}
                          type="button"
                          onClick={() => setNewRating(stars)}
                          className="p-1 focus:outline-none transition-transform hover:scale-110 active:scale-95 cursor-pointer"
                        >
                          <Star 
                            size={20} 
                            className={stars <= newRating ? "text-amber-500 fill-amber-500" : "text-zinc-700 hover:text-amber-500"} 
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Review Title */}
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="review-title-input" className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-zinc-400">
                      Review Title
                    </label>
                    <input 
                      id="review-title-input"
                      type="text" 
                      required
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      placeholder="e.g. Incredibly Insightful..." 
                      className="w-full bg-[#363636] border border-zinc-800 rounded-lg px-3 py-2 text-xs sm:text-[13px] text-white focus:outline-none focus:border-accent"
                    />
                  </div>

                  {/* Author / Name */}
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="review-author-input" className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-zinc-400">
                      Your Name
                    </label>
                    <input 
                      id="review-author-input"
                      type="text" 
                      required
                      value={newAuthor}
                      onChange={(e) => setNewAuthor(e.target.value)}
                      placeholder="e.g. Jamie Anderson" 
                      className="w-full bg-[#363636] border border-zinc-800 rounded-lg px-3 py-2 text-xs sm:text-[13px] text-white focus:outline-none focus:border-accent"
                    />
                  </div>

                  {/* Review text */}
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="review-content-input" className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-zinc-400">
                      Your Review
                    </label>
                    <textarea 
                      id="review-content-input"
                      required
                      rows={3}
                      value={newContent}
                      onChange={(e) => setNewContent(e.target.value)}
                      placeholder="Share your thoughts about Dr. Rena Malik's guides or features..." 
                      className="w-full bg-[#363636] border border-zinc-800 rounded-lg px-3 py-2 text-xs sm:text-[13px] text-white focus:outline-none focus:border-accent resize-none leading-relaxed"
                    />
                  </div>

                  <button
                    type="submit"
                    className="mt-2 w-full py-3 bg-[#5E0ED7] hover:bg-[#4d09b2] text-white font-extrabold uppercase tracking-widest text-xs rounded-lg transition-all cursor-pointer active:scale-[0.98]"
                  >
                    Post Review
                  </button>
                </form>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
