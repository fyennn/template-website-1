"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type AuthState = {
  isAdmin: boolean;
  login: (payload: { email: string; password: string }) => Promise<boolean>;
  logout: () => void;
};

const STORAGE_KEY = "spm-admin-auth";
const ADMIN_CREDENTIALS = {
  email: "admin@spmcafe.id",
  password: "spm-admin",
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === "true") {
      setIsAdmin(true);
    }
  }, []);

  const login = useCallback(async ({ email, password }: { email: string; password: string }) => {
    const match =
      email.trim().toLowerCase() === ADMIN_CREDENTIALS.email &&
      password === ADMIN_CREDENTIALS.password;
    if (match) {
      setIsAdmin(true);
      window.localStorage.setItem(STORAGE_KEY, "true");
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    setIsAdmin(false);
    window.localStorage.removeItem(STORAGE_KEY);
  }, []);

  const value = useMemo(() => ({ isAdmin, login, logout }), [isAdmin, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
