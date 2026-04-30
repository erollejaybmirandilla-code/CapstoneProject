import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { useStore } from "@/context/StoreContext";
import { StockBadge } from "@/components/StockBadge";
import type { Product } from "@/lib/api";

export default function ProductDetailScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { addToCart, items } = useCart();
  const { products, wishlist, addToWishlist, removeFromWishlist, fetchProduct } = useStore();

  const [product, setProduct] = useState<Product | null>(products.find(p => p.id === id) ?? null);
  const [qty, setQty] = useState(1);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (!product && id) {
      fetchProduct(id).then(p => { if (p) setProduct(p); });
    }
  }, [id]);

  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;
  const topInset = Platform.OS === "web" ? 67 : insets.top;

  if (!product) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ color: colors.mutedForeground }}>Product not found</Text>
      </View>
    );
  }

  const cartItem = items.find((i) => i.productId === product.id);
  const inCart = !!cartItem;
  const wishlisted = wishlist.some(w => w.productId === product.id);

  const handleAddToCart = async () => {
    if (product.stock === 0 || user?.role !== "customer") return;
    if (inCart) {
      router.push("/(tabs)/cart" as any);
      return;
    }
    try {
      setAdding(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await addToCart(product.id, qty);
      Alert.alert("Added to Cart", `${product.name} has been added to your cart.`, [
        { text: "Continue Shopping", style: "cancel" },
        { text: "View Cart", onPress: () => router.push("/(tabs)/cart" as any) },
      ]);
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to add to cart");
    } finally {
      setAdding(false);
    }
  };

  const handleWishlist = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      if (wishlisted) await removeFromWishlist(product.id);
      else await addToWishlist(product.id);
    } catch {}
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: bottomInset + 100 }}
      >
        {/* Image */}
        <View style={[s(colors).imageWrap, { paddingTop: topInset }]}>
          <View style={s(colors).image}>
            <Feather name="package" size={64} color={colors.mutedForeground} />
          </View>
          <Pressable style={[s(colors).circleBtn, { top: topInset + 12, left: 16 }]} onPress={() => router.back()}>
            <Feather name="arrow-left" size={20} color={colors.foreground} />
          </Pressable>
          {user?.role === "customer" && (
            <Pressable
              style={[s(colors).circleBtn, { top: topInset + 12, right: 16 }]}
              onPress={handleWishlist}
            >
              <Feather name="heart" size={20} color={wishlisted ? colors.destructive : colors.foreground} />
            </Pressable>
          )}
          {product.isBestSeller && (
            <View style={s(colors).bestBadge}>
              <Text style={s(colors).bestBadgeText}>BEST SELLER</Text>
            </View>
          )}
        </View>

        <View style={s(colors).content}>
          {/* Name & Price */}
          <View style={s(colors).topRow}>
            <Text style={s(colors).productName}>{product.name}</Text>
            <View>
              <Text style={s(colors).price}>₱{product.price.toLocaleString()}</Text>
              {product.compareAtPrice && (
                <Text style={s(colors).comparePrice}>₱{product.compareAtPrice.toLocaleString()}</Text>
              )}
            </View>
          </View>

          {/* Vendor */}
          <Pressable
            style={s(colors).vendorRow}
            onPress={() => router.push(`/vendor/${product.vendorId}` as any)}
          >
            <View style={s(colors).vendorIcon}>
              <Feather name="shopping-bag" size={14} color={colors.primary} />
            </View>
            <Text style={s(colors).vendorName}>{product.vendorName}</Text>
            <Feather name="chevron-right" size={14} color={colors.mutedForeground} />
          </Pressable>

          {/* Rating */}
          <View style={s(colors).ratingRow}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Feather
                key={star}
                name="star"
                size={16}
                color={star <= Math.round(product.rating) ? colors.gold : colors.border}
              />
            ))}
            <Text style={s(colors).ratingText}>{product.rating.toFixed(1)}</Text>
            <Text style={s(colors).reviewText}>({product.reviewCount} reviews)</Text>
          </View>

          {/* Stock */}
          <StockBadge stock={product.stock} />

          {/* Category */}
          {product.categoryName && (
            <View style={s(colors).infoRow}>
              <Feather name="tag" size={14} color={colors.mutedForeground} />
              <Text style={s(colors).infoText}>{product.categoryName}</Text>
            </View>
          )}

          {/* Description */}
          <View style={s(colors).section}>
            <Text style={s(colors).sectionTitle}>Description</Text>
            <Text style={s(colors).description}>{product.description}</Text>
          </View>

          {/* Food info */}
          {(product.ingredients || product.expirationMonths || product.weight) && (
            <View style={s(colors).section}>
              <Text style={s(colors).sectionTitle}>Product Details</Text>
              {product.ingredients && (
                <View style={s(colors).detailRow}>
                  <Text style={s(colors).detailLabel}>Ingredients</Text>
                  <Text style={s(colors).detailValue}>{product.ingredients}</Text>
                </View>
              )}
              {product.expirationMonths && (
                <View style={s(colors).detailRow}>
                  <Text style={s(colors).detailLabel}>Shelf Life</Text>
                  <Text style={s(colors).detailValue}>{product.expirationMonths} months</Text>
                </View>
              )}
              {product.weight && (
                <View style={s(colors).detailRow}>
                  <Text style={s(colors).detailLabel}>Weight</Text>
                  <Text style={s(colors).detailValue}>{product.weight}</Text>
                </View>
              )}
              <View style={s(colors).detailRow}>
                <Text style={s(colors).detailLabel}>Unit</Text>
                <Text style={s(colors).detailValue}>{product.unit}</Text>
              </View>
            </View>
          )}

          {/* Seasonal badge */}
          {product.isSeasonal && (
            <View style={s(colors).seasonBadge}>
              <Feather name="sun" size={14} color={colors.gold} />
              <Text style={s(colors).seasonText}>Seasonal Item — Limited Stock</Text>
            </View>
          )}

          {/* Quantity selector (customers only) */}
          {user?.role === "customer" && product.stock > 0 && !inCart && (
            <View style={s(colors).section}>
              <Text style={s(colors).sectionTitle}>Quantity</Text>
              <View style={s(colors).qtyRow}>
                <Pressable style={s(colors).qtyBtn} onPress={() => setQty(Math.max(1, qty - 1))}>
                  <Feather name="minus" size={18} color={colors.foreground} />
                </Pressable>
                <Text style={s(colors).qtyValue}>{qty}</Text>
                <Pressable style={s(colors).qtyBtn} onPress={() => setQty(Math.min(product.stock, qty + 1))}>
                  <Feather name="plus" size={18} color={colors.foreground} />
                </Pressable>
                <Text style={s(colors).qtySubtotal}>= ₱{(product.price * qty).toLocaleString()}</Text>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottom Action */}
      {user?.role === "customer" && (
        <View style={[s(colors).bottomBar, { paddingBottom: bottomInset + 12 }]}>
          <Pressable
            style={({ pressed }) => [
              s(colors).addBtn,
              product.stock === 0 && s(colors).addBtnDisabled,
              pressed && { opacity: 0.85 },
            ]}
            onPress={handleAddToCart}
            disabled={product.stock === 0 || adding}
          >
            <Feather name={inCart ? "shopping-bag" : "shopping-cart"} size={20} color="#fff" />
            <Text style={s(colors).addBtnText}>
              {product.stock === 0 ? "Out of Stock" : inCart ? "View Cart" : adding ? "Adding..." : "Add to Cart"}
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const s = (colors: ReturnType<typeof useColors>) =>
  StyleSheet.create({
    imageWrap: { position: "relative", backgroundColor: colors.muted },
    image: { height: 280, alignItems: "center", justifyContent: "center" },
    circleBtn: {
      position: "absolute",
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.card,
      alignItems: "center",
      justifyContent: "center",
      elevation: 3,
    },
    bestBadge: { position: "absolute", bottom: 12, left: 16, backgroundColor: colors.primary, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    bestBadgeText: { color: "#fff", fontSize: 10, fontFamily: "Inter_700Bold", letterSpacing: 0.5 },
    content: { padding: 20, gap: 14 },
    topRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 12 },
    productName: { flex: 1, fontSize: 22, fontFamily: "Inter_700Bold", color: colors.foreground, lineHeight: 28 },
    price: { fontSize: 24, fontFamily: "Inter_700Bold", color: colors.primary },
    comparePrice: { fontSize: 14, color: colors.mutedForeground, fontFamily: "Inter_400Regular", textDecorationLine: "line-through", textAlign: "right" },
    vendorRow: { flexDirection: "row", alignItems: "center", gap: 8 },
    vendorIcon: { width: 28, height: 28, borderRadius: 8, backgroundColor: colors.secondary, alignItems: "center", justifyContent: "center" },
    vendorName: { flex: 1, fontSize: 14, fontFamily: "Inter_500Medium", color: colors.foreground },
    ratingRow: { flexDirection: "row", alignItems: "center", gap: 4 },
    ratingText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: colors.foreground, marginLeft: 4 },
    reviewText: { fontSize: 13, color: colors.mutedForeground, fontFamily: "Inter_400Regular" },
    infoRow: { flexDirection: "row", alignItems: "center", gap: 8 },
    infoText: { fontSize: 13, color: colors.mutedForeground, fontFamily: "Inter_400Regular" },
    section: { gap: 8 },
    sectionTitle: { fontSize: 15, fontFamily: "Inter_700Bold", color: colors.foreground },
    description: { fontSize: 14, color: colors.foreground, fontFamily: "Inter_400Regular", lineHeight: 22 },
    detailRow: { flexDirection: "row", gap: 12, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: colors.border },
    detailLabel: { width: 100, fontSize: 13, fontFamily: "Inter_500Medium", color: colors.mutedForeground },
    detailValue: { flex: 1, fontSize: 13, color: colors.foreground, fontFamily: "Inter_400Regular" },
    seasonBadge: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: colors.goldLight, borderRadius: 10, padding: 12 },
    seasonText: { fontSize: 13, fontFamily: "Inter_500Medium", color: colors.gold },
    qtyRow: { flexDirection: "row", alignItems: "center", gap: 16 },
    qtyBtn: { width: 40, height: 40, borderRadius: 10, backgroundColor: colors.secondary, alignItems: "center", justifyContent: "center" },
    qtyValue: { fontSize: 20, fontFamily: "Inter_700Bold", color: colors.foreground, minWidth: 32, textAlign: "center" },
    qtySubtotal: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: colors.primary, marginLeft: 8 },
    bottomBar: { position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: colors.card, borderTopWidth: 1, borderTopColor: colors.border, paddingHorizontal: 16, paddingTop: 12 },
    addBtn: { backgroundColor: colors.primary, borderRadius: 14, height: 54, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10 },
    addBtnDisabled: { backgroundColor: colors.mutedForeground },
    addBtnText: { color: "#fff", fontFamily: "Inter_700Bold", fontSize: 16 },
  });
