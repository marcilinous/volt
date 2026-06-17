"use client";
import { useState, useEffect, useRef } from "react";
import Button from "@/components/ui/Button";
import { Mic, MicOff, X, Search } from "lucide-react";

function WaveformBars({ active }) {
  return (
    <div className="flex items-center justify-center gap-[3px] h-16">
      {Array.from({ length: 24 }, (_, i) => (
        <div
          key={i}
          className={`w-[3px] rounded-full transition-all ${
            active ? "bg-accent" : "bg-[var(--border)]"
          }`}
          style={{
            height: active
              ? `${20 + Math.sin(Date.now() / 200 + i) * 20}px`
              : "8px",
            animationDelay: `${i * 50}ms`,
          }}
        />
      ))}
    </div>
  );
}

export default function SparkTab() {
  const [state, setState] = useState("waiting"); // waiting | connecting | active | ended
  const [timer, setTimer] = useState(60);
  const [muted, setMuted] = useState(false);
  const interval = useRef(null);
  const animFrame = useRef(null);
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    if (state === "active") {
      // Tick the waveform
      const animate = () => {
        forceUpdate((n) => n + 1);
        animFrame.current = requestAnimationFrame(animate);
      };
      animFrame.current = requestAnimationFrame(animate);
    }
    return () => {
      if (animFrame.current) cancelAnimationFrame(animFrame.current);
    };
  }, [state]);

  const startCall = () => {
    setState("connecting");
    setTimeout(() => {
      setState("active");
      setTimer(60);
      interval.current = setInterval(() => {
        setTimer((p) => {
          if (p <= 1) { clearInterval(interval.current); setState("ended"); return 0; }
          return p - 1;
        });
      }, 1000);
    }, 2000);
  };

  const endCall = () => {
    clearInterval(interval.current);
    setState("ended");
  };

  const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  if (state === "waiting") {
    return (
      <div className="h-full flex flex-col items-center justify-center px-10 text-center">
        <div className="w-24 h-24 rounded-full border-2 border-[var(--border)] flex items-center justify-center mb-6">
          <Mic size={40} className="text-accent" />
        </div>
        <h2 className="text-2xl font-bold">Spark Room</h2>
        <p className="text-[var(--muted)] mt-2 leading-relaxed">
          60 seconds. No photos. Just voice.<br />Find a spark before the timer runs out.
        </p>
        <div className="mt-8 w-48">
          <Button onClick={startCall}>Find a Spark</Button>
        </div>
      </div>
    );
  }

  if (state === "connecting") {
    return (
      <div className="h-full flex flex-col items-center justify-center px-10 text-center">
        <div className="w-28 h-28 rounded-full border-[3px] border-accent/30 flex items-center justify-center mb-6">
          <div className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center">
            <Search size={32} className="text-accent animate-pulse" />
          </div>
        </div>
        <h2 className="text-2xl font-bold">Searching...</h2>
        <p className="text-[var(--muted)] mt-2">Finding someone nearby</p>
      </div>
    );
  }

  if (state === "ended") {
    return (
      <div className="h-full flex flex-col items-center justify-center px-10 text-center">
        <h2 className="text-2xl font-bold">Time's up!</h2>
        <p className="text-[var(--muted)] mt-2">Did you feel a spark?</p>
        <div className="flex gap-3 mt-8 w-full max-w-xs">
          <Button onClick={() => setState("waiting")} className="flex-1">Yes, Connect</Button>
          <Button variant="outline" onClick={() => setState("waiting")} className="flex-1">Pass</Button>
        </div>
      </div>
    );
  }

  // Active call
  return (
    <div className="h-full flex flex-col items-center justify-between py-12 px-8">
      {/* Anonymous avatar */}
      <div className="flex flex-col items-center gap-3">
        <div className="w-20 h-20 rounded-full border-2 border-[var(--border)] bg-[var(--surface)] flex items-center justify-center">
          <span className="text-3xl text-[var(--muted)]">?</span>
        </div>
        <span className="text-[11px] font-semibold tracking-[3px] text-[var(--muted)]">ANONYMOUS</span>
      </div>

      {/* Timer */}
      <div className="flex flex-col items-center gap-3">
        <span className={`text-6xl font-light tabular-nums ${timer <= 10 ? "text-accent" : ""}`}>
          {fmt(timer)}
        </span>
        <div className="w-64 h-[3px] bg-[var(--border)] rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-1000 ${timer <= 10 ? "bg-accent" : "bg-[var(--text)]"}`}
            style={{ width: `${(timer / 60) * 100}%` }}
          />
        </div>
      </div>

      {/* Waveform */}
      <WaveformBars active={!muted} />

      {/* Controls */}
      <div className="flex items-center gap-6">
        <button
          onClick={() => setMuted(!muted)}
          className={`w-14 h-14 rounded-full border flex items-center justify-center transition-all cursor-pointer ${
            muted ? "bg-accent border-accent text-white" : "border-[var(--border)] text-[var(--text)] hover:bg-[var(--surface)]"
          }`}
        >
          {muted ? <MicOff size={22} /> : <Mic size={22} />}
        </button>
        <button
          onClick={endCall}
          className="w-16 h-16 rounded-full bg-accent flex items-center justify-center cursor-pointer hover:opacity-90"
        >
          <X size={26} className="text-white" />
        </button>
      </div>
    </div>
  );
}
