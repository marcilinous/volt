"use client";
import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/lib/auth";
import { getSwipeStack, recordSwipe } from "@/lib/matching";
import ProfileCard, { AdCard } from "@/components/cards/ProfileCard";
import { Heart, X } from "lucide-react";

export default function SwipeTab() {
  const { user, profile } = useAuth();
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);
  const [matchAlert, setMatchAlert] = useState(null);

  // Fetch real profiles from DB
  useEffect(() => {
    if (!user) return;

    async function fetchProfiles() {
      setLoading(true);
      const { data, error } = await getSwipeStack(user.id, 20);
      if (error) {
        console.error("Error fetching profiles:", error);
        setProfiles([]);
      } else {
        // Map DB schema to ProfileCard format
        const mapped = (data || []).map((p) => ({
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
        }));
        setProfiles(mapped);
      }
      setLoading(false);
    }

    fetchProfiles();
  }, [user]);

  // Build stack with ad injection at every 3rd position
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

  const current = stack[index];

  const handleAction = async (action) => {
    if (!current || current.type !== "profile") {
      setIndex((p) => p + 1);
      return;
    }

    const { matched } = await recordSwipe(user.id, current.id, action);

    if (matched) {
      setMatchAlert({ name: current.name, photo: current.photo });
    }

    setIndex((p) => p + 1);
  };

  // Loading state
  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Match celebration overlay
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

  // Empty state
  if (!current || index >= stack.length) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center px-10">
        <h2 className="text-2xl font-bold">No more profiles</h2>
        <p className="text-[var(--muted)] mt-2">
          {profiles.length === 0
            ? "No profiles available yet. Check back later."
            : "You've seen everyone for now. Check back later."}
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
        <h2 className="text-lg font-semibold">Discover</h2>
        <span className="text-xs text-[var(--muted)]">
          {Math.min(index + 1, stack.length)} / {stack.length}
        </span>
      </div>

      <div className="flex-1 flex items-center justify-center p-5">
        {current.type === "ad" ? (
          <div onClick={() => setIndex((p) => p + 1)} className="cursor-pointer">
            <AdCard />
          </div>
        ) : (
          <ProfileCard
            profile={current}
            onLike={() => handleAction("like")}
            onPass={() => handleAction("pass")}
            onSuperLike={() => handleAction("super_like")}
          />
        )}
      </div>
    </div>
  );
}
