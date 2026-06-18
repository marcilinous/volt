"use client";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { Phone, Mail, ArrowLeft } from "lucide-react";

export default function AuthPage({ onComplete }) {
  const { signInWithEmail, verifyOtp, signInWithProvider } = useAuth();
  const [view, setView] = useState("welcome"); // welcome | email | otp
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [cooldown, setCooldown] = useState(0);

  const startCooldown = () => {
    setCooldown(60);
    const t = setInterval(() => {
      setCooldown((p) => {
        if (p <= 1) { clearInterval(t); return 0; }
        return p - 1;
      });
    }, 1000);
  };

  const handleSendOtp = async () => {
  if (!email.includes("@")) { setError("Enter a valid email"); return; }
  setLoading(true); setError("");
  const { error: e } = await signInWithEmail(email);
  setLoading(false);
  if (e) setError(e.message);
  else { setView("sent"); }
};

  const handleVerify = async () => {
    if (otp.length < 6) { setError("Enter the 6-digit code"); return; }
    setLoading(true); setError("");
    const { error: e } = await verifyOtp(email, otp);
    setLoading(false);
    if (e) setError(e.message);
  };

  if (view === "email" || view === "otp") {
    return (
      <div className="min-h-screen flex items-center justify-center px-5">
        <div className="w-full max-w-sm">
          <button
            onClick={() => { setView(view === "otp" ? "email" : "welcome"); setError(""); }}
            className="flex items-center gap-1 text-[var(--muted)] hover:text-[var(--text)] mb-8 cursor-pointer"
          >
            <ArrowLeft size={18} /> Back
          </button>

          <h1 className="text-2xl font-bold mb-2">
            {view === "email" ? "Enter your email" : "Check your inbox"}
          </h1>
          <p className="text-[var(--muted)] mb-8">
            {view === "email"
              ? "We'll send a verification code."
              : `Code sent to ${email}`}
          </p>

          {view === "email" ? (
            <>
              <Input
                label="Email"
                placeholder="you@example.com"
                value={email}
                onChange={(v) => { setEmail(v.toLowerCase().trim()); setError(""); }}
                type="email"
                error={error}
              />
              <Button onClick={handleSendOtp} loading={loading} disabled={!email}>
                Send Code
              </Button>
            </>
          ) : (
            <>
              <Input
                label="Verification code"
                placeholder="000000"
                value={otp}
                onChange={(v) => { setOtp(v.replace(/\D/g, "").slice(0, 6)); setError(""); }}
                maxLength={6}
                error={error}
              />
              <Button onClick={handleVerify} loading={loading} disabled={otp.length < 6}>
                Verify
              </Button>
              <p className="text-center text-sm mt-4 text-[var(--muted)]">
                {cooldown > 0 ? (
                  `Resend in ${cooldown}s`
                ) : (
                  <button onClick={handleSendOtp} className="text-accent font-semibold cursor-pointer">
                    Resend code
                  </button>
                )}
              </p>
            </>
          )}
        </div>
      </div>
    );
  }

  // Welcome view
  return (
    <div className="min-h-screen flex items-center justify-center px-5">
      <div className="w-full max-w-sm text-center">
        {/* Logo */}
        <div className="flex justify-center mb-4">
          <div className="w-[72px] h-[72px] border-[3px] border-accent rounded-[var(--radius)] flex items-center justify-center">
            <span className="text-accent text-4xl font-extrabold leading-none">C</span>
          </div>
        </div>
        <h1 className="text-3xl font-extrabold tracking-[8px] mb-2">CLASH</h1>
        <p className="text-[var(--muted)] text-base mb-10">Date differently.</p>

        {/* Auth buttons */}
        <div className="space-y-3">
          <Button onClick={() => setView("email")}>
            <Phone size={16} /> Continue with Truecaller
          </Button>

          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-[var(--border)]" />
            <span className="text-[11px] font-semibold tracking-wider text-[var(--muted)]">OR</span>
            <div className="flex-1 h-px bg-[var(--border)]" />
          </div>

          <Button variant="outline" onClick={() => signInWithProvider("google")}>
            Continue with Google
          </Button>
          <Button variant="outline" onClick={() => signInWithProvider("facebook")}>
            Continue with Facebook
          </Button>
          <Button variant="ghost" onClick={() => setView("email")}>
            <Mail size={16} /> Use Email Instead
          </Button>
        </div>

        <p className="text-xs text-[var(--muted)] mt-8">
          By continuing, you agree to our Terms & Privacy Policy.
        </p>
      </div>
    </div>
  );
}
