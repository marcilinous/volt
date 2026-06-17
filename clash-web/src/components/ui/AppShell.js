"use client";
import { useState } from "react";
import { Flame, Mic, MessageCircle, User } from "lucide-react";

const NAV_ITEMS = [
  { key: "clash", label: "Clash", icon: Flame },
  { key: "spark", label: "Spark", icon: Mic },
  { key: "messages", label: "Messages", icon: MessageCircle },
  { key: "profile", label: "Profile", icon: User },
];

export default function AppShell({ activeTab, onTabChange, children }) {
  return (
    <div className="h-screen-safe h-screen flex flex-col md:flex-row overflow-hidden">
      {/* Desktop sidebar */}
      <nav className="hidden md:flex flex-col w-[72px] border-r border-[var(--border)] bg-[var(--bg)] items-center py-6 gap-2 shrink-0">
        <div className="w-10 h-10 rounded-[var(--radius)] border-2 border-accent flex items-center justify-center mb-8">
          <span className="text-accent font-extrabold text-lg leading-none">C</span>
        </div>
        {NAV_ITEMS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => onTabChange(key)}
            className={`w-12 h-12 rounded-[var(--radius)] flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer ${
              activeTab === key
                ? "bg-accent/10 text-accent"
                : "text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface)]"
            }`}
            title={label}
          >
            <Icon size={20} strokeWidth={activeTab === key ? 2.2 : 1.5} />
            <span className="text-[9px] font-semibold tracking-wide uppercase">
              {label}
            </span>
          </button>
        ))}
      </nav>

      {/* Main content */}
      <main className="flex-1 overflow-hidden">{children}</main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden flex border-t border-[var(--border)] bg-[var(--bg)] shrink-0">
        {NAV_ITEMS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => onTabChange(key)}
            className={`flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 transition-all cursor-pointer ${
              activeTab === key ? "text-accent" : "text-[var(--muted)]"
            }`}
          >
            <Icon size={20} strokeWidth={activeTab === key ? 2.2 : 1.5} />
            <span className="text-[9px] font-semibold tracking-wide uppercase">
              {label}
            </span>
          </button>
        ))}
      </nav>
    </div>
  );
}
