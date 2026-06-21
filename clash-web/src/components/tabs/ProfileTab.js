"use client";
import { useState } from "react";
import Button from "@/components/ui/Button";
import EditProfilePage from "@/components/EditProfilePage";
import { useAuth } from "@/lib/auth";
import { Star, Play, Bell, Shield, HelpCircle, FileText, ChevronRight, LogOut } from "lucide-react";

export default function ProfileTab() {
  const { profile, signOut } = useAuth();
  const [tokens, setTokens] = useState(5);
  const [isPremium, setIsPremium] = useState(false);
  const [editing, setEditing] = useState(false);

  if (editing) {
    return <EditProfilePage onClose={() => setEditing(false)} />;
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-lg mx-auto px-5 py-6">
        <h2 className="text-2xl font-bold mb-6">Profile</h2>

        {/* Avatar + name */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-24 h-24 rounded-[var(--radius)] border-2 border-[var(--border)] overflow-hidden mb-3">
            <img
              src={profile?.photos_urls?.[0] || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop"}
              alt="" className="w-full h-full object-cover"
            />
          </div>
          <p className="text-lg font-semibold">{profile?.display_name || "Your Name"}</p>
          <p className="text-sm text-[var(--muted)]">
            {profile?.current_city || "City"} · {profile?.profession || ""}
          </p>
          <button
            onClick={() => setEditing(true)}
            className="mt-3 px-5 py-2 border border-[var(--border)] rounded-[var(--radius)] text-[11px] font-semibold tracking-wider uppercase hover:border-[var(--muted)] transition-colors cursor-pointer"
          >
            Edit Profile
          </button>
        </div>

        {/* Premium card */}
        <div className={`p-5 rounded-[var(--radius)] border mb-3 ${
          isPremium ? "border-accent bg-accent/5" : "border-[var(--border)] bg-[var(--surface)]"
        }`}>
          <div className="flex items-center gap-2 mb-1">
            <Star size={18} className={isPremium ? "text-accent" : "text-[var(--muted)]"} />
            <span className={`text-xs font-semibold tracking-wider ${isPremium ? "text-accent" : ""}`}>
              {isPremium ? "PREMIUM ACTIVE" : "GO PREMIUM"}
            </span>
          </div>
          {isPremium ? (
            <p className="text-sm text-[var(--muted)]">Expires in 2 days, 14 hours</p>
          ) : (
            <>
              <p className="text-sm text-[var(--muted)] mb-3">Unlimited likes, see who liked you, no ads.</p>
              <Button onClick={() => setIsPremium(true)}>₹99 for 3 Days</Button>
            </>
          )}
        </div>

        {/* Token balance */}
        <div className="p-5 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] mb-8">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold tracking-wider text-[var(--muted)]">TOKEN BALANCE</span>
              <p className="text-lg font-semibold mt-0.5">{tokens} tokens</p>
            </div>
            <button
              onClick={() => setTokens((p) => p + 1)}
              className="flex items-center gap-1.5 bg-accent text-white px-4 py-2 rounded-[var(--radius)] text-[11px] font-bold tracking-wider hover:opacity-90 transition-opacity cursor-pointer"
            >
              <Play size={12} /> WATCH AD
            </button>
          </div>
          <p className="text-xs text-[var(--muted)] mt-2">Use tokens for Super Likes and profile boosts.</p>
        </div>

        {/* Settings */}
        <div className="space-y-0">
          {[
            { icon: Bell, label: "Notifications" },
            { icon: Shield, label: "Privacy & Safety" },
            { icon: HelpCircle, label: "Help & Support" },
            { icon: FileText, label: "Terms of Service" },
          ].map(({ icon: Icon, label }) => (
            <button
              key={label}
              className="w-full flex items-center gap-3 py-3.5 border-b border-[var(--border)] text-left hover:bg-[var(--surface)] transition-colors cursor-pointer"
            >
              <Icon size={18} className="text-[var(--muted)]" />
              <span className="flex-1">{label}</span>
              <ChevronRight size={16} className="text-[var(--muted)]" />
            </button>
          ))}
        </div>

        {/* Sign out */}
        <button
          onClick={signOut}
          className="w-full flex items-center justify-center gap-2 text-accent text-sm font-semibold tracking-wider uppercase py-4 mt-4 hover:opacity-80 cursor-pointer"
        >
          <LogOut size={16} /> Sign Out
        </button>
      </div>
    </div>
  );
}
