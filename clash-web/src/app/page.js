"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import AuthPage from "@/components/AuthPage";
import OnboardingPage from "@/components/OnboardingPage";
import AppShell from "@/components/ui/AppShell";
import ClashTab from "@/components/tabs/ClashTab";
import SwipeTab from "@/components/tabs/SwipeTab";
import SparkTab from "@/components/tabs/SparkTab";
import MessagesTab from "@/components/tabs/MessagesTab";
import ProfileTab from "@/components/tabs/ProfileTab";

export default function Home() {
  const { user, profile, loading } = useAuth();
  const [tab, setTab] = useState("clash");
  const [discoveryMode, setDiscoveryMode] = useState("swipe"); // Default to swipe
  const [hasInitialized, setHasInitialized] = useState(false);

  // On first profile load, decide whether to show clash or swipe
  useEffect(() => {
    if (profile && !hasInitialized) {
      // If profile was created less than 5 minutes ago → first session, skip clash
      const createdAt = profile.created_at ? new Date(profile.created_at) : null;
      const now = new Date();
      const ageSec = createdAt ? (now - createdAt) / 1000 : 0;
      const isFirstSession = ageSec < 300; // 5 minutes

      setDiscoveryMode(isFirstSession ? "swipe" : "clash");
      setHasInitialized(true);
    }
  }, [profile, hasInitialized]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <AuthPage />;
  if (!profile) return <OnboardingPage />;

  const renderTab = () => {
    switch (tab) {
      case "clash":
        return discoveryMode === "clash" ? (
          <ClashTab onSwitchToSwipe={() => setDiscoveryMode("swipe")} />
        ) : (
          <SwipeTab onSwitchToClash={() => setDiscoveryMode("clash")} />
        );
      case "spark":
        return <SparkTab />;
      case "messages":
        return <MessagesTab />;
      case "profile":
        return <ProfileTab />;
      default:
        return null;
    }
  };

  return (
    <AppShell
      activeTab={tab}
      onTabChange={(t) => {
        setTab(t);
        // When user clicks Discovery tab, default to whatever mode they were in
      }}
    >
      {renderTab()}
    </AppShell>
  );
}
