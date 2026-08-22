import React, { createContext, useContext, useEffect, useState } from "react";
import { api, SafeUser, loadToken, setToken } from "@/lib/api";

type VendorDetails = {
  name: string;
  description: string;
  location: string;
  dtiRegistration: string;
};

type RegisterArgs = {
  email: string;
  password: string;
  name: string;
  phone?: string;
  accountType: "customer" | "vendor";
  vendorDetails?: VendorDetails;
};

type AuthContextType = {
  user: SafeUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (args: RegisterArgs) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateKycStatus: (verified: boolean) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SafeUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    initialize();
  }, []);

  async function initialize() {
    try {
      await loadToken();
      const me = await api.get<SafeUser>("/auth/me");
      setUser(me);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }

  async function login(email: string, password: string) {
    const res = await api.post<{ user: SafeUser; token: string }>("/auth/login", { email, password });
    setToken(res.token);
    setUser(res.user);
  }

  async function register(args: RegisterArgs) {
    const res = await api.post<{ user: SafeUser; token: string }>("/auth/register", args);
    setToken(res.token);
    setUser(res.user);
  }

  async function logout() {
    try {
      await api.post("/auth/logout");
    } catch {}
    setToken(null);
    setUser(null);
  }

  async function refreshUser() {
    try {
      const me = await api.get<SafeUser>("/auth/me");
      setUser(me);
    } catch {}
  }

  async function updateKycStatus(verified: boolean) {
    if (verified) {
      await refreshUser();
    }
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, refreshUser, updateKycStatus }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export type { SafeUser, VendorDetails, RegisterArgs };
export type UserRole = SafeUser["role"];
