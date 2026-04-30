import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  vendorId: string;
  vendorName: string;
  maxStock: number;
}

interface CartContextType {
  items: CartItem[];
  totalItems: number;
  totalAmount: number;
  addItem: (item: Omit<CartItem, "quantity">) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    AsyncStorage.getItem("@cart").then((stored) => {
      if (stored) setItems(JSON.parse(stored));
    });
  }, []);

  const save = (newItems: CartItem[]) => {
    setItems(newItems);
    AsyncStorage.setItem("@cart", JSON.stringify(newItems));
  };

  const addItem = (item: Omit<CartItem, "quantity">) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === item.productId);
      let updated: CartItem[];
      if (existing) {
        updated = prev.map((i) =>
          i.productId === item.productId
            ? { ...i, quantity: Math.min(i.quantity + 1, i.maxStock) }
            : i
        );
      } else {
        updated = [...prev, { ...item, quantity: 1 }];
      }
      AsyncStorage.setItem("@cart", JSON.stringify(updated));
      return updated;
    });
  };

  const removeItem = (productId: string) => {
    const updated = items.filter((i) => i.productId !== productId);
    save(updated);
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }
    const updated = items.map((i) =>
      i.productId === productId
        ? { ...i, quantity: Math.min(quantity, i.maxStock) }
        : i
    );
    save(updated);
  };

  const clearCart = () => save([]);

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalAmount = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <CartContext.Provider
      value={{ items, totalItems, totalAmount, addItem, removeItem, updateQuantity, clearCart }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
