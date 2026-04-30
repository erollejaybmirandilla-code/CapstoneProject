import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { useStore } from "@/context/StoreContext";
import { StockBadge } from "@/components/StockBadge";
import type { InventoryItem } from "@/lib/api";

const MIN_THRESHOLD = 10;

export default function InventoryScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { inventory, restockProduct, fetchInventory } = useStore();

  const [search, setSearch] = useState("");
  const [showLowOnly, setShowLowOnly] = useState(false);
  const [restockQty, setRestockQty] = useState<Record<string, string>>({});
  const [restocking, setRestocking] = useState<string | null>(null);

  const topInset = Platform.OS === "web" ? 67 : insets.top;

  if (!user || (user.role !== "admin" && user.role !== "staff")) {
    return (
      <View style={[s(colors).container, { alignItems: "center", justifyContent: "center" }]}>
        <Feather name="lock" size={40} color={colors.mutedForeground} />
        <Text style={{ color: colors.mutedForeground, fontFamily: "Inter_500Medium", marginTop: 12 }}>Access Restricted</Text>
      </View>
    );
  }

  const vendorInventory = user.role === "staff" && user.vendorId
    ? inventory.filter((i) => i.vendorId === user.vendorId)
    : inventory;

  const filtered = vendorInventory.filter((i) => {
    const matchSearch = !search || i.productName.toLowerCase().includes(search.toLowerCase());
    const matchLow = !showLowOnly || i.stock <= MIN_THRESHOLD;
    return matchSearch && matchLow;
  });

  const lowStockCount = vendorInventory.filter(i => i.stock <= MIN_THRESHOLD).length;
  const outOfStockCount = vendorInventory.filter(i => i.stock === 0).length;

  const handleRestock = async (item: InventoryItem) => {
    const qty = parseInt(restockQty[item.productId] ?? "0", 10);
    if (isNaN(qty) || qty <= 0) {
      Alert.alert("Invalid quantity", "Enter a positive number to restock.");
      return;
    }
    setRestocking(item.productId);
    try {
      await restockProduct(item.productId, qty, `Manual restock by ${user.name}`);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setRestockQty(prev => ({ ...prev, [item.productId]: "" }));
      await fetchInventory();
    } catch (e: any) {
      Alert.alert("Error", e.message || "Restock failed");
    } finally {
      setRestocking(null);
    }
  };

  return (
    <View style={[s(colors).container]}>
      {/* Header */}
      <View style={[s(colors).header, { paddingTop: topInset + 12 }]}>
        <Text style={s(colors).title}>Inventory</Text>
        <Text style={s(colors).subtitle}>{vendorInventory.length} products</Text>
      </View>

      {/* Stats Row */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 10, paddingBottom: 12 }}>
        <View style={s(colors).statCard}>
          <Feather name="package" size={18} color={colors.primary} />
          <Text style={s(colors).statValue}>{vendorInventory.length}</Text>
          <Text style={s(colors).statLabel}>Total Products</Text>
        </View>
        <View style={[s(colors).statCard, { borderColor: lowStockCount > 0 ? colors.warning : colors.border }]}>
          <Feather name="alert-triangle" size={18} color={colors.warning} />
          <Text style={[s(colors).statValue, { color: colors.warning }]}>{lowStockCount}</Text>
          <Text style={s(colors).statLabel}>Low Stock</Text>
        </View>
        <View style={[s(colors).statCard, { borderColor: outOfStockCount > 0 ? colors.destructive : colors.border }]}>
          <Feather name="x-circle" size={18} color={colors.destructive} />
          <Text style={[s(colors).statValue, { color: colors.destructive }]}>{outOfStockCount}</Text>
          <Text style={s(colors).statLabel}>Out of Stock</Text>
        </View>
      </ScrollView>

      {/* Search & Filter */}
      <View style={s(colors).searchRow}>
        <View style={s(colors).searchWrap}>
          <Feather name="search" size={14} color={colors.mutedForeground} />
          <TextInput
            style={s(colors).searchInput}
            placeholder="Search products..."
            placeholderTextColor={colors.mutedForeground}
            value={search}
            onChangeText={setSearch}
          />
        </View>
        <Pressable
          style={[s(colors).filterToggle, showLowOnly && { backgroundColor: colors.warning }]}
          onPress={() => setShowLowOnly(v => !v)}
        >
          <Feather name="alert-triangle" size={14} color={showLowOnly ? "#fff" : colors.warning} />
          <Text style={[s(colors).filterToggleText, showLowOnly && { color: "#fff" }]}>Low</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}>
        {filtered.map((item) => (
          <View key={item.productId} style={s(colors).productRow}>
            <View style={s(colors).productInfo}>
              <Text style={s(colors).productName} numberOfLines={1}>{item.productName}</Text>
              <Text style={s(colors).productVendor}>{item.vendorName}</Text>
              <StockBadge stock={item.stock} />
              <Text style={s(colors).priceText}>₱{item.price.toLocaleString()}</Text>
            </View>
            <View style={s(colors).restockSection}>
              <Text style={s(colors).restockLabel}>Add Stock</Text>
              <View style={s(colors).restockRow}>
                <TextInput
                  style={s(colors).restockInput}
                  placeholder="Qty"
                  placeholderTextColor={colors.mutedForeground}
                  keyboardType="numeric"
                  value={restockQty[item.productId] ?? ""}
                  onChangeText={(val) => setRestockQty(prev => ({ ...prev, [item.productId]: val }))}
                />
                <Pressable
                  style={[s(colors).restockBtn, restocking === item.productId && { opacity: 0.6 }]}
                  onPress={() => handleRestock(item)}
                  disabled={restocking === item.productId}
                >
                  <Feather name={restocking === item.productId ? "loader" : "plus"} size={14} color="#fff" />
                </Pressable>
              </View>
            </View>
          </View>
        ))}
        {filtered.length === 0 && (
          <View style={{ alignItems: "center", paddingVertical: 60, gap: 8 }}>
            <Feather name="package" size={40} color={colors.mutedForeground} />
            <Text style={{ color: colors.mutedForeground, fontFamily: "Inter_500Medium" }}>No products found</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const s = (colors: ReturnType<typeof useColors>) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      flexDirection: "row",
      alignItems: "baseline",
      gap: 10,
      paddingHorizontal: 16,
      paddingBottom: 12,
    },
    title: { fontSize: 22, fontFamily: "Inter_700Bold", color: colors.foreground },
    subtitle: { fontSize: 13, color: colors.mutedForeground, fontFamily: "Inter_400Regular" },
    statCard: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 14,
      alignItems: "center",
      gap: 4,
      minWidth: 90,
      borderWidth: 1,
      borderColor: colors.border,
    },
    statValue: { fontSize: 22, fontFamily: "Inter_700Bold", color: colors.foreground },
    statLabel: { fontSize: 11, color: colors.mutedForeground, fontFamily: "Inter_400Regular", textAlign: "center" },
    searchRow: { flexDirection: "row", gap: 8, paddingHorizontal: 16, marginBottom: 10 },
    searchWrap: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      backgroundColor: colors.card,
      borderRadius: 10,
      paddingHorizontal: 12,
      height: 40,
      borderWidth: 1,
      borderColor: colors.border,
    },
    searchInput: { flex: 1, color: colors.foreground, fontSize: 13, fontFamily: "Inter_400Regular" },
    filterToggle: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: 12,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.warning,
      height: 40,
    },
    filterToggleText: { color: colors.warning, fontFamily: "Inter_500Medium", fontSize: 12 },
    productRow: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 14,
      marginBottom: 8,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    productInfo: { flex: 1, gap: 4 },
    productName: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: colors.foreground },
    productVendor: { fontSize: 11, color: colors.mutedForeground, fontFamily: "Inter_400Regular" },
    priceText: { fontSize: 12, color: colors.primary, fontFamily: "Inter_500Medium" },
    restockSection: { alignItems: "flex-end", gap: 4 },
    restockLabel: { fontSize: 10, color: colors.mutedForeground, fontFamily: "Inter_400Regular" },
    restockRow: { flexDirection: "row", gap: 6 },
    restockInput: {
      width: 56,
      height: 36,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 8,
      color: colors.foreground,
      fontFamily: "Inter_400Regular",
      fontSize: 14,
      textAlign: "center",
      backgroundColor: colors.background,
    },
    restockBtn: {
      width: 36,
      height: 36,
      borderRadius: 8,
      backgroundColor: colors.success,
      alignItems: "center",
      justifyContent: "center",
    },
  });
