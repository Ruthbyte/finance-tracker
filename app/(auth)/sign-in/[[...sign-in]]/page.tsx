"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  TrendingUp,
  User,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  ArrowRight,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/lib/auth-context";

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser } = useAuth();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/sign-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Invalid username/email or password.");
        return;
      }

      setUser(data.user);
      const redirectUrl = searchParams.get("redirect_url") || "/dashboard";
      router.push(redirectUrl);
      router.refresh();
    } catch {
      setError("Network error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md glass-card rounded-2xl p-6 sm:p-8 shadow-xl relative z-10">
      <div className="text-center mb-6">
        <h1 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">
          Welcome Back
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          Sign in with your username or email to access your dashboard
        </p>
      </div>

      {error && (
        <div className="mb-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="identifier">Username or Email</Label>
          <div className="relative">
            <User className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" />
            <Input
              id="identifier"
              type="text"
              placeholder="username or you@example.com"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="pl-10"
              autoComplete="username"
              required
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10 pr-10"
              autoComplete="current-password"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        <Button
          type="submit"
          variant="gradient"
          className="w-full h-11 font-bold gap-2 mt-2"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Signing In...
            </>
          ) : (
            <>
              Sign In <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </form>

      <div className="mt-6 pt-5 border-t border-border text-center text-xs text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link
          href="/sign-up"
          className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
        >
          Create an account
        </Link>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-center items-center p-4 relative overflow-hidden transition-colors">
      {/* Theme Toggle in top-right */}
      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle />
      </div>

      {/* Ambient background accents */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Brand Header */}
      <Link href="/" className="flex items-center gap-3 mb-6 group relative z-10">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white dark:text-slate-950 shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
          <TrendingUp className="h-6 w-6 stroke-[2.5]" />
        </div>
        <span className="text-2xl font-black tracking-tight text-foreground">
          Finance
          <span className="text-emerald-600 dark:text-emerald-400">Tracker</span>
        </span>
      </Link>

      <Suspense fallback={null}>
        <SignInForm />
      </Suspense>
    </div>
  );
}
