import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import {
  api,
  Product, Vendor, Category, Order, InventoryItem,
  AppNotification, WishlistItem, AnalyticsSummary, KycVerification, SafeUser
} from "@/lib/api";
import { useAuth } from "./AuthContext";

type StoreContextType = {
  products: Product[];
  vendors: Vendor[];
  categories: Category[];
  orders: Order[];
  inventory: InventoryItem[];
  notifications: AppNotification[];
  wishlist: WishlistItem[];
  analytics: AnalyticsSummary | null;
  kycStatus: KycVerification | null;
  adminUsers: SafeUser[];
  selectedUser: (SafeUser & { orderStats?: { totalOrders: number; totalSpent: number } }) | null;

  isLoadingProducts: boolean;
  isLoadingOrders: boolean;
  isLoadingUsers: boolean;

  fetchProducts: (params?: Record<string, string>) => Promise<Product[]>;
  fetchProduct: (id: string) => Promise<Product | null>;
  fetchVendors: () => Promise<void>;
  fetchCategories: () => Promise<void>;
  fetchOrders: (params?: Record<string, string>) => Promise<void>;
  fetchInventory: (params?: Record<string, string>) => Promise<void>;
  fetchNotifications: () => Promise<void>;
  fetchWishlist: () => Promise<void>;
  fetchAnalytics: (period?: string) => Promise<void>;
  fetchKycStatus: () => Promise<void>;

  fetchAdminUsers: (params?: Record<string, string>) => Promise<void>;
  fetchUserDetails: (id: string) => Promise<void>;
  updateUserRole: (id: string, role: string) => Promise<void>;
  updateUserVerification: (id: string, isVerified: boolean) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;

  placeOrder: (orderData: {
    paymentMethod: string;
    deliveryMethod: string;
    deliveryAddress?: string | null;
    notes?: string | null;
    referenceNumber?: string | null;
    items: { productId: string; quantity: number }[];
  }) => Promise<Order>;

  updateOrderStatus: (orderId: string, status: string) => Promise<void>;
  restockProduct: (productId: string, quantity: number, notes?: string) => Promise<void>;
  addToWishlist: (productId: string) => Promise<void>;
  removeFromWishlist: (productId: string) => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  submitKyc: (data: {
    firstName: string; lastName: string; birthDate: string;
    address: string; idType: string; idNumber: string;
  }) => Promise<void>;
};

const StoreContext = createContext<StoreContextType | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [kycStatus, setKycStatus] = useState<KycVerification | null>(null);
  const [adminUsers, setAdminUsers] = useState<SafeUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<(SafeUser & { orderStats?: { totalOrders: number; totalSpent: number } }) | null>(null);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  useEffect(() => {
    fetchCategories();
    fetchVendors();
    fetchProducts();
  }, []);

  useEffect(() => {
    if (user) {
      fetchNotifications();
      fetchWishlist();
      fetchOrders();
      if (user.role === "admin" || user.role === "staff") {
        fetchInventory();
        fetchAnalytics();
      }
      if (user.kycStatus !== "none") {
        fetchKycStatus();
      }
    }
  }, [user?.id]);

  const fetchProducts = useCallback(async (params: Record<string, string> = {}) => {
    setIsLoadingProducts(true);
    try {
      const query = new URLSearchParams(params).toString();
      const data = await api.get<{ products: Product[]; total: number }>(`/products${query ? `?${query}` : ""}`);
      if (!params.categoryId && !params.vendorId && !params.search) {
        setProducts(data.products);
      }
      return data.products;
    } catch {
      return [];
    } finally {
      setIsLoadingProducts(false);
    }
  }, []);

  const fetchProduct = useCallback(async (id: string): Promise<Product | null> => {
    try {
      return await api.get<Product>(`/products/${id}`);
    } catch {
      return null;
    }
  }, []);

  const fetchVendors = useCallback(async () => {
    try {
      const data = await api.get<Vendor[]>("/vendors");
      setVendors(data);
    } catch {}
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const data = await api.get<Category[]>("/categories");
      setCategories(data);
    } catch {}
  }, []);

  const fetchOrders = useCallback(async (params: Record<string, string> = {}) => {
    setIsLoadingOrders(true);
    try {
      const query = new URLSearchParams(params).toString();
      const data = await api.get<{ orders: Order[] }>(`/orders${query ? `?${query}` : ""}`);
      setOrders(data.orders);
    } catch {} finally {
      setIsLoadingOrders(false);
    }
  }, []);

  const fetchInventory = useCallback(async (params: Record<string, string> = {}) => {
    try {
      const query = new URLSearchParams(params).toString();
      const data = await api.get<InventoryItem[]>(`/inventory${query ? `?${query}` : ""}`);
      setInventory(data);
    } catch {}
  }, []);

  const fetchNotifications = useCallback(async () => {
    try {
      const data = await api.get<AppNotification[]>("/notifications");
      setNotifications(data);
    } catch {}
  }, []);

  const fetchWishlist = useCallback(async () => {
    try {
      const data = await api.get<WishlistItem[]>("/wishlist");
      setWishlist(data);
    } catch {}
  }, []);

  const fetchAnalytics = useCallback(async (period = "month") => {
    try {
      const data = await api.get<AnalyticsSummary>(`/analytics/summary?period=${period}`);
      setAnalytics(data);
    } catch {}
  }, []);

  const fetchKycStatus = useCallback(async () => {
    try {
      const data = await api.get<KycVerification>("/kyc/status");
      setKycStatus(data);
    } catch (e: any) {
      if (e.message?.includes("404") || e.message?.includes("No KYC")) {
        setKycStatus(null);
      }
    }
  }, []);

  const placeOrder = useCallback(async (orderData: any): Promise<Order> => {
    const order = await api.post<Order>("/orders", orderData);
    setOrders(prev => [order, ...prev]);
    return order;
  }, []);

  const updateOrderStatus = useCallback(async (orderId: string, status: string) => {
    const updated = await api.put<Order>(`/orders/${orderId}/status`, { status });
    setOrders(prev => prev.map(o => o.id === orderId ? updated : o));
  }, []);

  const restockProduct = useCallback(async (productId: string, quantity: number, notes?: string) => {
    const updated = await api.post<InventoryItem>(`/inventory/${productId}/restock`, { quantity, notes });
    setInventory(prev => prev.map(i => i.productId === productId ? updated : i));
    setProducts(prev => prev.map(p => p.id === productId ? { ...p, stock: updated.stock } : p));
  }, []);

  const addToWishlist = useCallback(async (productId: string) => {
    await api.post("/wishlist", { productId });
    await fetchWishlist();
  }, [fetchWishlist]);

  const removeFromWishlist = useCallback(async (productId: string) => {
    await api.delete(`/wishlist/${productId}`);
    setWishlist(prev => prev.filter(w => w.productId !== productId));
  }, []);

  const markNotificationRead = useCallback(async (id: string) => {
    await api.put(`/notifications/${id}/read`);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  }, []);

  const markAllNotificationsRead = useCallback(async () => {
    await api.put("/notifications/read-all");
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  }, []);

  const submitKyc = useCallback(async (data: any) => {
    const result = await api.post<KycVerification>("/kyc/submit", data);
    setKycStatus(result);
  }, []);

  const fetchAdminUsers = useCallback(async (params: Record<string, string> = {}) => {
    setIsLoadingUsers(true);
    try {
      const query = new URLSearchParams(params).toString();
      const data = await api.get<{ users: SafeUser[]; total: number }>(`/users${query ? `?${query}` : ""}`);
      setAdminUsers(data.users);
    } catch {
      setAdminUsers([]);
    } finally {
      setIsLoadingUsers(false);
    }
  }, []);

  const fetchUserDetails = useCallback(async (id: string) => {
    try {
      const data = await api.get<SafeUser & { orderStats: { totalOrders: number; totalSpent: number } }>(`/users/${id}`);
      setSelectedUser(data);
    } catch {
      setSelectedUser(null);
    }
  }, []);

  const updateUserRole = useCallback(async (id: string, role: string) => {
    await api.put(`/users/${id}/role`, { role });
    setAdminUsers(prev => prev.map(u => u.id === id ? { ...u, role: role as any } : u));
  }, []);

  const updateUserVerification = useCallback(async (id: string, isVerified: boolean) => {
    await api.put(`/users/${id}/verify`, { isVerified });
    setAdminUsers(prev => prev.map(u => u.id === id ? { ...u, isVerified } : u));
  }, []);

  const deleteUser = useCallback(async (id: string) => {
    await api.delete(`/users/${id}`);
    setAdminUsers(prev => prev.filter(u => u.id !== id));
  }, []);

  return (
    <StoreContext.Provider value={{
      products, vendors, categories, orders, inventory,
      notifications, wishlist, analytics, kycStatus,
      adminUsers, selectedUser,
      isLoadingProducts, isLoadingOrders, isLoadingUsers,
      fetchProducts, fetchProduct, fetchVendors, fetchCategories,
      fetchOrders, fetchInventory, fetchNotifications, fetchWishlist,
      fetchAnalytics, fetchKycStatus,
      fetchAdminUsers, fetchUserDetails, updateUserRole, updateUserVerification, deleteUser,
      placeOrder, updateOrderStatus, restockProduct,
      addToWishlist, removeFromWishlist,
      markNotificationRead, markAllNotificationsRead,
      submitKyc,
    }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}

export type { Product, Vendor, Category, Order, InventoryItem, AppNotification, WishlistItem, SafeUser };
