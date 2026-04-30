import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import { useStore } from "@/context/StoreContext";
import { ProductCard } from "@/components/ProductCard";

export default function VendorScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { vendors, products } = useStore();

  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  const vendor = vendors.find((v) => v.id === id);
  const vendorProducts = products.filter((p) => p.vendorId === id);

  if (!vendor) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ color: colors.mutedForeground }}>Vendor not found</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[s(colors).container]}
      contentContainerStyle={{ paddingBottom: bottomInset + 40 }}
    >
      {/* Header */}
      <View style={[s(colors).header, { paddingTop: topInset + 12 }]}>
        <Pressable onPress={() => router.back()} style={s(colors).backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </Pressable>
      </View>

      {/* Vendor Info */}
      <View style={s(colors).vendorBanner}>
        <View style={s(colors).vendorAvatar}>
          <Feather name="shopping-bag" size={40} color={colors.primary} />
        </View>
        <Text style={s(colors).vendorName}>{vendor.name}</Text>
        <Text style={s(colors).vendorDesc}>{vendor.description}</Text>
        <View style={s(colors).ratingRow}>
          {[1, 2, 3, 4, 5].map((star) => (
            <Feather
              key={star}
              name="star"
              size={16}
              color={star <= Math.round(vendor.rating) ? colors.gold : colors.border}
            />
          ))}
          <Text style={s(colors).ratingText}>{vendor.rating.toFixed(1)}</Text>
          <Text style={s(colors).productCount}>{vendor.totalProducts} products</Text>
        </View>
      </View>

      {/* Details */}
      <View style={s(colors).detailsCard}>
        {[
          { icon: "map-pin", label: "Location", value: vendor.location },
          { icon: "clock", label: "Hours", value: vendor.operatingHours },
          { icon: "file-text", label: "DTI Registration", value: vendor.dtiRegistration },
        ].map((detail) => (
          <View key={detail.label} style={s(colors).detailRow}>
            <View style={s(colors).detailIcon}>
              <Feather name={detail.icon as any} size={14} color={colors.primary} />
            </View>
            <View>
              <Text style={s(colors).detailLabel}>{detail.label}</Text>
              <Text style={s(colors).detailValue}>{detail.value}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Products */}
      <View style={s(colors).productsSection}>
        <Text style={s(colors).sectionTitle}>Products ({vendorProducts.length})</Text>
        <View style={s(colors).productsGrid}>
          {vendorProducts.map((item) => (
            <View key={item.id} style={s(colors).gridItem}>
              <ProductCard product={item} />
            </View>
          ))}
        </View>
        {vendorProducts.length === 0 && (
          <View style={{ alignItems: "center", padding: 32, gap: 8 }}>
            <Feather name="package" size={32} color={colors.mutedForeground} />
            <Text style={{ color: colors.mutedForeground, fontFamily: "Inter_400Regular" }}>No products listed</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const s = (colors: ReturnType<typeof useColors>) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { paddingHorizontal: 16, paddingBottom: 8 },
    backBtn: { padding: 6, alignSelf: "flex-start" },
    vendorBanner: { alignItems: "center", paddingHorizontal: 24, paddingBottom: 24, gap: 8 },
    vendorAvatar: { width: 80, height: 80, borderRadius: 24, backgroundColor: colors.secondary, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: colors.border },
    vendorName: { fontSize: 24, fontFamily: "Inter_700Bold", color: colors.foreground, textAlign: "center" },
    vendorDesc: { fontSize: 14, color: colors.mutedForeground, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20 },
    ratingRow: { flexDirection: "row", alignItems: "center", gap: 4 },
    ratingText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: colors.foreground, marginLeft: 4 },
    productCount: { fontSize: 13, color: colors.mutedForeground, fontFamily: "Inter_400Regular", marginLeft: 8 },
    detailsCard: { marginHorizontal: 16, backgroundColor: colors.card, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: colors.border, gap: 12, marginBottom: 20 },
    detailRow: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
    detailIcon: { width: 32, height: 32, borderRadius: 8, backgroundColor: colors.secondary, alignItems: "center", justifyContent: "center", marginTop: 2 },
    detailLabel: { fontSize: 11, color: colors.mutedForeground, fontFamily: "Inter_400Regular", marginBottom: 2 },
    detailValue: { fontSize: 14, fontFamily: "Inter_500Medium", color: colors.foreground },
    productsSection: { paddingHorizontal: 16 },
    sectionTitle: { fontSize: 18, fontFamily: "Inter_700Bold", color: colors.foreground, marginBottom: 14 },
    productsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
    gridItem: { width: "47.5%" },
  });
