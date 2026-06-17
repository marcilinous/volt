"use client";
import { useState, useMemo } from "react";
import ProfileCard, { AdCard } from "@/components/cards/ProfileCard";

const PROFILES = [
  { id: "1", name: "Ananya", age: 23, city: "Mysuru", profession: "Architect",
    photo: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&h=500&fit=crop",
    promptQ: "A perfect Sunday looks like...", promptA: "Coffee, a good book, and rain on the window." },
  { id: "2", name: "Meera", age: 25, city: "Bangalore", profession: "Product Manager",
    photo: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=500&fit=crop",
    promptQ: "The way to my heart is...", promptA: "Through terrible puns and great biryani." },
  { id: "3", name: "Riya", age: 22, city: "Chennai", category: "Student",
    photo: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&h=500&fit=crop",
    promptQ: "I'm looking for someone who...", promptA: "Can keep up with my spontaneous road trip plans." },
  { id: "4", name: "Shreya", age: 26, city: "Hyderabad", profession: "Data Scientist",
    photo: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=500&fit=crop" },
  { id: "5", name: "Kavya", age: 24, city: "Pune", profession: "UX Designer",
    photo: "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=400&h=500&fit=crop",
    promptQ: "A perfect Sunday looks like...", promptA: "Sketchbook in one hand, chai in the other." },
];

export default function SwipeTab() {
  const [index, setIndex] = useState(0);

  // Build stack with ads at every 3rd position (index % 3 === 0, skip first)
  const stack = useMemo(() => {
    const items = [];
    let pi = 0;
    for (let i = 0; pi < PROFILES.length; i++) {
      if (i > 0 && i % 3 === 0) {
        items.push({ type: "ad", id: `ad-${i}` });
      }
      items.push({ type: "profile", ...PROFILES[pi] });
      pi++;
    }
    return items;
  }, []);

  const current = stack[index];
  const advance = () => setIndex((p) => p + 1);

  if (!current || index >= stack.length) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center px-10">
        <h2 className="text-2xl font-bold">No more profiles</h2>
        <p className="text-[var(--muted)] mt-2">Check back later for new people near you.</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
        <h2 className="text-lg font-semibold">Discover</h2>
        <span className="text-xs text-[var(--muted)]">{index + 1} / {stack.length}</span>
      </div>

      <div className="flex-1 flex items-center justify-center p-5">
        {current.type === "ad" ? (
          <div onClick={advance} className="cursor-pointer">
            <AdCard />
          </div>
        ) : (
          <ProfileCard
            profile={current}
            onLike={advance}
            onPass={advance}
            onSuperLike={advance}
          />
        )}
      </div>
    </div>
  );
}
