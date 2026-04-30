import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";

export type ProductCategory =
  | "Food & Delicacies"
  | "Handicrafts"
  | "Apparel"
  | "Keychains & Magnets"
  | "Seasonal Items";

export interface Product {
  id: string;
  vendorId: string;
  vendorName: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  minThreshold: number;
  category: ProductCategory;
  images: string[];
  isBestSeller: boolean;
  isSeasonal: boolean;
  seasonalTag?: string;
  ingredients?: string;
  expirationDate?: string;
  rating: number;
  reviewCount: number;
}

export interface Vendor {
  id: string;
  name: string;
  description: string;
  logo?: string;
  location: string;
  operatingHours: string;
  rating: number;
  totalProducts: number;
  dtiRegistration: string;
}

export interface Order {
  id: string;
  customerId: string;
  customerName: string;
  vendorId: string;
  vendorName: string;
  items: OrderItem[];
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: "pending" | "paid" | "failed" | "refunded";
  orderStatus: "pending" | "preparing" | "ready" | "delivered" | "cancelled";
  deliveryMethod: string;
  deliveryAddress?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

export interface WishlistItem {
  productId: string;
  addedAt: string;
}

export interface InventoryLog {
  id: string;
  productId: string;
  productName: string;
  type: "sale" | "restock" | "adjustment";
  quantityChange: number;
  timestamp: string;
  userId: string;
}

const VENDORS: Vendor[] = [
  {
    id: "v1",
    name: "Groyon Store",
    description: "Premium pili nuts and Bicol delicacies since 1982",
    location: "Stall 12, Ground Floor",
    operatingHours: "7:00 AM - 8:00 PM",
    rating: 4.8,
    totalProducts: 12,
    dtiRegistration: "DTI-2024-001234",
  },
  {
    id: "v2",
    name: "Mayon Treats",
    description: "Your one-stop shop for authentic Bicolano pasalubong",
    location: "Stalls 5-7, Ground Floor",
    operatingHours: "6:00 AM - 9:00 PM",
    rating: 4.6,
    totalProducts: 28,
    dtiRegistration: "DTI-2024-005678",
  },
  {
    id: "v3",
    name: "Angeli's Souvenir Shop",
    description: "Handcrafted abaca gifts and Mayon-inspired memorabilia",
    location: "Stall 23, Second Floor",
    operatingHours: "8:00 AM - 7:00 PM",
    rating: 4.9,
    totalProducts: 18,
    dtiRegistration: "DTI-2024-009012",
  },
];

const INITIAL_PRODUCTS: Product[] = [
  {
    id: "p1",
    vendorId: "v1",
    vendorName: "Groyon Store",
    name: "Premium Pili Nuts (500g)",
    description: "Fresh roasted pili nuts from the volcanic slopes of Bicol. Rich, buttery flavor with a satisfying crunch. Perfect pasalubong for family and friends.",
    price: 285,
    stock: 45,
    minThreshold: 10,
    category: "Food & Delicacies",
    images: [],
    isBestSeller: true,
    isSeasonal: false,
    rating: 4.9,
    reviewCount: 234,
    ingredients: "Pili nuts, coconut oil, sea salt",
    expirationDate: "2025-06-30",
  },
  {
    id: "p2",
    vendorId: "v1",
    vendorName: "Groyon Store",
    name: "Spicy Pili Nuts (250g)",
    description: "Fiery Bicol-style pili nuts with labuyo chili and vinegar glaze. A bold snack for spice lovers.",
    price: 175,
    stock: 8,
    minThreshold: 10,
    category: "Food & Delicacies",
    images: [],
    isBestSeller: false,
    isSeasonal: false,
    rating: 4.7,
    reviewCount: 89,
    ingredients: "Pili nuts, labuyo chili, vinegar, salt",
    expirationDate: "2025-05-15",
  },
  {
    id: "p3",
    vendorId: "v2",
    vendorName: "Mayon Treats",
    name: "Mayon Volcano Keychain",
    description: "Hand-painted ceramic Mayon Volcano keychain. Iconic souvenir from Legazpi City, Albay.",
    price: 95,
    stock: 120,
    minThreshold: 20,
    category: "Keychains & Magnets",
    images: [],
    isBestSeller: true,
    isSeasonal: false,
    rating: 4.5,
    reviewCount: 456,
  },
  {
    id: "p4",
    vendorId: "v3",
    vendorName: "Angeli's Souvenir Shop",
    name: "Abaca Woven Bag",
    description: "Authentic handwoven abaca bag crafted by Bicolano artisans. Durable, eco-friendly, and uniquely Filipino.",
    price: 650,
    stock: 15,
    minThreshold: 5,
    category: "Handicrafts",
    images: [],
    isBestSeller: true,
    isSeasonal: false,
    rating: 4.9,
    reviewCount: 78,
  },
  {
    id: "p5",
    vendorId: "v2",
    vendorName: "Mayon Treats",
    name: "Bicol Express Instant Pack (3-pack)",
    description: "Ready-to-cook authentic Bicol Express with coconut milk and pork. Bring the heat of Bicol to your kitchen.",
    price: 220,
    stock: 60,
    minThreshold: 15,
    category: "Food & Delicacies",
    images: [],
    isBestSeller: false,
    isSeasonal: false,
    rating: 4.6,
    reviewCount: 112,
    ingredients: "Pork, coconut milk, labuyo chili, shrimp paste, garlic",
    expirationDate: "2025-08-01",
  },
  {
    id: "p6",
    vendorId: "v3",
    vendorName: "Angeli's Souvenir Shop",
    name: "Ibalong Festival Shirt",
    description: "Limited edition Ibalong Festival t-shirt featuring traditional Bicolano motifs. Available in S, M, L, XL.",
    price: 350,
    stock: 30,
    minThreshold: 8,
    category: "Apparel",
    images: [],
    isBestSeller: false,
    isSeasonal: true,
    seasonalTag: "Ibalong Festival",
    rating: 4.4,
    reviewCount: 45,
  },
  {
    id: "p7",
    vendorId: "v2",
    vendorName: "Mayon Treats",
    name: "Legazpi City Magnet Set (5pcs)",
    description: "Set of 5 colorful refrigerator magnets featuring Legazpi landmarks: Mayon Volcano, Cagsawa Ruins, Sumlang Lake, and more.",
    price: 150,
    stock: 85,
    minThreshold: 20,
    category: "Keychains & Magnets",
    images: [],
    isBestSeller: false,
    isSeasonal: false,
    rating: 4.3,
    reviewCount: 167,
  },
  {
    id: "p8",
    vendorId: "v1",
    vendorName: "Groyon Store",
    name: "Pili Brittle (300g)",
    description: "Traditional caramelized pili nut brittle. Crunchy, sweet, and addictive. A classic Bicol pasalubong.",
    price: 195,
    stock: 3,
    minThreshold: 10,
    category: "Food & Delicacies",
    images: [],
    isBestSeller: true,
    isSeasonal: false,
    rating: 4.8,
    reviewCount: 203,
    ingredients: "Pili nuts, sugar, butter",
    expirationDate: "2025-04-30",
  },
  {
    id: "p9",
    vendorId: "v3",
    vendorName: "Angeli's Souvenir Shop",
    name: "Abaca Place Mat Set (6pcs)",
    description: "Premium abaca woven placemats. Natural fiber, eco-friendly, adds authentic Filipino charm to any dining table.",
    price: 480,
    stock: 20,
    minThreshold: 5,
    category: "Handicrafts",
    images: [],
    isBestSeller: false,
    isSeasonal: false,
    rating: 4.7,
    reviewCount: 34,
  },
  {
    id: "p10",
    vendorId: "v2",
    vendorName: "Mayon Treats",
    name: "Pinangat sa Gata (Ready-to-Cook)",
    description: "Classic Bicolano Pinangat: taro leaves with pork and coconut milk. Authentic Bicol recipe. Serves 4-6.",
    price: 310,
    stock: 25,
    minThreshold: 8,
    category: "Food & Delicacies",
    images: [],
    isBestSeller: false,
    isSeasonal: false,
    rating: 4.5,
    reviewCount: 67,
    ingredients: "Taro leaves, pork, coconut milk, shrimp paste, spices",
    expirationDate: "2025-05-01",
  },
];

const INITIAL_ORDERS: Order[] = [
  {
    id: "o1",
    customerId: "u3",
    customerName: "Sarah Chen",
    vendorId: "v1",
    vendorName: "Groyon Store",
    items: [
      { productId: "p1", name: "Premium Pili Nuts (500g)", price: 285, quantity: 2 },
      { productId: "p8", name: "Pili Brittle (300g)", price: 195, quantity: 1 },
    ],
    totalAmount: 765,
    paymentMethod: "GCash",
    paymentStatus: "paid",
    orderStatus: "preparing",
    deliveryMethod: "Store Pickup",
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 1800000).toISOString(),
  },
  {
    id: "o2",
    customerId: "u3",
    customerName: "Sarah Chen",
    vendorId: "v3",
    vendorName: "Angeli's Souvenir Shop",
    items: [
      { productId: "p4", name: "Abaca Woven Bag", price: 650, quantity: 1 },
    ],
    totalAmount: 650,
    paymentMethod: "Maya",
    paymentStatus: "paid",
    orderStatus: "delivered",
    deliveryMethod: "J&T Express",
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
];

interface StoreContextType {
  products: Product[];
  vendors: Vendor[];
  orders: Order[];
  wishlist: WishlistItem[];
  inventoryLogs: InventoryLog[];
  addToWishlist: (productId: string) => void;
  removeFromWishlist: (productId: string) => void;
  isWishlisted: (productId: string) => boolean;
  placeOrder: (order: Omit<Order, "id" | "createdAt" | "updatedAt">) => Order;
  updateOrderStatus: (orderId: string, status: Order["orderStatus"]) => void;
  updateStock: (productId: string, delta: number, type: InventoryLog["type"], userId: string) => void;
  getVendorOrders: (vendorId: string) => Order[];
  getCustomerOrders: (customerId: string) => Order[];
  getLowStockProducts: (vendorId?: string) => Product[];
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [inventoryLogs, setInventoryLogs] = useState<InventoryLog[]>([]);

  useEffect(() => {
    AsyncStorage.getItem("@wishlist").then((d) => {
      if (d) setWishlist(JSON.parse(d));
    });
    AsyncStorage.getItem("@orders").then((d) => {
      if (d) setOrders(JSON.parse(d));
    });
    AsyncStorage.getItem("@inventory_logs").then((d) => {
      if (d) setInventoryLogs(JSON.parse(d));
    });
  }, []);

  const addToWishlist = (productId: string) => {
    const item: WishlistItem = { productId, addedAt: new Date().toISOString() };
    const updated = [...wishlist.filter((w) => w.productId !== productId), item];
    setWishlist(updated);
    AsyncStorage.setItem("@wishlist", JSON.stringify(updated));
  };

  const removeFromWishlist = (productId: string) => {
    const updated = wishlist.filter((w) => w.productId !== productId);
    setWishlist(updated);
    AsyncStorage.setItem("@wishlist", JSON.stringify(updated));
  };

  const isWishlisted = (productId: string) =>
    wishlist.some((w) => w.productId === productId);

  const placeOrder = (data: Omit<Order, "id" | "createdAt" | "updatedAt">): Order => {
    const now = new Date().toISOString();
    const order: Order = {
      ...data,
      id: "o" + Date.now().toString(),
      createdAt: now,
      updatedAt: now,
    };
    const updated = [order, ...orders];
    setOrders(updated);
    AsyncStorage.setItem("@orders", JSON.stringify(updated));

    // Deduct stock
    data.items.forEach((item) => {
      updateStock(item.productId, -item.quantity, "sale", data.customerId);
    });

    return order;
  };

  const updateOrderStatus = (orderId: string, status: Order["orderStatus"]) => {
    const updated = orders.map((o) =>
      o.id === orderId ? { ...o, orderStatus: status, updatedAt: new Date().toISOString() } : o
    );
    setOrders(updated);
    AsyncStorage.setItem("@orders", JSON.stringify(updated));
  };

  const updateStock = (productId: string, delta: number, type: InventoryLog["type"], userId: string) => {
    setProducts((prev) =>
      prev.map((p) =>
        p.id === productId
          ? { ...p, stock: Math.max(0, p.stock + delta) }
          : p
      )
    );
    const log: InventoryLog = {
      id: "il" + Date.now().toString() + Math.random().toString(36).substr(2, 5),
      productId,
      productName: products.find((p) => p.id === productId)?.name ?? "",
      type,
      quantityChange: delta,
      timestamp: new Date().toISOString(),
      userId,
    };
    const updatedLogs = [log, ...inventoryLogs];
    setInventoryLogs(updatedLogs);
    AsyncStorage.setItem("@inventory_logs", JSON.stringify(updatedLogs));
  };

  const getVendorOrders = (vendorId: string) =>
    orders.filter((o) => o.vendorId === vendorId);

  const getCustomerOrders = (customerId: string) =>
    orders.filter((o) => o.customerId === customerId);

  const getLowStockProducts = (vendorId?: string) =>
    products.filter((p) => {
      const isLow = p.stock <= p.minThreshold;
      return vendorId ? isLow && p.vendorId === vendorId : isLow;
    });

  return (
    <StoreContext.Provider
      value={{
        products,
        vendors: VENDORS,
        orders,
        wishlist,
        inventoryLogs,
        addToWishlist,
        removeFromWishlist,
        isWishlisted,
        placeOrder,
        updateOrderStatus,
        updateStock,
        getVendorOrders,
        getCustomerOrders,
        getLowStockProducts,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
