"use client";

export const ADMIN_ROLES = ["Pemilik", "Manager", "Supervisor", "Staff Kasir", "Staff Kitchen"] as const;

export type AdminRole = typeof ADMIN_ROLES[number];

export type AdminUserRecord = {
  name: string;
  email: string;
  phone: string;
  role: AdminRole;
  status: "active" | "inactive" | "pending";
  lastLogin: string;
  password: string;
  defaultRoute: string;
  avatarColor?: string;
  avatarInitials?: string;
  bio?: string;
};

export type AdminProfileOverride = {
  displayName?: string;
  phone?: string;
  avatarColor?: string;
  avatarInitials?: string;
  bio?: string;
  password?: string;
  defaultRoute?: string;
};

const PROFILE_OVERRIDES_KEY = "spm-admin-profile-overrides";
const SETTINGS_STORAGE_KEY = "spm-admin-settings";

export const ROLE_DEFAULT_ROUTES: Record<AdminRole, string> = {
  Pemilik: "/admin",
  Manager: "/admin",
  Supervisor: "/orders",
  "Staff Kasir": "/cashier",
  "Staff Kitchen": "/orders",
};

export const ROLE_ALLOWED_PREFIXES: Record<AdminRole, string[]> = {
  Pemilik: ["/", "/admin", "/admin/profile", "/cashier", "/orders"],
  Manager: ["/", "/admin", "/admin/profile", "/cashier", "/orders"],
  Supervisor: ["/", "/admin", "/admin/profile", "/orders"],
  "Staff Kasir": ["/", "/admin/profile", "/cashier"],
  "Staff Kitchen": ["/", "/admin/profile", "/orders"],
};

const ROLE_COLOR_MAP: Record<AdminRole, string> = {
  Pemilik: "#34d399",
  Manager: "#60a5fa",
  Supervisor: "#fbbf24",
  "Staff Kasir": "#a855f7",
  "Staff Kitchen": "#fb7185",
};

const DEFAULT_PASSWORD = "spmlogin1";

export const ADMIN_USER_ACCOUNTS: AdminUserRecord[] = [
  {
    name: "Adit Pratama",
    email: "adit@spmcafe.com",
    phone: "+62 812-0000-1111",
    role: "Pemilik",
    status: "active",
    lastLogin: "Hari ini, 08:45",
    password: DEFAULT_PASSWORD,
    defaultRoute: ROLE_DEFAULT_ROUTES["Pemilik"],
    avatarColor: ROLE_COLOR_MAP["Pemilik"],
  },
  {
    name: "Sinta Dewi",
    email: "sinta@spmcafe.com",
    phone: "+62 812-0000-2222",
    role: "Manager",
    status: "active",
    lastLogin: "Kemarin, 17:20",
    password: DEFAULT_PASSWORD,
    defaultRoute: ROLE_DEFAULT_ROUTES["Manager"],
    avatarColor: ROLE_COLOR_MAP["Manager"],
  },
  {
    name: "Rudi Hartono",
    email: "rudi@spmcafe.com",
    phone: "+62 812-0000-3333",
    role: "Supervisor",
    status: "active",
    lastLogin: "3 hari lalu, 10:05",
    password: DEFAULT_PASSWORD,
    defaultRoute: ROLE_DEFAULT_ROUTES["Supervisor"],
    avatarColor: ROLE_COLOR_MAP["Supervisor"],
  },
  {
    name: "Mila Anggraini",
    email: "kasir@spmcafe.com",
    phone: "+62 812-0000-4444",
    role: "Staff Kasir",
    status: "active",
    lastLogin: "Hari ini, 09:10",
    password: DEFAULT_PASSWORD,
    defaultRoute: ROLE_DEFAULT_ROUTES["Staff Kasir"],
    avatarColor: ROLE_COLOR_MAP["Staff Kasir"],
  },
  {
    name: "Beni Saputra",
    email: "kitchen@spmcafe.com",
    phone: "+62 812-0000-5555",
    role: "Staff Kitchen",
    status: "active",
    lastLogin: "Kemarin, 21:40",
    password: DEFAULT_PASSWORD,
    defaultRoute: ROLE_DEFAULT_ROUTES["Staff Kitchen"],
    avatarColor: ROLE_COLOR_MAP["Staff Kitchen"],
  },
];

type ProfileOverrideMap = Record<string, AdminProfileOverride>;

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((part) => part.charAt(0).toUpperCase()).join("") || "AD";
}

function loadOverrides(): ProfileOverrideMap {
  if (typeof window === "undefined") {
    return {};
  }
  try {
    const raw = window.localStorage.getItem(PROFILE_OVERRIDES_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as ProfileOverrideMap | null;
    if (parsed && typeof parsed === "object") {
      return parsed;
    }
  } catch (error) {
    console.error("Failed to load admin profile overrides", error);
  }
  return {};
}

function saveOverrides(map: ProfileOverrideMap) {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(PROFILE_OVERRIDES_KEY, JSON.stringify(map));
  } catch (error) {
    console.error("Failed to persist admin profile overrides", error);
  }
}

function mergeAccount(account: AdminUserRecord): AdminUserRecord {
  const overrides = loadOverrides();
  const key = account.email.toLowerCase();
  const override = overrides[key] ?? {};
  const displayName = override.displayName?.trim() || account.name;
  const phone = override.phone?.trim() || account.phone;
  const avatarColor = override.avatarColor || account.avatarColor || ROLE_COLOR_MAP[account.role];
  const avatarInitials = override.avatarInitials?.trim() || account.avatarInitials || getInitials(displayName);
  const password = override.password || account.password || DEFAULT_PASSWORD;
  const bio = override.bio ?? account.bio ?? "";
  const defaultRouteCandidate = override.defaultRoute || account.defaultRoute || ROLE_DEFAULT_ROUTES[account.role];
  const safeDefaultRoute = isRouteAllowedForRole(defaultRouteCandidate, account.role)
    ? defaultRouteCandidate
    : ROLE_DEFAULT_ROUTES[account.role];

  return {
    ...account,
    name: displayName,
    phone,
    avatarColor,
    avatarInitials,
    password,
    bio,
    defaultRoute: safeDefaultRoute,
  };
}

function sanitizeAccountForSettings(account: AdminUserRecord) {
  return {
    name: account.name,
    email: account.email,
    phone: account.phone,
    role: account.role,
    status: account.status,
    lastLogin: account.lastLogin,
  };
}

export function getAllAdminAccounts(): AdminUserRecord[] {
  return ADMIN_USER_ACCOUNTS.map((account) => mergeAccount(account));
}

export function getAdminAccountsForSettings() {
  return getAllAdminAccounts().map(sanitizeAccountForSettings);
}

export function findAdminAccountByEmail(email: string) {
  const normalized = email.trim().toLowerCase();
  const base = ADMIN_USER_ACCOUNTS.find((account) => account.email.toLowerCase() === normalized);
  return base ? mergeAccount(base) : null;
}

export function verifyAdminPassword(email: string, password: string) {
  const account = findAdminAccountByEmail(email);
  if (!account) return false;
  return account.password === password;
}

export function updateAdminPassword(email: string, password: string) {
  if (typeof window === "undefined") return null;
  const overrides = loadOverrides();
  const key = email.toLowerCase();
  const current = overrides[key] ?? {};
  overrides[key] = { ...current, password };
  saveOverrides(overrides);
  syncAdminAccountsToSettings();
  return findAdminAccountByEmail(email);
}

export function updateAdminProfile(email: string, updates: AdminProfileOverride) {
  if (typeof window === "undefined") return findAdminAccountByEmail(email);
  const overrides = loadOverrides();
  const key = email.toLowerCase();
  const current = overrides[key] ?? {};
  const next: AdminProfileOverride = {
    ...current,
  };

  if (updates.displayName !== undefined) {
    const value = updates.displayName?.trim();
    if (value) {
      next.displayName = value;
    } else {
      delete next.displayName;
    }
  }

  if (updates.phone !== undefined) {
    const value = updates.phone?.trim();
    if (value) {
      next.phone = value;
    } else {
      delete next.phone;
    }
  }

  if (updates.avatarColor !== undefined) {
    const value = updates.avatarColor?.trim();
    if (value) {
      next.avatarColor = value;
    } else {
      delete next.avatarColor;
    }
  }

  if (updates.avatarInitials !== undefined) {
    const value = updates.avatarInitials?.trim();
    if (value) {
      next.avatarInitials = value.toUpperCase().slice(0, 3);
    } else {
      delete next.avatarInitials;
    }
  }

  if (updates.bio !== undefined) {
    const value = updates.bio?.trim();
    if (value) {
      next.bio = value;
    } else {
      delete next.bio;
    }
  }

  if (updates.defaultRoute !== undefined) {
    const base = ADMIN_USER_ACCOUNTS.find((account) => account.email.toLowerCase() === key);
    const value = updates.defaultRoute;
    if (base && value && isRouteAllowedForRole(value, base.role)) {
      next.defaultRoute = value;
    } else if (base) {
      delete next.defaultRoute;
    }
  }

  overrides[key] = next;
  saveOverrides(overrides);
  syncAdminAccountsToSettings();
  return findAdminAccountByEmail(email);
}

export function isRouteAllowedForRole(path: string, role: AdminRole) {
  const normalized = path.split("?")[0];
  const prefixes = ROLE_ALLOWED_PREFIXES[role] ?? ["/"];
  return prefixes.some((prefix) => normalized === prefix || normalized.startsWith(`${prefix}/`));
}

export function syncAdminAccountsToSettings() {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    parsed.adminAccounts = getAdminAccountsForSettings();
    window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(parsed));
  } catch (error) {
    console.error("Failed to synchronize admin accounts to settings", error);
  }
}
