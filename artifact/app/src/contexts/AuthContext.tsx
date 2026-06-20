import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";

export interface AuthUser { id: string; email: string; name: string; role: string; avatar_color: string; }
const ROLES = {
  owner:       { canApprove: true, canManageTeam: true, canSeePnl: true, canManageSuppliers: true, canManagePpc: true },
  manager:     { canApprove: true, canManageTeam: false, canSeePnl: true, canManageSuppliers: true, canManagePpc: true },
  sourcer:     { canApprove: false, canManageTeam: false, canSeePnl: false, canManageSuppliers: true, canManagePpc: false },
  ppc_manager: { canApprove: false, canManageTeam: false, canSeePnl: true, canManageSuppliers: false, canManagePpc: true },
  viewer:      { canApprove: false, canManageTeam: false, canSeePnl: false, canManageSuppliers: false, canManagePpc: false },
};
type Permission = keyof typeof ROLES.owner;

interface AuthCtx {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  hasUsers: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, role?: string) => Promise<void>;
  logout: () => void;
  can: (p: Permission) => boolean;
  authHeader: () => Record<string, string>;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("az_token"));
  const [loading, setLoading] = useState(true);
  const [hasUsers, setHasUsers] = useState(true);

  useEffect(() => {
    // Check if any users exist
    fetch("/api/auth/status").then(r => r.json()).then(d => {
      setHasUsers(d.has_users ?? false);
    }).catch(() => setHasUsers(false));

    if (!token) { setLoading(false); return; }
    fetch("/api/auth/me", { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(u => { setUser(u); setLoading(false); })
      .catch(() => { localStorage.removeItem("az_token"); setToken(null); setLoading(false); });
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
    if (!res.ok) { const e = await res.json(); throw new Error(e.error ?? "Login failed"); }
    const { token: t, user: u } = await res.json();
    localStorage.setItem("az_token", t);
    setToken(t);
    setUser(u);
  }, []);

  const register = useCallback(async (name: string, email: string, password: string, role?: string) => {
    const res = await fetch("/api/auth/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, email, password, role }) });
    if (!res.ok) { const e = await res.json(); throw new Error(e.error ?? "Registration failed"); }
    const { token: t, user: u } = await res.json();
    localStorage.setItem("az_token", t);
    setToken(t);
    setUser(u);
    setHasUsers(true);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("az_token");
    setToken(null);
    setUser(null);
  }, []);

  const can = useCallback((p: Permission): boolean => {
    if (!user) return true; // no auth = full access (single-user mode)
    const perms = ROLES[user.role as keyof typeof ROLES] ?? ROLES.viewer;
    return perms[p] ?? false;
  }, [user]);

  const authHeader = useCallback((): Record<string, string> => {
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, [token]);

  return <Ctx.Provider value={{ user, token, loading, hasUsers, login, register, logout, can, authHeader }}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
