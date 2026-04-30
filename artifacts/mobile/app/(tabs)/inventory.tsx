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
import { useStore, Product } from "@/context/StoreContext";
import { StockBadge } from "@/components/StockBadge";

export default function InventoryScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { products, updateStock, inventoryLogs } = useStore();

  const [search, setSearch] = useState("");
  const [showLowOnly, setShowLowOnly] = useState(false);
  const [activeTab, setActiveTab] = useState<"products" | "logs">("products");
  const [restockQty, setRestockQty] = useState<Record<string, string>>({});

  const topInset = Platform.OS === "web" ? 67 : insets.top;

  if (!user || (user.role !== "admin" && user.role !== "staff")) {
    return (
      <View style={[s(colors).container, { alignItems: "center", justifyContent: "center" }]}>
        <Feather name="lock" size={40} color={colors.mutedForeground} />
        <Text style={{ color: colors.mutedForeground, fontFamily: "Inter_500Medium", marginTop: 12 }}>Access Restricted</Text>
      </View>
    );
  }

  const vendorProducts = user.role === "staff" && user.vendorId
    ? products.filter((p) => p.vendorId === user.vendorId)
    : products;

  const filtered = vendorProducts.filter((p) => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
    const matchLow = !showLowOnly || p.stock <= p.minThreshold;
    return matchSearch && matchLow;
  });

  const lowStockCount = vendorProducts.filter((p) => p.stock <= p.minThreshold).length;
  const outOfStockCount = vendorProducts.filter((p) => p.stock === 0).length;

  const handleRestock = (product: Product) => {
    const qty = parseInt(restockQty[product.id] ?? "0", 10);
    if (isNaN(qty) || qty <= 0) {
      Alert.alert("Invalid quantity", "Enter a positive number to restock.");
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    updateStock(product.id, qty, "restock", user.id);
    setRestockQty((prev) => ({ ...prev, [product.id]: "" }));
  };

  const recentLogs = inventoryLogs.slice(0, 30);

  return (
    <View style={[s(colors).container]}>
      {/* Header */}
      <View style={[s(colors).header, { paddingTop: topInset + 12 }]}>
        <Text style={s(colors).title}>Inventory</Text>
        <Text style={s(colors).subtitle}>{vendorProducts.length} products</Text>
      </View>

      {/* Stats Row */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 10, paddingBottom: 12 }}>
        <View style={s(colors).statCard}>
          <Feather name="package" size={18} color={colors.primary} />
          <Text style={s(colors).statValue}>{vendorProducts.length}</Text>
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
        <View style={s(colors).statCard}>
          <Feather name="refresh-cw" size={18} color={colors.accent} />
          <Text style={[s(colors).statValue, { color: colors.accent }]}>{inventoryLogs.length}</Text>
          <Text style={s(colors).statLabel}>Total Logs</Text>
        </View>
      </ScrollView>

      {/* Tabs */}
      <View style={s(colors).tabRow}>
        <Pressable style={[s(colors).tabBtn, activeTab === "products" && s(colors).tabBtnActive]} onPress={() => setActiveTab("products")}>
          <Text style={[s(colors).tabBtnText, activeTab === "products" && s(colors).tabBtnTextActive]}>Products</Text>
        </Pressable>
        <Pressable style={[s(colors).tabBtn, activeTab === "logs" && s(colors).tabBtnActive]} onPress={() => setActiveTab("logs")}>
          <Text style={[s(colors).tabBtnText, activeTab === "logs" && s(colors).tabBtnTextActive]}>Activity Log</Text>
        </Pressable>
      </View>

      {activeTab === "products" ? (
        <>
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
              onPress={() => setShowLowOnly((v) => !v)}
            >
              <Feather name="alert-triangle" size={14} color={showLowOnly ? "#fff" : colors.warning} />
              <Text style={[s(colors).filterToggleText, showLowOnly && { color: "#fff" }]}>Low</Text>
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}>
            {filtered.map((product) => (
              <View key={product.id} style={s(colors).productRow}>
                <View style={s(colors).productInfo}>
                  <Text style={s(colors).productName} numberOfLines={1}>{product.name}</Text>
                  <Text style={s(colors).productVendor}>{product.vendorName}</Text>
                  <StockBadge stock={product.stock} minThreshold={product.minThreshold} />
                </View>
                <View style={s(colors).restockSection}>
                  <Text style={s(colors).restockLabel}>Add Stock</Text>
                  <View style={s(colors).restockRow}>
                    <TextInput
                      style={s(colors).restockInput}
                      placeholder="Qty"
                      placeholderTextColor={colors.mutedForeground}
                      keyboardType="numeric"
                      value={restockQty[product.id] ?? ""}
                      onChangeText={(val) => setRestockQty((prev) => ({ ...prev, [product.id]: val }))}
                    />
                    <Pressable
                      style={s(colors).restockBtn}
                      onPress={() => handleRestock(product)}
                    >
                      <Feather name="plus" size={14} color="#fff" />
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
        </>
      ) : (
        <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}>
          {recentLogs.length === 0 ? (
            <View style={{ alignItems: "center", paddingVertical: 60, gap: 8 }}>
              <Feather name="activity" size={40} color={colors.mutedForeground} />
              <Text style={{ color: colors.mutedForeground, fontFamily: "Inter_500Medium" }}>No inventory logs yet</Text>
            </View>
          ) : (
            recentLogs.map((log) => {
              const isPositive = log.quantityChange > 0;
              const typeColors: Record<string, string> = { sale: colors.primary, restock: colors.success, adjustment: colors.warning };
              const typeColor = typeColors[log.type] ?? colors.mutedForeground;
              return (
                <View key={log.id} style={s(colors).logRow}>
                  <View style={[s(colors).logIcon, { backgroundColor: typeColor + "15" }]}>
                    <Feather name={log.type === "sale" ? "shopping-bag" : log.type === "restock" ? "refresh-cw" : "edit-2"} size={14} color={typeColor} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s(colors).logProduct} numberOfLines={1}>{log.productName}</Text>
                    <Text style={s(colors).logType}>{log.type.charAt(0).toUpperCase() + log.type.slice(1)}</Text>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={[s(colors).logQty, { color: isPositive ? colors.success : colors.destructive }]}>
                      {isPositive ? "+" : ""}{log.quantityChange}
                    </Text>
                    <Text style={s(colors).logDate}>
                      {new Date(log.timestamp).toLocaleString("en-PH", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </Text>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      )}
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
    tabRow: {
      flexDirection: "row",
      marginHorizontal: 16,
      marginBottom: 12,
      backgroundColor: colors.muted,
      borderRadius: 10,
      padding: 3,
    },
    tabBtn: { flex: 1, paddingVertical: 8, alignItems: "center", borderRadius: 8 },
    tabBtnActive: { backgroundColor: colors.card, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 2, elevation: 2 },
    tabBtnText: { fontFamily: "Inter_500Medium", fontSize: 13, color: colors.mutedForeground },
    tabBtnTextActive: { color: colors.foreground, fontFamily: "Inter_600SemiBold" },
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
    logRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    logIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
    logProduct: { fontSize: 13, fontFamily: "Inter_500Medium", color: colors.foreground },
    logType: { fontSize: 11, color: colors.mutedForeground, fontFamily: "Inter_400Regular", marginTop: 2 },
    logQty: { fontSize: 16, fontFamily: "Inter_700Bold" },
    logDate: { fontSize: 10, color: colors.mutedForeground, fontFamily: "Inter_400Regular", marginTop: 2 },
  });
