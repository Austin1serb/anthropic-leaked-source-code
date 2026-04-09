"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { Wine, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

function LoginForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/arena";
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (mode === "signup") {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        setLoading(false);
        return;
      }
    }

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError(mode === "signup" ? "Account created but login failed. Try logging in." : "Invalid email or password");
      setLoading(false);
    } else {
      window.location.href = callbackUrl;
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6 safe-top safe-bottom">
      {/* Back to home */}
      <Link
        href="/"
        className="absolute top-4 left-4 safe-top touch-target flex items-center gap-1 text-sm text-muted"
      >
        <ArrowLeft size={18} /> Back
      </Link>

      {/* Logo */}
      <div className="flex flex-col items-center mb-10 animate-fade-in-up">
        <div className="w-20 h-20 rounded-full bg-cherry flex items-center justify-center mb-4 shadow-lg shadow-cherry/20">
          <Wine size={40} className="text-white" />
        </div>
        <h1 className="text-3xl font-bold font-serif text-foreground">
          Winebob
        </h1>
        <p className="text-sm text-muted mt-2 text-center max-w-xs">
          {mode === "login"
            ? "Sign in to host blind tasting events."
            : "Create your host account."}
        </p>
      </div>

      {/* Email/Password form */}
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-3">
        {mode === "signup" && (
          <input
            type="text"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full h-14 px-4 rounded-xl bg-card-bg border border-card-border text-sm focus:outline-none focus:ring-2 focus:ring-cherry/30 focus:border-cherry/50"
          />
        )}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full h-14 px-4 rounded-xl bg-card-bg border border-card-border text-sm focus:outline-none focus:ring-2 focus:ring-cherry/30 focus:border-cherry/50"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          className="w-full h-14 px-4 rounded-xl bg-card-bg border border-card-border text-sm focus:outline-none focus:ring-2 focus:ring-cherry/30 focus:border-cherry/50"
        />

        {error && (
          <p className="text-sm text-cherry text-center">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full h-14 bg-cherry text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-transform shadow-md shadow-cherry/20 disabled:opacity-60"
        >
          {loading ? (
            <Loader2 size={18} className="animate-spin" />
          ) : mode === "login" ? (
            "Sign In"
          ) : (
            "Create Account"
          )}
        </button>
      </form>

      {/* Toggle login/signup */}
      <button
        onClick={() => {
          setMode(mode === "login" ? "signup" : "login");
          setError("");
        }}
        className="mt-4 text-sm text-cherry font-medium"
      >
        {mode === "login"
          ? "Don't have an account? Sign up"
          : "Already have an account? Sign in"}
      </button>

      {/* Divider */}
      <div className="flex items-center gap-3 w-full max-w-sm my-6">
        <div className="flex-1 h-px bg-card-border" />
        <span className="text-xs text-muted">or</span>
        <div className="flex-1 h-px bg-card-border" />
      </div>

      {/* OAuth buttons */}
      <div className="w-full max-w-sm space-y-3">
        <button
          onClick={() => signIn("google", { callbackUrl })}
          className="w-full py-4 bg-card-bg border border-card-border rounded-2xl font-semibold text-sm flex items-center justify-center gap-3 active:scale-[0.98] transition-transform shadow-sm"
        >
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          Continue with Google
        </button>

        <button
          onClick={() => signIn("apple", { callbackUrl })}
          className="w-full py-4 bg-foreground text-background rounded-2xl font-semibold text-sm flex items-center justify-center gap-3 active:scale-[0.98] transition-transform"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
          </svg>
          Continue with Apple
        </button>
      </div>

      <p className="text-xs text-muted mt-8 text-center">
        By continuing, you agree to Winebob&apos;s Terms of Service and Privacy Policy.
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
