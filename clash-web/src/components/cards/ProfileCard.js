"use client";
import { X, Star, Heart } from "lucide-react";

export default function ProfileCard({ profile, onLike, onPass, onSuperLike }) {
  return (
    <div className="w-full max-w-[400px] border border-[var(--border)] rounded-[var(--radius)] overflow-hidden bg-[var(--surface)]">
      {/* 4:5 image frame */}
      <div className="relative aspect-[4/5] bg-[var(--surface)]">
        <img
          src={profile.photo || "/placeholder.svg"}
          alt={profile.name}
          className="w-full h-full object-cover"
        />

        {/* Name/location overlay */}
        <div className="absolute bottom-0 inset-x-0 px-4 py-3.5 bg-gradient-to-t from-black/60 to-transparent">
          <div className="flex items-baseline gap-2">
            <span className="text-white text-2xl font-bold">{profile.name}</span>
            <span className="text-white/80 text-xl">{profile.age}</span>
          </div>
          <p className="text-white/70 text-sm mt-0.5">
            {profile.city} · {profile.profession || profile.category}
          </p>
        </div>

        {/* Prompt bubble */}
        {profile.promptQ && (
          <div className="absolute bottom-[70px] left-3 right-3 bg-[var(--bg)]/90 backdrop-blur-sm rounded-[var(--radius)] p-3">
            <p className="text-[var(--muted)] text-xs italic">{profile.promptQ}</p>
            <p className="text-[var(--text)] text-sm font-medium mt-1 line-clamp-2">
              {profile.promptA}
            </p>
          </div>
        )}
      </div>

      {/* Split action footer */}
      <div className="flex border-t border-[var(--border)] h-14">
        <button
          onClick={onPass}
          className="flex-1 flex items-center justify-center hover:bg-[var(--surface)] transition-colors cursor-pointer"
        >
          <X size={26} className="text-[var(--muted)]" />
        </button>
        <div className="w-px bg-[var(--border)]" />
        <button
          onClick={onSuperLike}
          className="flex-1 flex items-center justify-center hover:bg-[var(--surface)] transition-colors cursor-pointer"
        >
          <Star size={22} className="text-amber-500" />
        </button>
        <div className="w-px bg-[var(--border)]" />
        <button
          onClick={onLike}
          className="flex-1 flex items-center justify-center hover:bg-[var(--surface)] transition-colors cursor-pointer"
        >
          <Heart size={24} className="text-accent" />
        </button>
      </div>
    </div>
  );
}

export function AdCard() {
  return (
    <div className="w-full max-w-[400px] border border-[var(--border)] rounded-[var(--radius)] overflow-hidden bg-[var(--surface)] aspect-[4/3] flex flex-col items-center justify-center gap-2">
      <div className="w-12 h-12 rounded-full bg-[var(--border)] flex items-center justify-center">
        <span className="text-[var(--muted)] text-lg">📢</span>
      </div>
      <p className="text-[11px] font-semibold tracking-wider uppercase text-[var(--muted)]">
        AdMob Native Ad
      </p>
      <p className="text-xs text-[var(--muted)]">Ad unit renders here</p>
    </div>
  );
}
