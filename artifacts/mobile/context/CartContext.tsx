import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api, CartResponse, CartItem } from "@/lib/api";
import { useAuth } from "./AuthContext";

type CartContextType = {
  items: CartItem[];
  subtotal: number;
  totalItems: number;
  isLoading: boolean;
  addToCart: (productId: string, quantity?: number) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
};

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartResponse>({ items: [], subtotal: 0, totalItems: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      refreshCart();
    } else {
      setCart({ items: [], subtotal: 0, totalItems: 0 });
    }
  }, [user?.id]);

  const refreshCart = useCallback(async () => {
    if (!user) return;
    try {
      const data = await api.get<CartResponse>("/cart");
      setCart(data);
    } catch {}
  }, [user?.id]);

  async function addToCart(productId: string, quantity = 1) {
    const data = await api.post<CartResponse>("/cart", { productId, quantity });
    setCart(data);
  }

  async function updateQuantity(itemId: string, quantity: number) {
    if (quantity < 1) {
      await removeItem(itemId);
      return;
    }
    const data = await api.put<CartResponse>(`/cart/${itemId}`, { quantity });
    setCart(data);
  }

  async function removeItem(itemId: string) {
    const data = await api.delete<CartResponse>(`/cart/${itemId}`);
    setCart(data);
  }

  async function clearCart() {
    await api.delete("/cart");
    setCart({ items: [], subtotal: 0, totalItems: 0 });
  }

  return (
    <CartContext.Provider value={{
      items: cart.items,
      subtotal: cart.subtotal,
      totalItems: cart.totalItems,
      isLoading,
      addToCart,
      updateQuantity,
      removeItem,
      clearCart,
      refreshCart,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}

export type { CartItem };
