"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

type AuthState = {
  isAdmin: boolean;
  isReady: boolean;
  login: (payload: { email: string; password: string }) => Promise<boolean>;
  logout: () => void;
};

const STORAGE_KEY = "spm-admin-auth";
const ADMIN_CREDENTIALS = {
  email: "admin@spmcafe.id",
  password: "spm-admin",
};
const SESSION_DURATION_MS = 12 * 60 * 60 * 1000;

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const logoutTimerRef = useRef<number | null>(null);

  const clearScheduledLogout = useCallback(() => {
    if (logoutTimerRef.current) {
      window.clearTimeout(logoutTimerRef.current);
      logoutTimerRef.current = null;
    }
  }, []);

  const logout = useCallback(() => {
    clearScheduledLogout();
    setIsAdmin(false);
    setIsReady(true);
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, [clearScheduledLogout]);

  const scheduleLogout = useCallback(
    (delay: number) => {
      clearScheduledLogout();
      if (delay <= 0) {
        logout();
        return;
      }
      logoutTimerRef.current = window.setTimeout(() => {
        logout();
      }, delay);
    },
    [clearScheduledLogout, logout]
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        setIsReady(true);
        return;
      }
      const parsed = JSON.parse(raw) as { value: boolean; expiresAt: number } | null;
      if (parsed?.value && typeof parsed.expiresAt === "number") {
        const remaining = parsed.expiresAt - Date.now();
        if (remaining > 0) {
          setIsAdmin(true);
          scheduleLogout(remaining);
          setIsReady(true);
          return;
        }
      }
      window.localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error("Failed to restore admin session", error);
      window.localStorage.removeItem(STORAGE_KEY);
    }
    setIsReady(true);
  }, [scheduleLogout]);

  useEffect(() => () => clearScheduledLogout(), [clearScheduledLogout]);

  const login = useCallback(async ({ email, password }: { email: string; password: string }) => {
    const match =
      email.trim().toLowerCase() === ADMIN_CREDENTIALS.email &&
      password === ADMIN_CREDENTIALS.password;
    if (match) {
      setIsAdmin(true);
      setIsReady(true);
      const payload = {
        value: true,
        expiresAt: Date.now() + SESSION_DURATION_MS,
      };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      scheduleLogout(SESSION_DURATION_MS);
      return true;
    }
    return false;
  }, [scheduleLogout]);

  const value = useMemo(
    () => ({ isAdmin, isReady, login, logout }),
    [isAdmin, isReady, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
