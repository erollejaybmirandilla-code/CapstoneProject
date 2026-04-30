import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React from "react";
import {
  FlatList,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import { useCart } from "@/context/CartContext";

export default function CartScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { items, subtotal, totalItems, updateQuantity, removeItem, clearCart } = useCart();

  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  if (items.length === 0) {
    return (
      <View style={[s(colors).container, { paddingTop: topInset + 12 }]}>
        <View style={s(colors).headerRow}>
          <Text style={s(colors).title}>Shopping Cart</Text>
        </View>
        <View style={s(colors).empty}>
          <Feather name="shopping-bag" size={56} color={colors.mutedForeground} />
          <Text style={s(colors).emptyTitle}>Your cart is empty</Text>
          <Text style={s(colors).emptySub}>Discover authentic Bicolano souvenirs</Text>
          <Pressable
            style={s(colors).browsBtn}
            onPress={() => router.push("/(tabs)/catalog" as any)}
          >
            <Text style={s(colors).browsBtnText}>Browse Products</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={[s(colors).container, { paddingTop: topInset + 12 }]}>
      <View style={s(colors).headerRow}>
        <Text style={s(colors).title}>Cart ({totalItems})</Text>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            clearCart();
          }}
        >
          <Text style={{ color: colors.destructive, fontFamily: "Inter_500Medium", fontSize: 13 }}>Clear All</Text>
        </Pressable>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.productId}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 12, paddingBottom: 200 }}
        renderItem={({ item }) => (
          <View style={s(colors).itemCard}>
            <View style={s(colors).itemImage}>
              {item.product.images?.[0] ? (
                <Image source={{ uri: item.product.images[0] }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
              ) : (
                <Feather name="package" size={28} color={colors.mutedForeground} />
              )}
            </View>
            <View style={s(colors).itemInfo}>
              <Text style={s(colors).itemName} numberOfLines={2}>{item.product.name}</Text>
              <Text style={s(colors).itemVendor}>{item.product.vendorName}</Text>
              <Text style={s(colors).itemPrice}>₱{item.product.price.toLocaleString()}</Text>
              <View style={s(colors).qtyRow}>
                <Pressable
                  style={s(colors).qtyBtn}
                  onPress={() => {
                    Haptics.selectionAsync();
                    updateQuantity(item.id, item.quantity - 1);
                  }}
                >
                  <Feather name="minus" size={14} color={colors.foreground} />
                </Pressable>
                <Text style={s(colors).qtyText}>{item.quantity}</Text>
                <Pressable
                  style={s(colors).qtyBtn}
                  onPress={() => {
                    Haptics.selectionAsync();
                    updateQuantity(item.id, item.quantity + 1);
                  }}
                >
                  <Feather name="plus" size={14} color={colors.foreground} />
                </Pressable>
              </View>
            </View>
            <View style={s(colors).itemRight}>
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  removeItem(item.id);
                }}
                style={s(colors).removeBtn}
              >
                <Feather name="trash-2" size={16} color={colors.destructive} />
              </Pressable>
              <Text style={s(colors).itemTotal}>
                ₱{(item.product.price * item.quantity).toLocaleString()}
              </Text>
            </View>
          </View>
        )}
      />

      {/* Checkout Bar */}
      <View style={[s(colors).checkoutBar, { paddingBottom: bottomInset + 12 }]}>
        <View style={s(colors).totalRow}>
          <Text style={s(colors).totalLabel}>Total ({totalItems} items)</Text>
          <Text style={s(colors).totalAmount}>₱{subtotal.toLocaleString()}</Text>
        </View>
        <Pressable
          style={({ pressed }) => [s(colors).checkoutBtn, pressed && { opacity: 0.85 }]}
          onPress={() => router.push("/checkout" as any)}
        >
          <Text style={s(colors).checkoutBtnText}>Proceed to Checkout</Text>
          <Feather name="arrow-right" size={18} color="#fff" />
        </Pressable>
      </View>
    </View>
  );
}

const s = (colors: ReturnType<typeof useColors>) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingBottom: 12,
    },
    title: { fontSize: 22, fontFamily: "Inter_700Bold", color: colors.foreground },
    empty: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
    emptyTitle: { fontSize: 18, fontFamily: "Inter_600SemiBold", color: colors.foreground },
    emptySub: { fontSize: 14, color: colors.mutedForeground, fontFamily: "Inter_400Regular" },
    browsBtn: {
      backgroundColor: colors.primary,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 12,
      marginTop: 8,
    },
    browsBtnText: { color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 15 },
    itemCard: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 12,
      flexDirection: "row",
      gap: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    itemImage: {
      width: 80,
      height: 80,
      borderRadius: 8,
      backgroundColor: colors.muted,
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
    },
    itemInfo: { flex: 1, gap: 4 },
    itemName: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: colors.foreground },
    itemVendor: { fontSize: 11, color: colors.mutedForeground, fontFamily: "Inter_400Regular" },
    itemPrice: { fontSize: 14, fontFamily: "Inter_700Bold", color: colors.primary },
    qtyRow: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 4 },
    qtyBtn: {
      width: 28,
      height: 28,
      borderRadius: 8,
      backgroundColor: colors.secondary,
      alignItems: "center",
      justifyContent: "center",
    },
    qtyText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: colors.foreground, minWidth: 20, textAlign: "center" },
    itemRight: { alignItems: "flex-end", justifyContent: "space-between" },
    removeBtn: { padding: 4 },
    itemTotal: { fontSize: 14, fontFamily: "Inter_700Bold", color: colors.foreground },
    checkoutBar: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: colors.card,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingHorizontal: 16,
      paddingTop: 16,
      gap: 12,
    },
    totalRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    totalLabel: { fontSize: 14, color: colors.mutedForeground, fontFamily: "Inter_400Regular" },
    totalAmount: { fontSize: 22, fontFamily: "Inter_700Bold", color: colors.primary },
    checkoutBtn: {
      backgroundColor: colors.primary,
      borderRadius: 14,
      paddingVertical: 16,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
    },
    checkoutBtnText: { color: "#fff", fontFamily: "Inter_700Bold", fontSize: 16 },
  });
