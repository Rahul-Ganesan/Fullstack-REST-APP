import { createContext, useContext, useEffect, useMemo, useState } from "react";

import { apiRequest } from "../../api/client";

export type UserRole = "admin" | "analyst";

export interface AuthUser {
  id: number;
  email: string;
  role: UserRole;
  createdAt: string;
}

interface AuthContextShape {
  token: string | null;
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  refresh: () => Promise<string | null>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextShape | null>(null);
const TOKEN_KEY = "dashboard_auth_token";

interface LoginResponse {
  token: string;
  user: AuthUser;
}

interface RefreshResponse {
  token: string;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      if (!token) {
        setUser(null);
        setIsLoading(false);
        return;
      }

      try {
        const me = await apiRequest<AuthUser>("/auth/me", {}, token);
        setUser(me);
      } catch {
        localStorage.removeItem(TOKEN_KEY);
        setToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }

    void loadUser();
  }, [token]);

  async function login(email: string, password: string) {
    const data = await apiRequest<LoginResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    localStorage.setItem(TOKEN_KEY, data.token);
    setToken(data.token);
    setUser(data.user);
  }

  async function refresh() {
    try {
      const data = await apiRequest<RefreshResponse>("/auth/refresh", {
        method: "POST",
      });
      localStorage.setItem(TOKEN_KEY, data.token);
      setToken(data.token);
      return data.token;
    } catch {
      localStorage.removeItem(TOKEN_KEY);
      setToken(null);
      setUser(null);
      return null;
    }
  }

  async function logout() {
    try {
      await apiRequest("/auth/logout", { method: "POST" }, token ?? undefined);
    } catch {
      // Best-effort logout; clear local state either way.
    }
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  }

  const value = useMemo(
    () => ({ token, user, isLoading, login, refresh, logout }),
    [token, user, isLoading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
