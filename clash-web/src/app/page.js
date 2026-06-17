"use client";
import { useState } from "react";
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
  const [discoveryMode, setDiscoveryMode] = useState("clash"); // clash | swipe

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Not authenticated → show auth page
  if (!user) return <AuthPage />;

  // Authenticated but no profile → onboarding
  if (!profile) return <OnboardingPage />;

  // Main app
  const renderTab = () => {
    switch (tab) {
      case "clash":
        return discoveryMode === "clash" ? (
          <ClashTab onSwitchToSwipe={() => setDiscoveryMode("swipe")} />
        ) : (
          <SwipeTab />
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
        if (t === "clash") setDiscoveryMode("clash");
      }}
    >
      {renderTab()}
    </AppShell>
  );
}
