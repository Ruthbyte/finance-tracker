"use client";

import React, { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import {
  User,
  KeyRound,
  ShieldCheck,
  Save,
  CheckCircle2,
  Sun,
  Moon,
  Monitor,
  Palette,
  Check,
  AlertCircle,
  LogOut,
  Loader2,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { useFinance } from "@/lib/finance-context";
import { useAuth } from "@/lib/auth-context";
import { DashboardSkeleton } from "@/components/loading/DashboardSkeleton";

export function ProfileTab() {
  const { isInitialized } = useFinance();
  const { user, setUser, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    setMounted(true);
    if (user) {
      setUsername(user.username || "");
      setFullName(user.name || user.username || "");
      setEmail(user.email || "");
    }
  }, [user]);

  if (!isInitialized) {
    return <DashboardSkeleton />;
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    setIsSavingProfile(true);

    try {
      const res = await fetch("/api/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          name: fullName,
          email,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || "Failed to update profile.");
        return;
      }
      if (data.user) {
        setUser(data.user);
      }
      setSuccessMessage("Profile information updated successfully!");
      setTimeout(() => setSuccessMessage(""), 4000);
    } catch {
      setErrorMessage("Network error while updating profile.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (newPassword !== confirmPassword) {
      setErrorMessage("New passwords do not match!");
      return;
    }

    if (newPassword.length < 6) {
      setErrorMessage("New password must be at least 6 characters long.");
      return;
    }

    setIsSavingPassword(true);
    try {
      const res = await fetch("/api/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CHANGE_PASSWORD",
          currentPassword,
          newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || "Failed to change password.");
        return;
      }
      setSuccessMessage("Password changed and hashed securely!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setSuccessMessage(""), 4000);
    } catch {
      setErrorMessage("Network error while changing password.");
    } finally {
      setIsSavingPassword(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 max-w-4xl mx-auto">
      <PageHeader
        title="Profile & Security"
        description="Manage your username, email, password, and visual theme preferences."
        action={
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="gap-1.5 py-1 px-3 border-emerald-500/30 text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 font-semibold"
            >
              <ShieldCheck className="h-4 w-4" /> Secured Auth
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={signOut}
              className="gap-1.5 text-rose-600 dark:text-rose-400 border-rose-500/30 hover:bg-rose-500/10"
            >
              <LogOut className="h-3.5 w-3.5" /> Sign Out
            </Button>
          </div>
        }
      />

      {successMessage && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-sm font-semibold">
          <CheckCircle2 className="h-5 w-5 shrink-0" /> {successMessage}
        </div>
      )}

      {errorMessage && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-sm font-semibold">
          <AlertCircle className="h-5 w-5 shrink-0" /> {errorMessage}
        </div>
      )}

      {/* Personal Information Card */}
      <Card className="glass-card">
        <CardHeader className="flex flex-row items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
            <User className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-base">Profile Management</CardTitle>
            <p className="text-xs text-muted-foreground">
              Update your username, display name, and email address
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="profile-username">Username</Label>
                <Input
                  id="profile-username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="username"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="profile-name">Display Name</Label>
                <Input
                  id="profile-name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Full Name"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="profile-email">Email Address</Label>
                <Input
                  id="profile-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>
            <Button
              type="submit"
              variant="gradient"
              size="sm"
              className="gap-2"
              disabled={isSavingProfile}
            >
              {isSavingProfile ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" /> Save Profile Details
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Wide Appearance & Theme Preference Card */}
      {mounted && (
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 text-amber-600 dark:text-amber-400">
              <Palette className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base">
                Appearance & Interface Theme
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Choose your preferred visual aesthetic for the finance dashboard.
              </p>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Light Mode Option */}
              <button
                type="button"
                onClick={() => setTheme("light")}
                className={`p-4 rounded-xl border flex flex-col items-center text-center transition-all ${
                  theme === "light"
                    ? "border-amber-500 bg-amber-500/10 text-amber-700 dark:text-amber-400 shadow-sm"
                    : "border-border bg-muted/40 text-muted-foreground hover:border-slate-300 dark:hover:border-zinc-700 hover:bg-muted/70"
                }`}
              >
                <div className="h-12 w-12 rounded-xl bg-amber-500/15 flex items-center justify-center mb-3 text-amber-600 dark:text-amber-400">
                  <Sun className="h-6 w-6" />
                </div>
                <span className="font-bold text-sm text-foreground">
                  Light Mode
                </span>
                <span className="text-[11px] text-muted-foreground mt-1">
                  Clean & crisp daylight look
                </span>
                {theme === "light" && (
                  <div className="mt-3 flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400">
                    <Check className="h-3.5 w-3.5" /> Active Theme
                  </div>
                )}
              </button>

              {/* Dark Mode Option */}
              <button
                type="button"
                onClick={() => setTheme("dark")}
                className={`p-4 rounded-xl border flex flex-col items-center text-center transition-all ${
                  theme === "dark"
                    ? "border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 shadow-sm"
                    : "border-border bg-muted/40 text-muted-foreground hover:border-slate-300 dark:hover:border-zinc-700 hover:bg-muted/70"
                }`}
              >
                <div className="h-12 w-12 rounded-xl bg-emerald-500/15 flex items-center justify-center mb-3 text-emerald-600 dark:text-emerald-400">
                  <Moon className="h-6 w-6" />
                </div>
                <span className="font-bold text-sm text-foreground">
                  Dark Mode
                </span>
                <span className="text-[11px] text-muted-foreground mt-1">
                  Sleek dark glow aesthetic
                </span>
                {theme === "dark" && (
                  <div className="mt-3 flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                    <Check className="h-3.5 w-3.5" /> Active Theme
                  </div>
                )}
              </button>

              {/* System Preference */}
              <button
                type="button"
                onClick={() => setTheme("system")}
                className={`p-4 rounded-xl border flex flex-col items-center text-center transition-all ${
                  theme === "system"
                    ? "border-cyan-500 bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 shadow-sm"
                    : "border-border bg-muted/40 text-muted-foreground hover:border-slate-300 dark:hover:border-zinc-700 hover:bg-muted/70"
                }`}
              >
                <div className="h-12 w-12 rounded-xl bg-cyan-500/15 flex items-center justify-center mb-3 text-cyan-600 dark:text-cyan-400">
                  <Monitor className="h-6 w-6" />
                </div>
                <span className="font-bold text-sm text-foreground">
                  System Preference
                </span>
                <span className="text-[11px] text-muted-foreground mt-1">
                  Automatically syncs with OS
                </span>
                {theme === "system" && (
                  <div className="mt-3 flex items-center gap-1 text-[11px] font-bold text-cyan-600 dark:text-cyan-400">
                    <Check className="h-3.5 w-3.5" /> Active Theme
                  </div>
                )}
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Security & Password Change Card */}
      <Card className="glass-card">
        <CardHeader className="flex flex-row items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20 text-cyan-600 dark:text-cyan-400">
            <KeyRound className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-base">
              Security & Password Management
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Passwords are cryptographically salted and hashed prior to storage.
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="current-password">Current Password</Label>
              <Input
                id="current-password"
                type="password"
                placeholder="••••••••"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="new-password">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  minLength={6}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  minLength={6}
                  required
                />
              </div>
            </div>
            <Button
              type="submit"
              variant="secondary"
              size="sm"
              className="gap-2"
              disabled={isSavingPassword}
            >
              {isSavingPassword ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Updating...
                </>
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />{" "}
                  Change Password
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
