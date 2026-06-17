"use client";
import { useState } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { CLASH_QUESTIONS } from "@/lib/constants";
import { Clock, CheckCircle } from "lucide-react";

const MOCK_MATCH = {
  name: "Priya", age: 24, city: "Bangalore", profession: "Designer",
  photo: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=500&fit=crop",
};

export default function ClashTab({ onSwitchToSwipe }) {
  const [state, setState] = useState("active"); // active | answered | cooldown
  const [qIndex, setQIndex] = useState(0);
  const [answers, setAnswers] = useState(["", "", ""]);

  const handleSubmit = () => {
    if (qIndex < 2) setQIndex(qIndex + 1);
    else setState("answered");
  };

  if (state === "cooldown") {
    return (
      <div className="h-full flex flex-col items-center justify-center px-10 text-center">
        <div className="w-24 h-24 rounded-full border-2 border-[var(--border)] flex items-center justify-center mb-6">
          <Clock size={40} className="text-[var(--muted)]" />
        </div>
        <h2 className="text-2xl font-bold">Next clash in 18h</h2>
        <p className="text-[var(--muted)] mt-2">One meaningful connection per day.<br />Check back tomorrow.</p>
        <div className="mt-6 w-48">
          <Button variant="outline" onClick={onSwitchToSwipe}>Browse Profiles</Button>
        </div>
      </div>
    );
  }

  if (state === "answered") {
    return (
      <div className="h-full flex flex-col items-center justify-center px-10 text-center">
        <CheckCircle size={56} className="text-accent mb-5" />
        <h2 className="text-2xl font-bold">Clash complete!</h2>
        <p className="text-[var(--muted)] mt-2">
          If {MOCK_MATCH.name} answers your questions too,<br />you'll be matched.
        </p>
        <div className="mt-8 w-56">
          <Button onClick={onSwitchToSwipe}>Browse Profiles Now</Button>
        </div>
      </div>
    );
  }

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
            <img src={MOCK_MATCH.photo} alt={MOCK_MATCH.name} className="w-full h-full object-cover" />
          </div>
          <div className="p-4">
            <p className="text-lg font-semibold">{MOCK_MATCH.name}, {MOCK_MATCH.age}</p>
            <p className="text-sm text-[var(--muted)]">{MOCK_MATCH.city} · {MOCK_MATCH.profession}</p>
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
        <Button onClick={handleSubmit} disabled={!answers[qIndex]?.trim()}>
          {qIndex < 2 ? "Next Question" : "Submit Clash"}
        </Button>
      </div>
    </div>
  );
}
