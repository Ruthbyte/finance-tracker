"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useRouter } from "next/navigation";

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  name: string | null;
  imageUrl?: string | null;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoaded: boolean;
  isSignedIn: boolean;
  setUser: (user: AuthUser | null) => void;
  refreshUser: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoaded: false,
  isSignedIn: false,
  setUser: () => {},
  refreshUser: async () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const refreshUser = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user || null);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const signOut = useCallback(async () => {
    try {
      await fetch("/api/auth/sign-out", { method: "POST" });
    } catch (e) {
      console.error("Sign out error:", e);
    } finally {
      setUser(null);
      router.push("/sign-in");
      router.refresh();
    }
  }, [router]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoaded,
        isSignedIn: Boolean(user),
        setUser,
        refreshUser,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

