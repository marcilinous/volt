"use client";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { Phone, Mail, ArrowLeft, CheckCircle } from "lucide-react";

export default function AuthPage() {
  const { signInWithEmail, signInWithProvider } = useAuth();
  const [view, setView] = useState("welcome"); // welcome | email | sent
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSendLink = async () => {
    if (!email.includes("@")) {
      setError("Enter a valid email");
      return;
    }
    setLoading(true);
    setError("");
    const { error: e } = await signInWithEmail(email);
    setLoading(false);
    if (e) setError(e.message);
    else setView("sent");
  };

  // Email link sent state
  if (view === "sent") {
    return (
      <div className="min-h-screen flex items-center justify-center px-5">
        <div className="w-full max-w-sm text-center">
          <CheckCircle size={56} className="text-accent mx-auto mb-5" />
          <h1 className="text-2xl font-bold mb-2">Check your email</h1>
          <p className="text-[var(--muted)] mb-8">
            We sent a sign-in link to <strong>{email}</strong>.
            Click it to log in.
          </p>
          <Button
            variant="outline"
            onClick={() => {
              setView("welcome");
              setEmail("");
            }}
          >
            Use a different email
          </Button>
        </div>
      </div>
    );
  }

  // Email entry
  if (view === "email") {
    return (
      <div className="min-h-screen flex items-center justify-center px-5">
        <div className="w-full max-w-sm">
          <button
            onClick={() => {
              setView("welcome");
              setError("");
            }}
            className="flex items-center gap-1 text-[var(--muted)] hover:text-[var(--text)] mb-8 cursor-pointer"
          >
            <ArrowLeft size={18} /> Back
          </button>

          <h1 className="text-2xl font-bold mb-2">Enter your email</h1>
          <p className="text-[var(--muted)] mb-8">
            We&apos;ll send you a magic link to sign in.
          </p>

          <Input
            label="Email"
            placeholder="you@example.com"
            value={email}
            onChange={(v) => {
              setEmail(v.toLowerCase().trim());
              setError("");
            }}
            type="email"
            error={error}
          />
          <Button onClick={handleSendLink} loading={loading} disabled={!email}>
            Send Magic Link
          </Button>
        </div>
      </div>
    );
  }

  // Welcome view
  return (
    <div className="min-h-screen flex items-center justify-center px-5">
      <div className="w-full max-w-sm text-center">
        <div className="flex justify-center mb-4">
          <div className="w-[72px] h-[72px] border-[3px] border-accent rounded-[var(--radius)] flex items-center justify-center">
            <span className="text-accent text-4xl font-extrabold leading-none">
              C
            </span>
          </div>
        </div>
        <h1 className="text-3xl font-extrabold tracking-[8px] mb-2">CLASH</h1>
        <p className="text-[var(--muted)] text-base mb-10">Date differently.</p>

        <div className="space-y-3">
          <Button onClick={() => setView("email")}>
            <Phone size={16} /> Continue with Truecaller
          </Button>

          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-[var(--border)]" />
            <span className="text-[11px] font-semibold tracking-wider text-[var(--muted)]">
              OR
            </span>
            <div className="flex-1 h-px bg-[var(--border)]" />
          </div>

          <Button
            variant="outline"
            onClick={() => signInWithProvider("google")}
          >
            Continue with Google
          </Button>
          <Button
            variant="outline"
            onClick={() => signInWithProvider("facebook")}
          >
            Continue with Facebook
          </Button>
          <Button variant="ghost" onClick={() => setView("email")}>
            <Mail size={16} /> Use Email Instead
          </Button>
        </div>

        <p className="text-xs text-[var(--muted)] mt-8">
          By continuing, you agree to our Terms &amp; Privacy Policy.
        </p>
      </div>
    </div>
  );
}
