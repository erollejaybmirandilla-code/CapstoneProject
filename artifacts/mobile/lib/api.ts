import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

// Cloudflare Tunnel URL for API access (publicly accessible)
const CLOUDFLARE_API_URL = "https://fighting-flight-hebrew-contributor.trycloudflare.com/api";

const getBaseUrl = () => {
  // For native platforms (iOS/Android), use the Cloudflare tunnel URL
  if (Platform.OS !== "web") {
    return process.env.EXPO_PUBLIC_API_URL || CLOUDFLARE_API_URL;
  }
  
  // For web platform:
  // - In production/public access, use the full Cloudflare API URL
  // - In local development, use relative /api path (proxied by Expo dev server)
  const apiUrl = process.env.EXPO_PUBLIC_API_URL;
  if (apiUrl && apiUrl.includes("trycloudflare.com")) {
    return apiUrl;
  }
  
  // Local development fallback
  return "/api";
};

const BASE_URL = getBaseUrl();

let sessionToken: string | null = null;

export async function loadToken() {
  sessionToken = await AsyncStorage.getItem("session_token");
}

export function setToken(token: string | null) {
  sessionToken = token;
  if (token) {
    AsyncStorage.setItem("session_token", token);
  } else {
    AsyncStorage.removeItem("session_token");
  }
}

export function getToken() {
  return sessionToken;
}

export function getApiBaseUrl() {
  return BASE_URL;
}

export function getImageBaseUrl() {
  // Remove /api suffix to get the base URL for static files
  const apiBase = BASE_URL;
  if (apiBase.endsWith("/api")) {
    return apiBase.slice(0, -4);
  }
  return apiBase;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> || {}),
  };

  if (sessionToken) {
    headers["Authorization"] = `Bearer ${sessionToken}`;
    headers["X-Session-Token"] = sessionToken;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
    credentials: "include",
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(data.error || `HTTP ${res.status}`);
  }

  return res.json();
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: "POST", body: body !== undefined ? JSON.stringify(body) : undefined }),
  put: <T>(path: string, body?: unknown) => request<T>(path, { method: "PUT", body: body !== undefined ? JSON.stringify(body) : undefined }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};

export async function uploadProductImage(productId: string, imageUri: string): Promise<{ imageUrl: string }> {
  const formData = new FormData();
  const filename = imageUri.split("/").pop() || "image.jpg";
  const match = /\.(\w+)$/.exec(filename);
  const type = match ? `image/${match[1]}` : "image/jpeg";

  formData.append("image", {
    uri: imageUri,
    name: filename,
    type,
  } as any);

  const res = await fetch(`${BASE_URL}/products/${productId}/images`, {
    method: "POST",
    headers: {
      "Authorization": sessionToken ? `Bearer ${sessionToken}` : "",
      "X-Session-Token": sessionToken || "",
    },
    body: formData,
    credentials: "include",
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({ error: "Upload failed" }));
    throw new Error(data.error || `HTTP ${res.status}`);
  }

  return res.json();
}

export type SafeUser = {
  id: string;
  email: string;
  name: string;
  phone?: string | null;
  role: "admin" | "staff" | "customer";
   isVerified: boolean;
  kycStatus: "none" | "pending" | "approved" | "rejected";
  vendorId?: string | null;
  avatarUrl?: string | null;
  createdAt: string;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  icon: string;
  sortOrder: number;
};

export type Vendor = {
  id: string;
  name: string;
  description: string;
  location: string;
  operatingHours: string;
  dtiRegistration: string;
  rating: number;
  totalProducts: number;
  isActive: boolean;
  imageUrl?: string | null;
};

export type Product = {
  id: string;
  vendorId: string;
  categoryId: string;
  name: string;
  description: string;
  price: number;
  compareAtPrice?: number | null;
  unit: string;
  stock: number;
  images: string[];
  isBestSeller: boolean;
  isSeasonal: boolean;
  isActive: boolean;
  sku?: string | null;
  tags: string[];
  rating: number;
  reviewCount: number;
  ingredients?: string | null;
  expirationMonths?: number | null;
  weight?: string | null;
  vendorName?: string | null;
  categoryName?: string | null;
  createdAt: string;
};

export type CartItem = {
  id: string;
  productId: string;
  quantity: number;
  product: Product;
};

export type CartResponse = {
  items: CartItem[];
  subtotal: number;
  totalItems: number;
};

export type OrderItem = {
  id: string;
  productId: string;
  productName: string;
  productImage?: string | null;
  price: number;
  quantity: number;
  vendorId?: string | null;
  vendorName?: string | null;
};

export type Order = {
  id: string;
  userId: string;
  status: "pending" | "confirmed" | "preparing" | "ready" | "out_for_delivery" | "delivered" | "cancelled";
  paymentMethod: "gcash" | "maya" | "cod" | "bank_transfer" | "seven_eleven";
  paymentStatus: "unpaid" | "paid" | "refunded";
  deliveryMethod: "pickup" | "lalamove" | "jnt" | "lbc" | "hotel_dropoff";
  deliveryAddress?: string | null;
  deliveryFee: number;
  subtotal: number;
  total: number;
  notes?: string | null;
  referenceNumber?: string | null;
  items: OrderItem[];
  customerName?: string | null;
  customerEmail?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type InventoryItem = {
  productId: string;
  productName: string;
  vendorId: string;
  vendorName: string;
  stock: number;
  sku?: string | null;
  isActive: boolean;
  price: number;
};

export type AppNotification = {
  id: string;
  userId: string;
  title: string;
  body: string;
  type: string;
  isRead: boolean;
  relatedId?: string | null;
  createdAt: string;
};

export type WishlistItem = {
  id: string;
  productId: string;
  product: Product;
  createdAt: string;
};

export type AnalyticsSummary = {
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  totalCustomers: number;
  avgOrderValue: number;
  pendingOrders: number;
  lowStockItems: number;
  topProducts: { productId: string; productName: string; totalSold: number; revenue: number }[];
  vendorRevenue: { vendorId: string; vendorName: string; revenue: number; orders: number }[];
  paymentBreakdown: { method: string; count: number; total: number }[];
  revenueByDay: { date: string; revenue: number; orders: number }[];
};

export type KycVerification = {
  id: string;
  userId: string;
  status: "pending" | "approved" | "rejected";
  firstName: string;
  lastName: string;
  birthDate: string;
  address: string;
  idType: string;
  idNumber: string;
  reviewNotes?: string | null;
  submittedAt: string;
  reviewedAt?: string | null;
};
