"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { getTodayClash, submitClash } from "@/lib/matching";
import { supabase } from "@/lib/supabase";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { CLASH_QUESTIONS } from "@/lib/constants";
import { Clock, CheckCircle } from "lucide-react";

// Calculate compatibility score based on shared attributes
function calcCompatibility(me, them) {
  if (!me || !them) return 0;
  let score = 0;
  const breakdown = [];

  // Same city = 30 points
  if (me.current_city && them.current_city &&
      me.current_city.toLowerCase() === them.current_city.toLowerCase()) {
    score += 30;
    breakdown.push("Same city");
  }

  // Shared languages (each common language = 10 points, max 30)
  const myLangs = new Set((me.languages || []).map((l) => l.toLowerCase()));
  const theirLangs = (them.languages || []).map((l) => l.toLowerCase());
  const sharedLangs = theirLangs.filter((l) => myLangs.has(l));
  const langPoints = Math.min(sharedLangs.length * 10, 30);
  score += langPoints;
  if (sharedLangs.length > 0) breakdown.push(`${sharedLangs.length} shared language${sharedLangs.length > 1 ? "s" : ""}`);

  // Same intent = 25 points
  if (me.intent && them.intent && me.intent === them.intent) {
    score += 25;
    breakdown.push("Same intent");
  }

  // Same religion = 15 points
  if (me.religion && them.religion && me.religion === them.religion) {
    score += 15;
    breakdown.push("Same beliefs");
  }

  return { score: Math.min(score, 100), breakdown };
}

export default function ClashTab({ onSwitchToSwipe }) {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [state, setState] = useState("active"); // active | answered
  const [qIndex, setQIndex] = useState(0);
  const [answers, setAnswers] = useState(["", "", ""]);
  const [todayMatch, setTodayMatch] = useState(null);
  const [compatibility, setCompatibility] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // On mount: check if today's clash already done OR pick a new match
  useEffect(() => {
    if (!user || !profile) return;

    async function init() {
      setLoading(true);

      // Check if already completed today
      const existingClash = await getTodayClash(user.id);
      if (existingClash) {
        // Already did today — fetch the target profile to show
        const { data: target } = await supabase
          .from("profiles")
          .select("*, ai_prompt_responses(*)")
          .eq("id", existingClash.target_id)
          .single();
        setTodayMatch(target);
        if (target) setCompatibility(calcCompatibility(profile, target));
        setState("answered");
        setLoading(false);
        return;
      }

      // Pick a random profile (not self, not already swiped)
      const { data: swiped } = await supabase
        .from("swipe_actions")
        .select("target_id")
        .eq("user_id", user.id);
      const exclude = [...(swiped || []).map((s) => s.target_id), user.id];

      const { data: candidates } = await supabase
        .from("profiles")
        .select("*, ai_prompt_responses(*)")
        .not("id", "in", `(${exclude.join(",")})`)
        .limit(50);

      if (candidates && candidates.length > 0) {
        // Pick the one with highest compatibility
        const ranked = candidates.map((c) => ({
          ...c,
          compat: calcCompatibility(profile, c),
        }));
        ranked.sort((a, b) => b.compat.score - a.compat.score);
        const top = ranked[0];
        setTodayMatch(top);
        setCompatibility(top.compat);
      }
      setLoading(false);
    }

    init();
  }, [user, profile]);

  const handleSubmit = async () => {
    if (qIndex < 2) {
      setQIndex(qIndex + 1);
      return;
    }
    // Last question — submit to DB
    setSubmitting(true);
    const formattedAnswers = CLASH_QUESTIONS.map((q, i) => ({
      question: q,
      answer: answers[i],
    }));
    await submitClash(user.id, todayMatch.id, formattedAnswers);
    setSubmitting(false);
    setState("answered");
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // No candidates available
  if (!todayMatch) {
    return (
      <div className="h-full flex flex-col items-center justify-center px-10 text-center">
        <div className="w-24 h-24 rounded-full border-2 border-[var(--border)] flex items-center justify-center mb-6">
          <Clock size={40} className="text-[var(--muted)]" />
        </div>
        <h2 className="text-2xl font-bold">No clash today</h2>
        <p className="text-[var(--muted)] mt-2">
          No new matches available right now.<br />Check back tomorrow.
        </p>
        <div className="mt-6 w-48">
          <Button variant="outline" onClick={onSwitchToSwipe}>Browse Profiles</Button>
        </div>
      </div>
    );
  }

  // Already submitted today
  if (state === "answered") {
    return (
      <div className="h-full flex flex-col items-center justify-center px-10 text-center">
        <CheckCircle size={56} className="text-accent mb-5" />
        <h2 className="text-2xl font-bold">Clash complete!</h2>
        <p className="text-[var(--muted)] mt-2">
          If {todayMatch.display_name} answers your questions too,<br />you&apos;ll be matched.
        </p>
        <p className="text-xs text-[var(--muted)] mt-4">Next clash available tomorrow.</p>
        <div className="mt-8 w-56">
          <Button onClick={onSwitchToSwipe}>Browse Profiles Now</Button>
        </div>
      </div>
    );
  }

  // Compute age from DOB
  const age = todayMatch.date_of_birth
    ? Math.floor((Date.now() - new Date(todayMatch.date_of_birth)) / 31557600000)
    : null;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
        <span className="text-accent text-xs font-semibold tracking-[3px]">DAILY CLASH</span>
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <div key={i} className={`w-2 h-2 rounded-full ${i <= qIndex ? "bg-accent" : "bg-[var(--border)]"}`} />
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
        {/* Match card */}
        <div className="border border-[var(--border)] rounded-[var(--radius)] overflow-hidden">
          <div className="aspect-[4/3] relative">
            {todayMatch.photos_urls?.[0] ? (
              <img src={todayMatch.photos_urls[0]} alt={todayMatch.display_name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-[var(--surface)] flex items-center justify-center">
                <span className="text-4xl text-[var(--muted)]">?</span>
              </div>
            )}
            {/* Compatibility badge */}
            {compatibility && compatibility.score > 0 && (
              <div className="absolute top-3 right-3 bg-accent text-white px-3 py-1.5 rounded-[var(--radius)] flex items-center gap-1.5 shadow-lg">
                <span className="text-lg font-bold">{compatibility.score}%</span>
                <span className="text-[10px] font-semibold tracking-wider">MATCH</span>
              </div>
            )}
          </div>
          <div className="p-4">
            <p className="text-lg font-semibold">{todayMatch.display_name}{age ? `, ${age}` : ""}</p>
            <p className="text-sm text-[var(--muted)]">
              {todayMatch.current_city} · {todayMatch.profession || todayMatch.user_category}
            </p>
            {/* Compatibility breakdown */}
            {compatibility && compatibility.breakdown && compatibility.breakdown.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {compatibility.breakdown.map((b, i) => (
                  <span key={i} className="text-[10px] font-medium tracking-wide bg-accent/10 text-accent px-2 py-0.5 rounded-sm">
                    {b}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Question card */}
        <div className="border border-[var(--border)] bg-[var(--surface)] rounded-[var(--radius)] p-5">
          <span className="text-[11px] font-semibold tracking-wider text-[var(--muted)]">
            QUESTION {qIndex + 1} OF 3
          </span>
          <h3 className="text-xl font-bold mt-3 mb-5">{CLASH_QUESTIONS[qIndex]}</h3>
          <Input
            placeholder="Type your answer..."
            value={answers[qIndex]}
            onChange={(v) => { const a = [...answers]; a[qIndex] = v; setAnswers(a); }}
            multiline
            maxLength={200}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-[var(--border)]">
        <Button onClick={handleSubmit} disabled={!answers[qIndex]?.trim() || submitting} loading={submitting}>
          {qIndex < 2 ? "Next Question" : "Submit Clash"}
        </Button>
      </div>
    </div>
  );
}
