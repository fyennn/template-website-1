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
import {
  ADMIN_USER_ACCOUNTS,
  ROLE_DEFAULT_ROUTES,
  AdminRole,
  findAdminAccountByEmail,
  updateAdminProfile,
  updateAdminPassword,
  verifyAdminPassword,
} from "@/lib/adminUsers";

export type AuthenticatedAdmin = {
  name: string;
  email: string;
  phone: string;
  role: AdminRole;
  defaultRoute: string;
  avatarColor?: string;
  avatarInitials?: string;
  bio?: string;
};

type AuthState = {
  user: AuthenticatedAdmin | null;
  isAdmin: boolean;
  isReady: boolean;
  login: (payload: { email: string; password: string }) => Promise<AuthenticatedAdmin | null>;
  logout: () => void;
  updateProfile: (
    updates: Partial<Pick<AuthenticatedAdmin, "name" | "phone" | "avatarColor" | "avatarInitials" | "defaultRoute" | "bio">>
  ) => Promise<AuthenticatedAdmin | null>;
  changePassword: (payload: { currentPassword: string; newPassword: string }) => Promise<boolean>;
};

const STORAGE_KEY = "spm-admin-auth";
type StoredSession = {
  value: boolean;
  email?: string;
  expiresAt: number;
};

const SESSION_DURATION_MS = 12 * 60 * 60 * 1000;

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthenticatedAdmin | null>(null);
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
    setUser(null);
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
      const parsed = JSON.parse(raw) as StoredSession | null;
      if (parsed?.value && typeof parsed.expiresAt === "number") {
        const remaining = parsed.expiresAt - Date.now();
        if (remaining > 0) {
          const email = parsed.email;
          const account = email
            ? findAdminAccountByEmail(email)
            : ADMIN_USER_ACCOUNTS[0] ?? null;
          if (account) {
            setUser({
              name: account.name,
              email: account.email,
              phone: account.phone,
              role: account.role,
              defaultRoute: account.defaultRoute,
              avatarColor: account.avatarColor,
              avatarInitials: account.avatarInitials,
              bio: account.bio,
            });
            scheduleLogout(remaining);
            setIsReady(true);
            return;
          }
          window.localStorage.removeItem(STORAGE_KEY);
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

  const login = useCallback(
    async ({ email, password }: { email: string; password: string }) => {
      const account = findAdminAccountByEmail(email);
      if (account && password === account.password) {
        const authenticated: AuthenticatedAdmin = {
          name: account.name,
          email: account.email,
          phone: account.phone,
          role: account.role,
          defaultRoute: account.defaultRoute ?? ROLE_DEFAULT_ROUTES[account.role],
          avatarColor: account.avatarColor,
          avatarInitials: account.avatarInitials,
          bio: account.bio,
        };
        setUser(authenticated);
        setIsReady(true);
        const payload = {
          value: true,
          email: account.email,
          expiresAt: Date.now() + SESSION_DURATION_MS,
        };
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
        scheduleLogout(SESSION_DURATION_MS);
        return authenticated;
      }
      return null;
    },
    [scheduleLogout]
  );

  const updateProfile = useCallback(
    async (
      updates: Partial<Pick<AuthenticatedAdmin, "name" | "phone" | "avatarColor" | "avatarInitials" | "defaultRoute" | "bio">>
    ) => {
      if (!user) {
        return null;
      }
      const merged = updateAdminProfile(user.email, {
        displayName: updates.name,
        phone: updates.phone,
        avatarColor: updates.avatarColor,
        avatarInitials: updates.avatarInitials,
        defaultRoute: updates.defaultRoute,
        bio: updates.bio,
      });
      if (!merged) {
        return null;
      }
      const refreshed: AuthenticatedAdmin = {
        name: merged.name,
        email: merged.email,
        phone: merged.phone,
        role: merged.role,
        defaultRoute: merged.defaultRoute,
        avatarColor: merged.avatarColor,
        avatarInitials: merged.avatarInitials,
        bio: merged.bio,
      };
      setUser(refreshed);
      setIsReady(true);
      return refreshed;
    },
    [user]
  );

  const changePassword = useCallback(
    async ({ currentPassword, newPassword }: { currentPassword: string; newPassword: string }) => {
      if (!user) {
        return false;
      }
      if (!verifyAdminPassword(user.email, currentPassword)) {
        return false;
      }
      updateAdminPassword(user.email, newPassword);
      return true;
    },
    [user]
  );

  const value = useMemo(
    () => ({
      user,
      isAdmin: Boolean(user),
      isReady,
      login,
      logout,
      updateProfile,
      changePassword,
    }),
    [user, isReady, login, logout, updateProfile, changePassword]
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
