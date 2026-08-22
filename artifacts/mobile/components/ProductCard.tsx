import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React from "react";
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useColors } from "@/hooks/useColors";
import { useCart } from "@/context/CartContext";
import { useStore } from "@/context/StoreContext";
import { useAuth } from "@/context/AuthContext";
import { getImageBaseUrl } from "@/lib/api";
import type { Product } from "@/lib/api";

const getImageUrl = (path: string) => {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  return `${getImageBaseUrl()}${path}`;
};

interface Props {
  product: Product;
  compact?: boolean;
}

const LOW_STOCK_THRESHOLD = 10;

export function ProductCard({ product, compact = false }: Props) {
  const colors = useColors();
  const router = useRouter();
  const { addToCart, items } = useCart();
  const { wishlist, addToWishlist, removeFromWishlist } = useStore();
  const { user } = useAuth();

  const inCart = items.some((i) => i.productId === product.id);
  const wishlisted = wishlist.some(w => w.productId === product.id);
  const isLowStock = product.stock > 0 && product.stock <= LOW_STOCK_THRESHOLD;
  const isOutOfStock = product.stock === 0;

  const handleAddToCart = () => {
    if (isOutOfStock || user?.role !== "customer") return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    addToCart(product.id, 1);
  };

  const handleWishlist = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (wishlisted) removeFromWishlist(product.id);
    else addToWishlist(product.id);
  };

  const s = styles(colors);

  if (compact) {
    return (
      <Pressable
        style={({ pressed }) => [s.compactCard, pressed && { opacity: 0.85 }]}
        onPress={() => router.push(`/product/${product.id}` as any)}
      >
        <View style={s.compactImageWrap}>
          {product.images?.[0] ? (
            <Image source={{ uri: getImageUrl(product.images[0]) }} style={s.compactImage} />
          ) : (
            <View style={[s.compactImage, s.imagePlaceholder]}>
              <Feather name="package" size={28} color={colors.mutedForeground} />
            </View>
          )}
          {product.isBestSeller && (
            <View style={s.bestSellerBadge}>
              <Text style={s.bestSellerText}>BEST</Text>
            </View>
          )}
        </View>
        <View style={s.compactInfo}>
          <Text style={s.compactName} numberOfLines={1}>{product.name}</Text>
          <Text style={s.compactVendor} numberOfLines={1}>{product.vendorName}</Text>
          <Text style={s.price}>₱{product.price.toLocaleString()}</Text>
        </View>
      </Pressable>
    );
  }

  return (
    <Pressable
      style={({ pressed }) => [s.card, pressed && { opacity: 0.9 }]}
      onPress={() => router.push(`/product/${product.id}` as any)}
    >
      <View style={s.imageWrap}>
        {product.images?.[0] ? (
          <Image source={{ uri: getImageUrl(product.images[0]) }} style={s.image} />
        ) : (
          <View style={[s.image, s.imagePlaceholder]}>
            <Feather name="package" size={40} color={colors.mutedForeground} />
          </View>
        )}
        <View style={s.badgeRow}>
          {product.isBestSeller && (
            <View style={s.bestSellerBadge}>
              <Text style={s.bestSellerText}>BEST SELLER</Text>
            </View>
          )}
          {product.isSeasonal && (
            <View style={[s.bestSellerBadge, { backgroundColor: colors.gold }]}>
              <Text style={s.bestSellerText}>SEASONAL</Text>
            </View>
          )}
        </View>
        {isLowStock && !isOutOfStock && (
          <View style={s.lowStockBadge}>
            <Text style={s.lowStockText}>Only {product.stock} left!</Text>
          </View>
        )}
        {isOutOfStock && (
          <View style={[s.lowStockBadge, { backgroundColor: colors.mutedForeground }]}>
            <Text style={s.lowStockText}>Out of Stock</Text>
          </View>
        )}
        {user?.role === "customer" && (
          <Pressable style={s.wishlistBtn} onPress={handleWishlist}>
            <Feather
              name="heart"
              size={18}
              color={wishlisted ? colors.destructive : colors.mutedForeground}
            />
          </Pressable>
        )}
      </View>

      <View style={s.info}>
        <View style={s.topRow}>
          <View style={s.infoLeft}>
            <Text style={s.name} numberOfLines={2}>{product.name}</Text>
            <Text style={s.vendor}>{product.vendorName}</Text>
          </View>
        </View>
        <View style={s.ratingRow}>
          <Feather name="star" size={12} color={colors.gold} />
          <Text style={s.rating}>{product.rating.toFixed(1)}</Text>
          <Text style={s.reviewCount}>({product.reviewCount})</Text>
        </View>
        <View style={s.bottomRow}>
          <Text style={s.price}>₱{product.price.toLocaleString()}</Text>
          {user?.role === "customer" && (
            <Pressable
              style={[s.addBtn, (isOutOfStock || inCart) && s.addBtnDisabled]}
              onPress={handleAddToCart}
            >
              <Feather
                name={inCart ? "check" : "plus"}
                size={18}
                color={isOutOfStock ? colors.mutedForeground : colors.primaryForeground}
              />
            </Pressable>
          )}
        </View>
      </View>
    </Pressable>
  );
}

const styles = (colors: ReturnType<typeof useColors>) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.card,
      borderRadius: 12,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: colors.border,
      flex: 1,
    },
    imageWrap: { position: "relative" },
    image: { width: "100%", aspectRatio: 1, backgroundColor: colors.muted },
    imagePlaceholder: {
      alignItems: "center",
      justifyContent: "center",
    },
    badgeRow: {
      position: "absolute",
      top: 8,
      left: 8,
      flexDirection: "row",
      gap: 4,
    },
    bestSellerBadge: {
      backgroundColor: colors.primary,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
    },
    bestSellerText: {
      color: "#fff",
      fontSize: 9,
      fontFamily: "Inter_700Bold",
      letterSpacing: 0.5,
    },
    lowStockBadge: {
      position: "absolute",
      bottom: 8,
      left: 8,
      backgroundColor: colors.warning,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
    },
    lowStockText: {
      color: "#fff",
      fontSize: 10,
      fontFamily: "Inter_600SemiBold",
    },
    wishlistBtn: {
      position: "absolute",
      top: 8,
      right: 8,
      backgroundColor: colors.card,
      borderRadius: 20,
      width: 32,
      height: 32,
      alignItems: "center",
      justifyContent: "center",
      elevation: 2,
    },
    info: { padding: 10 },
    topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
    infoLeft: { flex: 1 },
    name: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: colors.foreground, marginBottom: 2 },
    vendor: { fontSize: 11, color: colors.mutedForeground, fontFamily: "Inter_400Regular", marginBottom: 4 },
    ratingRow: { flexDirection: "row", alignItems: "center", gap: 3, marginBottom: 6 },
    rating: { fontSize: 11, fontFamily: "Inter_600SemiBold", color: colors.foreground },
    reviewCount: { fontSize: 11, color: colors.mutedForeground, fontFamily: "Inter_400Regular" },
    bottomRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    price: { fontSize: 16, fontFamily: "Inter_700Bold", color: colors.primary },
    addBtn: {
      backgroundColor: colors.primary,
      borderRadius: 8,
      width: 32,
      height: 32,
      alignItems: "center",
      justifyContent: "center",
    },
    addBtnDisabled: { backgroundColor: colors.muted },
    compactCard: {
      backgroundColor: colors.card,
      borderRadius: 12,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: colors.border,
      width: 140,
    },
    compactImageWrap: { position: "relative" },
    compactImage: { width: "100%", height: 120, backgroundColor: colors.muted },
    compactInfo: { padding: 8 },
    compactName: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: colors.foreground, marginBottom: 2 },
    compactVendor: { fontSize: 10, color: colors.mutedForeground, fontFamily: "Inter_400Regular", marginBottom: 4 },
  });
