import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import { useStore } from "@/context/StoreContext";
import { ProductCard } from "@/components/ProductCard";

export default function WishlistScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { wishlist, products } = useStore();

  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  const wishlistedProducts = wishlist
    .map((w) => products.find((p) => p.id === w.productId))
    .filter(Boolean) as typeof products;

  return (
    <View style={[s(colors).container]}>
      <View style={[s(colors).header, { paddingTop: topInset + 12 }]}>
        <Pressable onPress={() => router.back()} style={s(colors).backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={s(colors).title}>My Wishlist ({wishlistedProducts.length})</Text>
        <View style={{ width: 38 }} />
      </View>

      {wishlistedProducts.length === 0 ? (
        <View style={s(colors).empty}>
          <Feather name="heart" size={56} color={colors.mutedForeground} />
          <Text style={s(colors).emptyTitle}>Your wishlist is empty</Text>
          <Text style={s(colors).emptySub}>Save items you love for later</Text>
          <Pressable style={s(colors).browseBtn} onPress={() => router.push("/(tabs)/catalog" as any)}>
            <Text style={s(colors).browseBtnText}>Browse Products</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: bottomInset + 40 }}>
          <View style={s(colors).grid}>
            {wishlistedProducts.map((item) => (
              <View key={item.id} style={s(colors).gridItem}>
                <ProductCard product={item} />
              </View>
            ))}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const s = (colors: ReturnType<typeof useColors>) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 12 },
    backBtn: { padding: 6 },
    title: { fontSize: 18, fontFamily: "Inter_700Bold", color: colors.foreground },
    empty: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10 },
    emptyTitle: { fontSize: 18, fontFamily: "Inter_600SemiBold", color: colors.foreground },
    emptySub: { fontSize: 14, color: colors.mutedForeground, fontFamily: "Inter_400Regular" },
    browseBtn: { backgroundColor: colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, marginTop: 8 },
    browseBtnText: { color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 15 },
    grid: { flexDirection: "row", flexWrap: "wrap", gap: 12, paddingTop: 4 },
    gridItem: { width: "47.5%" },
  });
