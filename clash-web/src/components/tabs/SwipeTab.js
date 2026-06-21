"use client";
import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { recordSwipe } from "@/lib/matching";
import ProfileCard, { AdCard } from "@/components/cards/ProfileCard";
import { Heart, Flame } from "lucide-react";

export default function SwipeTab({ onSwitchToClash }) {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);
  const [matchAlert, setMatchAlert] = useState(null);
  const [swipingDir, setSwipingDir] = useState(null);

  useEffect(() => {
    if (!user) return;

    async function fetchAllProfiles() {
      setLoading(true);

      const { data: swipes } = await supabase
        .from("swipe_actions")
        .select("target_id, action")
        .eq("user_id", user.id);

      const swipeMap = new Map();
      (swipes || []).forEach((s) => swipeMap.set(s.target_id, s.action));

      const { data: allProfiles, error } = await supabase
        .from("profiles")
        .select("*, ai_prompt_responses(*)")
        .neq("id", user.id)
        .limit(100);

      if (error) {
        console.error("Error fetching profiles:", error);
        setProfiles([]);
        setLoading(false);
        return;
      }

      const mapped = (allProfiles || []).map((p) => ({
        id: p.id,
        name: p.display_name,
        age: p.date_of_birth
          ? Math.floor((Date.now() - new Date(p.date_of_birth)) / 31557600000)
          : null,
        city: p.current_city,
        profession: p.profession,
        category: p.user_category,
        photo: p.photos_urls?.[0] || null,
        promptQ: p.ai_prompt_responses?.[0]?.question_text,
        promptA: p.ai_prompt_responses?.[0]?.answer_text,
        previousAction: swipeMap.get(p.id) || null,
      }));

      // Sort: unswiped first, then passed, then super_like, then liked
      mapped.sort((a, b) => {
        const order = { null: 0, pass: 1, super_like: 2, like: 3 };
        return (order[a.previousAction] ?? 0) - (order[b.previousAction] ?? 0);
      });

      setProfiles(mapped);
      setLoading(false);
    }

    fetchAllProfiles();
  }, [user]);

  const stack = useMemo(() => {
    const items = [];
    let pi = 0;
    for (let i = 0; pi < profiles.length; i++) {
      if (i > 0 && i % 3 === 0) {
        items.push({ type: "ad", id: `ad-${i}` });
      }
      items.push({ type: "profile", ...profiles[pi] });
      pi++;
    }
    return items;
  }, [profiles]);

  const cycleIndex = stack.length > 0 ? index % stack.length : 0;
  const current = stack[cycleIndex];

  const handleAction = async (action) => {
    if (!current || current.type !== "profile") {
      setIndex((p) => p + 1);
      return;
    }

    const { matched } = await recordSwipe(user.id, current.id, action);

    setProfiles((prev) => prev.map((p) =>
      p.id === current.id ? { ...p, previousAction: action } : p
    ));

    if (matched) {
      setMatchAlert({ name: current.name, photo: current.photo });
    }

    setSwipingDir(null);
    setIndex((p) => p + 1);
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (matchAlert) {
    return (
      <div className="h-full flex flex-col items-center justify-center px-10 text-center">
        <div className="w-24 h-24 rounded-full border-4 border-accent flex items-center justify-center mb-6">
          <Heart size={40} className="text-accent fill-accent" />
        </div>
        <h2 className="text-3xl font-bold tracking-wider">IT&apos;S A MATCH!</h2>
        <p className="text-[var(--muted)] mt-3 text-lg">
          You and <strong className="text-[var(--text)]">{matchAlert.name}</strong> liked each other
        </p>
        {matchAlert.photo && (
          <img
            src={matchAlert.photo}
            alt={matchAlert.name}
            className="w-32 h-40 object-cover rounded-[var(--radius)] mt-6 border-2 border-accent"
          />
        )}
        <button
          onClick={() => setMatchAlert(null)}
          className="mt-8 px-8 py-3 bg-accent text-white text-xs font-bold tracking-widest uppercase rounded-[var(--radius)] cursor-pointer hover:opacity-90"
        >
          Keep Swiping
        </button>
      </div>
    );
  }

  if (!current) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center px-10">
        <h2 className="text-2xl font-bold">No profiles yet</h2>
        <p className="text-[var(--muted)] mt-2">Check back later for new people.</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--border)] shrink-0">
        <h2 className="text-lg font-semibold">Discover</h2>
        <div className="flex items-center gap-3">
          {onSwitchToClash && (
            <button
              onClick={onSwitchToClash}
              className="flex items-center gap-1 text-accent text-xs font-semibold uppercase tracking-wider hover:opacity-80 cursor-pointer"
            >
              <Flame size={14} /> Daily Clash
            </button>
          )}
          <span className="text-xs text-[var(--muted)]">
            {cycleIndex + 1} / {stack.length}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto flex items-start justify-center p-4">
        <div className="w-full max-w-[400px] relative">
          <AnimatePresence mode="wait">
            <SwipeableCard
              key={`${current.id || current.type}-${index}`}
              item={current}
              onLike={() => handleAction("like")}
              onPass={() => handleAction("pass")}
              onSuperLike={() => handleAction("super_like")}
              onSkipAd={() => setIndex((p) => p + 1)}
              onSwipingChange={setSwipingDir}
            />
          </AnimatePresence>

          {swipingDir === "like" && (
            <div className="absolute top-8 right-8 border-4 border-green-500 text-green-500 px-4 py-2 rounded-[var(--radius)] font-extrabold text-2xl rotate-12 pointer-events-none z-30">
              LIKE
            </div>
          )}
          {swipingDir === "pass" && (
            <div className="absolute top-8 left-8 border-4 border-red-500 text-red-500 px-4 py-2 rounded-[var(--radius)] font-extrabold text-2xl -rotate-12 pointer-events-none z-30">
              PASS
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SwipeableCard({ item, onLike, onPass, onSuperLike, onSkipAd, onSwipingChange }) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-25, 25]);
  const opacity = useTransform(x, [-300, -150, 0, 150, 300], [0, 1, 1, 1, 0]);

  const handleDragEnd = (event, info) => {
    const threshold = 100;
    if (info.offset.x > threshold) {
      onLike();
    } else if (info.offset.x < -threshold) {
      onPass();
    }
    onSwipingChange(null);
  };

  const handleDrag = (event, info) => {
    if (info.offset.x > 50) onSwipingChange("like");
    else if (info.offset.x < -50) onSwipingChange("pass");
    else onSwipingChange(null);
  };

  if (item.type === "ad") {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onSkipAd}
        className="cursor-pointer"
      >
        <AdCard />
      </motion.div>
    );
  }

  return (
    <motion.div
      style={{ x, rotate, opacity }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.7}
      onDrag={handleDrag}
      onDragEnd={handleDragEnd}
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ x: 0, opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="cursor-grab active:cursor-grabbing relative"
    >
      {item.previousAction && (
        <div className="absolute -top-2 -right-2 z-20">
          <span className={`px-3 py-1 rounded-[var(--radius)] text-[10px] font-bold tracking-wider uppercase shadow-lg ${
            item.previousAction === "like" || item.previousAction === "super_like"
              ? "bg-accent text-white"
              : "bg-[var(--surface)] border border-[var(--border)] text-[var(--muted)]"
          }`}>
            {item.previousAction === "like" && "✓ Liked"}
            {item.previousAction === "super_like" && "★ Super Liked"}
            {item.previousAction === "pass" && "✕ Passed"}
          </span>
        </div>
      )}

      <ProfileCard
        profile={item}
        onLike={onLike}
        onPass={onPass}
        onSuperLike={onSuperLike}
      />
    </motion.div>
  );
}
