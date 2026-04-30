import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
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

type Period = "day" | "week" | "month" | "year";

const PERIODS: { id: Period; label: string }[] = [
  { id: "day", label: "Today" },
  { id: "week", label: "Weekly" },
  { id: "month", label: "Monthly" },
  { id: "year", label: "Yearly" },
];

export default function AnalyticsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const { analytics, vendors, products, orders, fetchAnalytics } = useStore();
  const [period, setPeriod] = useState<Period>("month");

  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  useEffect(() => {
    fetchAnalytics(period);
  }, [period]);

  if (!user || user.role === "customer") {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Feather name="lock" size={40} color={colors.mutedForeground} />
        <Text style={{ color: colors.mutedForeground, marginTop: 12, fontFamily: "Inter_500Medium" }}>Access Restricted</Text>
      </View>
    );
  }

  // Vendor performance from available data
  const vendorPerf = vendors.map(v => {
    const vOrders = orders.filter(o => o.paymentStatus === "paid");
    const revenue = vOrders.reduce((sum, o) => sum + o.total, 0) / Math.max(vendors.length, 1);
    const vProducts = products.filter(p => p.vendorId === v.id);
    return { ...v, revenue, orderCount: vOrders.length, productCount: vProducts.length };
  }).sort((a, b) => b.revenue - a.revenue);

  const maxRevenue = Math.max(...vendorPerf.map(v => v.revenue), 1);

  const totalRevenue = analytics?.totalRevenue ?? orders.filter(o => o.paymentStatus === "paid").reduce((s, o) => s + o.total, 0);
  const totalOrders = analytics?.totalOrders ?? orders.length;
  const avgOrderValue = analytics?.avgOrderValue ?? (totalOrders > 0 ? totalRevenue / totalOrders : 0);
  const topProducts = analytics?.topProducts ?? [];
  const paymentBreakdown = analytics?.paymentBreakdown ?? {};

  const lowStockCount = products.filter(p => p.stock <= 10).length;

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
        {PERIODS.map((p) => (
          <Pressable
            key={p.id}
            style={[s(colors).periodBtn, period === p.id && s(colors).periodBtnActive]}
            onPress={() => setPeriod(p.id)}
          >
            <Text style={[s(colors).periodText, period === p.id && s(colors).periodTextActive]}>
              {p.label}
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
            <Text style={s(colors).kpiValue}>{totalOrders}</Text>
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

        {/* Top Products */}
        {topProducts.length > 0 && (
          <View style={s(colors).section}>
            <Text style={s(colors).sectionTitle}>Top Products</Text>
            {topProducts.map((p: any, idx: number) => (
              <View key={p.productId ?? idx} style={s(colors).productRow}>
                <View style={[s(colors).rankCircle, idx === 0 && { backgroundColor: colors.gold + "20" }]}>
                  <Text style={[s(colors).rankText, idx === 0 && { color: colors.gold }]}>#{idx + 1}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s(colors).productName} numberOfLines={1}>{p.productName}</Text>
                  <Text style={s(colors).productMeta}>{p.totalQuantity} sold</Text>
                </View>
                <Text style={s(colors).productRevenue}>₱{p.totalRevenue?.toLocaleString() ?? "—"}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Vendor Performance (admin only) */}
        {user.role === "admin" && vendorPerf.length > 0 && (
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
                    <View style={[s(colors).progressFill, {
                      width: `${(v.revenue / maxRevenue) * 100}%` as any,
                      backgroundColor: idx === 0 ? colors.primary : idx === 1 ? colors.accent : colors.mutedForeground
                    }]} />
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
        {Object.keys(paymentBreakdown).length > 0 && (
          <View style={s(colors).section}>
            <Text style={s(colors).sectionTitle}>Payment Methods</Text>
            {Object.entries(paymentBreakdown)
              .sort((a: any, b: any) => b[1] - a[1])
              .map(([method, amount]: any) => {
                const total = Object.values(paymentBreakdown).reduce((s: any, v: any) => s + v, 0) as number;
                const pct = total > 0 ? Math.round((amount / total) * 100) : 0;
                const labels: Record<string, string> = {
                  gcash: "GCash", maya: "Maya", cod: "Cash on Delivery",
                  bank_transfer: "Bank Transfer", seven_eleven: "7-Eleven OTC"
                };
                return (
                  <View key={method} style={s(colors).paymentRow}>
                    <Text style={s(colors).paymentMethod} numberOfLines={1}>{labels[method] ?? method}</Text>
                    <View style={[s(colors).progressBg, { flex: 1, marginHorizontal: 12 }]}>
                      <View style={[s(colors).progressFill, { width: `${pct}%` as any, backgroundColor: colors.primary }]} />
                    </View>
                    <Text style={s(colors).paymentPct}>{pct}%</Text>
                    <Text style={s(colors).paymentAmount}>₱{amount.toLocaleString()}</Text>
                  </View>
                );
              })}
          </View>
        )}

        {/* Inventory Health */}
        <View style={s(colors).section}>
          <Text style={s(colors).sectionTitle}>Inventory Health</Text>
          <View style={s(colors).inventoryGrid}>
            <View style={[s(colors).invCard, { borderColor: colors.success + "40" }]}>
              <Text style={[s(colors).invValue, { color: colors.success }]}>
                {products.filter(p => p.stock > 10).length}
              </Text>
              <Text style={s(colors).invLabel}>In Stock</Text>
            </View>
            <View style={[s(colors).invCard, { borderColor: colors.warning + "40" }]}>
              <Text style={[s(colors).invValue, { color: colors.warning }]}>
                {lowStockCount}
              </Text>
              <Text style={s(colors).invLabel}>Low Stock</Text>
            </View>
            <View style={[s(colors).invCard, { borderColor: colors.destructive + "40" }]}>
              <Text style={[s(colors).invValue, { color: colors.destructive }]}>
                {products.filter(p => p.stock === 0).length}
              </Text>
              <Text style={s(colors).invLabel}>Out of Stock</Text>
            </View>
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
    periodRow: {
      flexDirection: "row",
      marginHorizontal: 16,
      marginBottom: 16,
      backgroundColor: colors.muted,
      borderRadius: 10,
      padding: 3,
    },
    periodBtn: { flex: 1, paddingVertical: 8, alignItems: "center", borderRadius: 8 },
    periodBtnActive: { backgroundColor: colors.card, elevation: 2 },
    periodText: { fontFamily: "Inter_500Medium", fontSize: 12, color: colors.mutedForeground },
    periodTextActive: { color: colors.foreground, fontFamily: "Inter_600SemiBold" },
    kpiGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 20 },
    kpiCard: {
      width: "47%",
      backgroundColor: colors.card,
      borderRadius: 14,
      padding: 16,
      gap: 8,
      borderWidth: 1.5,
      borderColor: colors.border,
    },
    kpiIcon: { width: 40, height: 40, borderRadius: 10, alignItems: "center", justifyContent: "center" },
    kpiValue: { fontSize: 22, fontFamily: "Inter_700Bold", color: colors.foreground },
    kpiLabel: { fontSize: 12, color: colors.mutedForeground, fontFamily: "Inter_400Regular" },
    section: { marginBottom: 24 },
    sectionTitle: { fontSize: 16, fontFamily: "Inter_700Bold", color: colors.foreground, marginBottom: 12 },
    productRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
    rankCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.muted, alignItems: "center", justifyContent: "center" },
    rankText: { fontSize: 12, fontFamily: "Inter_700Bold", color: colors.mutedForeground },
    productName: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: colors.foreground },
    productMeta: { fontSize: 12, color: colors.mutedForeground, fontFamily: "Inter_400Regular" },
    productRevenue: { fontSize: 14, fontFamily: "Inter_700Bold", color: colors.primary },
    vendorRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      padding: 14,
      backgroundColor: colors.card,
      borderRadius: 12,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    vendorRank: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.muted, alignItems: "center", justifyContent: "center" },
    vendorName: { flex: 1, fontSize: 14, fontFamily: "Inter_600SemiBold", color: colors.foreground },
    vendorRevenue: { fontSize: 14, fontFamily: "Inter_700Bold", color: colors.primary },
    progressBg: { height: 6, backgroundColor: colors.muted, borderRadius: 3, overflow: "hidden" },
    progressFill: { height: 6, borderRadius: 3 },
    metaText: { fontSize: 11, color: colors.mutedForeground, fontFamily: "Inter_400Regular" },
    paymentRow: { flexDirection: "row", alignItems: "center", paddingVertical: 8, gap: 4 },
    paymentMethod: { fontSize: 13, fontFamily: "Inter_500Medium", color: colors.foreground, width: 90 },
    paymentPct: { fontSize: 13, fontFamily: "Inter_700Bold", color: colors.foreground, width: 36, textAlign: "right" },
    paymentAmount: { fontSize: 12, color: colors.mutedForeground, fontFamily: "Inter_400Regular", width: 80, textAlign: "right" },
    inventoryGrid: { flexDirection: "row", gap: 10 },
    invCard: {
      flex: 1,
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 14,
      alignItems: "center",
      gap: 4,
      borderWidth: 1,
    },
    invValue: { fontSize: 24, fontFamily: "Inter_700Bold" },
    invLabel: { fontSize: 11, color: colors.mutedForeground, fontFamily: "Inter_400Regular", textAlign: "center" },
    emptyText: { color: colors.mutedForeground, fontFamily: "Inter_400Regular", fontSize: 14 },
  });
