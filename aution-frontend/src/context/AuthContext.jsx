import { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import { jwtDecode } from "jwt-decode";
import { getToken, setToken, onUnauthorized } from "../api/client";
import * as authApi from "../api/auth";

const AuthContext = createContext(null);

function normalizeRole(role) {
  // Backend authorities come through as "ROLE_ADMIN" / "ROLE_AUCTIONEER" / "ROLE_BIDDER".
  // Strip the Spring Security "ROLE_" prefix so the rest of the app can compare
  // against plain "ADMIN" / "AUCTIONEER" / "BIDDER" everywhere, consistently.
  if (!role) return role;
  return role.startsWith("ROLE_") ? role.slice(5) : role;
}

function decodeUser(token) {
  if (!token) return null;
  try {
    const payload = jwtDecode(token);
    return {
      username: payload.sub,
      role: normalizeRole(payload.role),
      userId: payload.userId,
      exp: payload.exp,
    };
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => decodeUser(getToken()));
  const [loading, setLoading] = useState(false);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    // A 401 from anywhere in the app funnels through here.
    onUnauthorized(() => logout());
  }, [logout]);

  useEffect(() => {
    // Passive expiry check so a stale token doesn't sit around looking valid.
    if (user?.exp && user.exp * 1000 < Date.now()) {
      logout();
    }
  }, [user, logout]);

  const login = useCallback(async (username, password) => {
    setLoading(true);
    try {
      const res = await authApi.login(username, password);
      setToken(res.token);
      setUser(decodeUser(res.token));
      return res;
    } finally {
      setLoading(false);
    }
  }, []);

  const registerAccount = useCallback(async (payload) => {
    setLoading(true);
    try {
      const res = await authApi.register(payload);
      setToken(res.token);
      setUser(decodeUser(res.token));
      return res;
    } finally {
      setLoading(false);
    }
  }, []);

  const value = useMemo(
    () => ({ user, isAuthenticated: !!user, loading, login, registerAccount, logout }),
    [user, loading, login, registerAccount, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}