import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
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
import { useAuth } from "@/context/AuthContext";
import { useStore } from "@/context/StoreContext";

type Period = "daily" | "weekly" | "monthly";

export default function AnalyticsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const { products, orders, vendors, inventoryLogs } = useStore();
  const [period, setPeriod] = useState<Period>("weekly");

  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  if (!user || user.role === "customer") {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Feather name="lock" size={40} color={colors.mutedForeground} />
        <Text style={{ color: colors.mutedForeground, marginTop: 12 }}>Access Restricted</Text>
      </View>
    );
  }

  const vendorOrders = user.vendorId ? orders.filter((o) => o.vendorId === user.vendorId) : orders;
  const paidOrders = vendorOrders.filter((o) => o.paymentStatus === "paid");
  const totalRevenue = paidOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const avgOrderValue = paidOrders.length > 0 ? totalRevenue / paidOrders.length : 0;
  const vendorProducts = user.vendorId ? products.filter((p) => p.vendorId === user.vendorId) : products;
  const lowStockCount = vendorProducts.filter((p) => p.stock <= p.minThreshold).length;
  const outOfStock = vendorProducts.filter((p) => p.stock === 0).length;

  // Revenue by payment method
  const paymentBreakdown: Record<string, number> = {};
  paidOrders.forEach((o) => {
    paymentBreakdown[o.paymentMethod] = (paymentBreakdown[o.paymentMethod] ?? 0) + o.totalAmount;
  });

  // Top products by sales volume from inventory logs
  const salesByProduct: Record<string, { name: string; qty: number; revenue: number }> = {};
  inventoryLogs
    .filter((l) => l.type === "sale")
    .forEach((log) => {
      if (!salesByProduct[log.productId]) {
        const p = products.find((pr) => pr.id === log.productId);
        salesByProduct[log.productId] = { name: p?.name ?? log.productName, qty: 0, revenue: 0 };
      }
      salesByProduct[log.productId].qty += Math.abs(log.quantityChange);
    });

  // Vendor performance
  const vendorPerf = vendors.map((v) => {
    const vOrders = orders.filter((o) => o.vendorId === v.id && o.paymentStatus === "paid");
    const revenue = vOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const vProducts = products.filter((p) => p.vendorId === v.id);
    return { ...v, revenue, orderCount: vOrders.length, productCount: vProducts.length };
  }).sort((a, b) => b.revenue - a.revenue);

  const maxRevenue = Math.max(...vendorPerf.map((v) => v.revenue), 1);

  return (
    <View style={[s(colors).container]}>
      <View style={[s(colors).header, { paddingTop: topInset + 12 }]}>
        <Pressable onPress={() => router.back()} style={s(colors).backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={s(colors).title}>Analytics</Text>
        <View style={{ width: 38 }} />
      </View>

      {/* Period tabs */}
      <View style={s(colors).periodRow}>
        {(["daily", "weekly", "monthly"] as Period[]).map((p) => (
          <Pressable
            key={p}
            style={[s(colors).periodBtn, period === p && s(colors).periodBtnActive]}
            onPress={() => setPeriod(p)}
          >
            <Text style={[s(colors).periodText, period === p && s(colors).periodTextActive]}>
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: bottomInset + 40 }}>
        {/* KPI Cards */}
        <View style={s(colors).kpiGrid}>
          <View style={[s(colors).kpiCard, { borderColor: colors.primary + "30" }]}>
            <View style={[s(colors).kpiIcon, { backgroundColor: colors.primary + "15" }]}>
              <Feather name="trending-up" size={18} color={colors.primary} />
            </View>
            <Text style={s(colors).kpiValue}>₱{totalRevenue.toLocaleString()}</Text>
            <Text style={s(colors).kpiLabel}>Total Revenue</Text>
          </View>
          <View style={[s(colors).kpiCard, { borderColor: colors.accent + "30" }]}>
            <View style={[s(colors).kpiIcon, { backgroundColor: colors.accent + "15" }]}>
              <Feather name="shopping-bag" size={18} color={colors.accent} />
            </View>
            <Text style={s(colors).kpiValue}>{paidOrders.length}</Text>
            <Text style={s(colors).kpiLabel}>Orders</Text>
          </View>
          <View style={[s(colors).kpiCard, { borderColor: colors.gold + "30" }]}>
            <View style={[s(colors).kpiIcon, { backgroundColor: colors.goldLight }]}>
              <Feather name="bar-chart" size={18} color={colors.gold} />
            </View>
            <Text style={s(colors).kpiValue}>₱{Math.round(avgOrderValue).toLocaleString()}</Text>
            <Text style={s(colors).kpiLabel}>Avg. Order</Text>
          </View>
          <View style={[s(colors).kpiCard, { borderColor: colors.warning + "30" }]}>
            <View style={[s(colors).kpiIcon, { backgroundColor: colors.warningLight }]}>
              <Feather name="alert-triangle" size={18} color={colors.warning} />
            </View>
            <Text style={[s(colors).kpiValue, { color: lowStockCount > 0 ? colors.warning : colors.foreground }]}>{lowStockCount}</Text>
            <Text style={s(colors).kpiLabel}>Low Stock</Text>
          </View>
        </View>

        {/* Vendor Performance */}
        {user.role === "admin" && (
          <View style={s(colors).section}>
            <Text style={s(colors).sectionTitle}>Vendor Performance</Text>
            {vendorPerf.map((v, idx) => (
              <View key={v.id} style={s(colors).vendorRow}>
                <View style={s(colors).vendorRank}>
                  <Text style={[s(colors).rankText, idx === 0 && { color: colors.gold }]}>#{idx + 1}</Text>
                </View>
                <View style={{ flex: 1, gap: 4 }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                    <Text style={s(colors).vendorName} numberOfLines={1}>{v.name}</Text>
                    <Text style={s(colors).vendorRevenue}>₱{v.revenue.toLocaleString()}</Text>
                  </View>
                  <View style={s(colors).progressBg}>
                    <View style={[s(colors).progressFill, { width: `${(v.revenue / maxRevenue) * 100}%`, backgroundColor: idx === 0 ? colors.primary : idx === 1 ? colors.accent : colors.mutedForeground }]} />
                  </View>
                  <View style={{ flexDirection: "row", gap: 12 }}>
                    <Text style={s(colors).metaText}>{v.orderCount} orders</Text>
                    <Text style={s(colors).metaText}>{v.productCount} products</Text>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
                      <Feather name="star" size={10} color={colors.gold} />
                      <Text style={s(colors).metaText}>{v.rating}</Text>
                    </View>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Payment Method Breakdown */}
        <View style={s(colors).section}>
          <Text style={s(colors).sectionTitle}>Payment Methods</Text>
          {Object.entries(paymentBreakdown).length === 0 ? (
            <Text style={s(colors).emptyText}>No payment data yet</Text>
          ) : (
            Object.entries(paymentBreakdown)
              .sort((a, b) => b[1] - a[1])
              .map(([method, amount]) => {
                const total = Object.values(paymentBreakdown).reduce((sum, v) => sum + v, 0);
                const pct = total > 0 ? Math.round((amount / total) * 100) : 0;
                return (
                  <View key={method} style={s(colors).paymentRow}>
                    <Text style={s(colors).paymentMethod} numberOfLines={1}>{method}</Text>
                    <View style={[s(colors).progressBg, { flex: 1, marginHorizontal: 12 }]}>
                      <View style={[s(colors).progressFill, { width: `${pct}%`, backgroundColor: colors.primary }]} />
                    </View>
                    <Text style={s(colors).paymentPct}>{pct}%</Text>
                    <Text style={s(colors).paymentAmount}>₱{amount.toLocaleString()}</Text>
                  </View>
                );
              })
          )}
        </View>

        {/* Inventory Health */}
        <View style={s(colors).section}>
          <Text style={s(colors).sectionTitle}>Inventory Health</Text>
          <View style={s(colors).inventoryGrid}>
            <View style={[s(colors).invCard, { borderColor: colors.success + "40" }]}>
              <Text style={[s(colors).invValue, { color: colors.success }]}>
                {vendorProducts.filter((p) => p.stock > p.minThreshold).length}
              </Text>
              <Text style={s(colors).invLabel}>Healthy Stock</Text>
            </View>
            <View style={[s(colors).invCard, { borderColor: colors.warning + "40" }]}>
              <Text style={[s(colors).invValue, { color: colors.warning }]}>{lowStockCount}</Text>
              <Text style={s(colors).invLabel}>Low Stock</Text>
            </View>
            <View style={[s(colors).invCard, { borderColor: colors.destructive + "40" }]}>
              <Text style={[s(colors).invValue, { color: colors.destructive }]}>{outOfStock}</Text>
              <Text style={s(colors).invLabel}>Out of Stock</Text>
            </View>
          </View>
        </View>

        {/* Export Note */}
        <View style={s(colors).exportCard}>
          <Feather name="download" size={18} color={colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={s(colors).exportTitle}>Export Reports</Text>
            <Text style={s(colors).exportSub}>PDF and Excel export available in the full admin dashboard</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const s = (colors: ReturnType<typeof useColors>) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 12 },
    backBtn: { padding: 6 },
    title: { fontSize: 20, fontFamily: "Inter_700Bold", color: colors.foreground },
    periodRow: { flexDirection: "row", marginHorizontal: 16, marginBottom: 16, backgroundColor: colors.muted, borderRadius: 10, padding: 3 },
    periodBtn: { flex: 1, paddingVertical: 8, alignItems: "center", borderRadius: 8 },
    periodBtnActive: { backgroundColor: colors.card },
    periodText: { fontSize: 13, fontFamily: "Inter_500Medium", color: colors.mutedForeground },
    periodTextActive: { color: colors.foreground, fontFamily: "Inter_600SemiBold" },
    kpiGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 20 },
    kpiCard: {
      width: "47%",
      backgroundColor: colors.card,
      borderRadius: 14,
      padding: 14,
      gap: 6,
      borderWidth: 1.5,
    },
    kpiIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
    kpiValue: { fontSize: 22, fontFamily: "Inter_700Bold", color: colors.foreground },
    kpiLabel: { fontSize: 12, color: colors.mutedForeground, fontFamily: "Inter_400Regular" },
    section: { marginBottom: 24 },
    sectionTitle: { fontSize: 16, fontFamily: "Inter_700Bold", color: colors.foreground, marginBottom: 14 },
    vendorRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 12,
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 14,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    vendorRank: { width: 28, alignItems: "center" },
    rankText: { fontSize: 15, fontFamily: "Inter_700Bold", color: colors.mutedForeground },
    vendorName: { flex: 1, fontSize: 14, fontFamily: "Inter_600SemiBold", color: colors.foreground },
    vendorRevenue: { fontSize: 14, fontFamily: "Inter_700Bold", color: colors.primary },
    progressBg: { height: 6, backgroundColor: colors.muted, borderRadius: 3, overflow: "hidden" },
    progressFill: { height: "100%", borderRadius: 3 },
    metaText: { fontSize: 11, color: colors.mutedForeground, fontFamily: "Inter_400Regular" },
    paymentRow: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
    paymentMethod: { width: 80, fontSize: 12, fontFamily: "Inter_500Medium", color: colors.foreground },
    paymentPct: { width: 36, fontSize: 12, fontFamily: "Inter_600SemiBold", color: colors.primary, textAlign: "right" },
    paymentAmount: { width: 80, fontSize: 12, fontFamily: "Inter_500Medium", color: colors.foreground, textAlign: "right" },
    emptyText: { color: colors.mutedForeground, fontFamily: "Inter_400Regular", fontSize: 13 },
    inventoryGrid: { flexDirection: "row", gap: 10 },
    invCard: { flex: 1, backgroundColor: colors.card, borderRadius: 12, padding: 12, alignItems: "center", borderWidth: 1.5 },
    invValue: { fontSize: 28, fontFamily: "Inter_700Bold" },
    invLabel: { fontSize: 11, color: colors.mutedForeground, fontFamily: "Inter_400Regular", textAlign: "center", marginTop: 2 },
    exportCard: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: colors.secondary, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: colors.border },
    exportTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: colors.foreground },
    exportSub: { fontSize: 12, color: colors.mutedForeground, fontFamily: "Inter_400Regular", marginTop: 2 },
  });
