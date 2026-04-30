import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";

export type UserRole = "admin" | "staff" | "customer";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  kycVerified: boolean;
  avatar?: string;
  vendorId?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  updateKycStatus: (verified: boolean) => void;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  phone: string;
  role?: UserRole;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const MOCK_USERS: Record<string, { password: string; user: User }> = {
  "admin@legazpimarket.ph": {
    password: "admin123",
    user: {
      id: "u1",
      name: "Maria Santos",
      email: "admin@legazpimarket.ph",
      role: "admin",
      phone: "+63 912 345 6789",
      kycVerified: true,
      vendorId: "v1",
    },
  },
  "staff@groyon.ph": {
    password: "staff123",
    user: {
      id: "u2",
      name: "Juan dela Cruz",
      email: "staff@groyon.ph",
      role: "staff",
      phone: "+63 917 234 5678",
      kycVerified: true,
      vendorId: "v1",
    },
  },
  "customer@gmail.com": {
    password: "customer123",
    user: {
      id: "u3",
      name: "Sarah Chen",
      email: "customer@gmail.com",
      role: "customer",
      phone: "+63 918 765 4321",
      kycVerified: false,
    },
  },
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const stored = await AsyncStorage.getItem("@auth_user");
        if (stored) {
          setUser(JSON.parse(stored));
        }
      } catch (_) {}
      setIsLoading(false);
    };
    loadUser();
  }, []);

  const login = async (email: string, password: string) => {
    const entry = MOCK_USERS[email.toLowerCase()];
    if (!entry || entry.password !== password) {
      throw new Error("Invalid email or password");
    }
    const loggedIn = entry.user;
    await AsyncStorage.setItem("@auth_user", JSON.stringify(loggedIn));
    setUser(loggedIn);
  };

  const logout = async () => {
    await AsyncStorage.removeItem("@auth_user");
    setUser(null);
  };

  const register = async (data: RegisterData) => {
    const newUser: User = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      name: data.name,
      email: data.email,
      role: data.role ?? "customer",
      phone: data.phone,
      kycVerified: false,
    };
    await AsyncStorage.setItem("@auth_user", JSON.stringify(newUser));
    setUser(newUser);
  };

  const updateKycStatus = (verified: boolean) => {
    if (!user) return;
    const updated = { ...user, kycVerified: verified };
    setUser(updated);
    AsyncStorage.setItem("@auth_user", JSON.stringify(updated));
  };

  return (
    <AuthContext.Provider
      value={{ user, isLoading, login, logout, register, updateKycStatus }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
