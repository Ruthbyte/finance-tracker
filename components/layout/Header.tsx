"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus,
  User,
  Menu,
  LogOut,
  Settings,
  LogIn,
} from "lucide-react";
import { Button } from "../ui/button";
import { Avatar, AvatarFallback } from "../ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { NotificationCenter } from "../notifications/NotificationCenter";
import { ThemeToggle } from "../ThemeToggle";
import { useFinance } from "@/lib/finance-context";
import { useAuth } from "@/lib/auth-context";

export function Header() {
  const router = useRouter();
  const { setIsAddTransactionOpen, setIsMobileSidebarOpen } = useFinance();
  const { user, isSignedIn, signOut } = useAuth();

  const initials = user?.username
    ? user.username.slice(0, 2).toUpperCase()
    : user?.name
      ? user.name.slice(0, 2).toUpperCase()
      : "U";

  return (
    <header className="sticky top-0 z-30 w-full flex items-center justify-between border-b border-border bg-background/85 backdrop-blur-xl px-3 sm:px-6 py-2.5 transition-colors">
      {/* Left: Navigation Toggle */}
      <div className="flex items-center gap-2 sm:gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsMobileSidebarOpen((prev) => !prev)}
          className="lg:hidden h-9 w-9 rounded-xl border border-border bg-muted/50 hover:bg-muted text-foreground"
          aria-label="Toggle Navigation Menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      {/* Right: Header Actions & Controls */}
      <div className="flex items-center gap-1.5 sm:gap-2.5">
        <Button
          onClick={() => setIsAddTransactionOpen(true)}
          variant="gradient"
          size="sm"
          className="h-8 sm:h-9 px-2.5 sm:px-3.5 text-xs sm:text-sm shadow-emerald-500/20 font-semibold"
        >
          <Plus className="h-4 w-4 stroke-[2.5]" />
          <span className="hidden sm:inline">New Transaction</span>
        </Button>

        {/* Quick Theme Toggle */}
        <ThemeToggle />

        {/* Notification Center */}
        <NotificationCenter />

        {/* User Profile / Auth */}
        <div className="pl-1.5 sm:pl-2.5 border-l border-border flex items-center gap-2">
          {isSignedIn && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-2 rounded-xl p-1 pr-2 hover:bg-muted/70 transition-colors focus:outline-none"
                >
                  <Avatar className="h-8 w-8 sm:h-9 sm:w-9">
                    <AvatarFallback className="text-xs font-bold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden sm:flex flex-col items-start text-left">
                    <span className="text-xs font-bold text-foreground leading-tight">
                      {user.username}
                    </span>
                    <span className="text-[10px] text-muted-foreground leading-tight max-w-[140px] truncate">
                      {user.email}
                    </span>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 p-1.5">
                <div className="px-2.5 py-2 border-b border-border mb-1">
                  <p className="text-xs font-bold text-foreground truncate">
                    @{user.username}
                  </p>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {user.email}
                  </p>
                </div>
                <DropdownMenuItem
                  onClick={() => router.push("/profile")}
                  className="flex items-center gap-2 cursor-pointer py-2"
                >
                  <Settings className="h-4 w-4 text-muted-foreground" />
                  <span>Profile & Security</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={signOut}
                  className="flex items-center gap-2 cursor-pointer py-2 text-rose-600 dark:text-rose-400 focus:text-rose-600 dark:focus:text-rose-400 focus:bg-rose-500/10"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign Out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              asChild
              variant="outline"
              size="sm"
              className="h-8 sm:h-9 text-xs gap-1.5"
            >
              <Link href="/sign-in">
                <LogIn className="h-3.5 w-3.5" />
                <span>Sign In</span>
              </Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
