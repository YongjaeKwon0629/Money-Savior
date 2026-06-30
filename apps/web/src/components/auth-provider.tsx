"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  AuthResponse,
  clearSession,
  getStoredSession,
  saveInputId,
  saveSession,
} from "@/lib/money-coach";

type AuthContextValue = {
  isAuthenticated: boolean;
  isHydrated: boolean;
  userName: string;
  savedInputId: number | null;
  login: (payload: AuthResponse) => void;
  logout: () => void;
  setLatestInputId: (inputId: number) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isHydrated, setIsHydrated] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userName, setUserName] = useState("");
  const [savedInputId, setSavedInputId] = useState<number | null>(null);

  useEffect(() => {
    const session = getStoredSession();

    setIsAuthenticated(Boolean(session.accessToken));
    setUserName(session.userName);
    setSavedInputId(session.savedInputId);
    setIsHydrated(true);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      isAuthenticated,
      isHydrated,
      userName,
      savedInputId,
      login(payload) {
        saveSession(payload);
        setIsAuthenticated(true);
        setUserName(payload.user.name);
      },
      logout() {
        clearSession();
        setIsAuthenticated(false);
        setUserName("");
        setSavedInputId(null);
      },
      setLatestInputId(inputId) {
        saveInputId(inputId);
        setSavedInputId(inputId);
      },
    }),
    [isAuthenticated, isHydrated, savedInputId, userName],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider.");
  }

  return context;
}
