import { Feather } from "@expo/vector-icons";
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
import { OrderCard } from "@/components/OrderCard";
import type { Order } from "@/lib/api";

type StatusFilter = Order["status"] | "all";

const ORDER_STATUSES: Array<{ key: StatusFilter; label: string }> = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "confirmed", label: "Confirmed" },
  { key: "preparing", label: "Preparing" },
  { key: "ready", label: "Ready" },
  { key: "out_for_delivery", label: "En Route" },
  { key: "delivered", label: "Delivered" },
  { key: "cancelled", label: "Cancelled" },
];

export default function OrdersScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { orders, isLoadingOrders, ordersError, retryOrders, updateOrderStatus } = useStore();

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [retrying, setRetrying] = useState(false);

  const topInset = Platform.OS === "web" ? 67 : insets.top;

  if (!user) return null;

  const filtered = statusFilter === "all"
    ? orders
    : orders.filter((o) => o.status === statusFilter);

  const isStaff = user.role === "admin" || user.role === "staff";
  const activeCount = orders.filter(o => o.status === "pending" || o.status === "preparing" || o.status === "confirmed").length;

  const handleRetry = async () => {
    setRetrying(true);
    await retryOrders();
    setRetrying(false);
  };

  return (
    <View style={[s(colors).container]}>
      <View style={[s(colors).header, { paddingTop: topInset + 12 }]}>
        <Text style={s(colors).title}>
          {isStaff ? "Order Management" : "My Orders"}
        </Text>
        {isStaff && activeCount > 0 && (
          <View style={[s(colors).badge]}>
            <Text style={s(colors).badgeText}>{activeCount} Active</Text>
          </View>
        )}
      </View>

      {/* Status filter tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s(colors).tabScroll} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
        {ORDER_STATUSES.map((status) => {
          const count = status.key === "all"
            ? orders.length
            : orders.filter((o) => o.status === status.key).length;
          if (status.key !== "all" && count === 0) return null;
          return (
            <View
              key={status.key}
              style={[s(colors).tab, statusFilter === status.key && s(colors).tabActive]}
            >
              <Text
                style={[s(colors).tabText, statusFilter === status.key && s(colors).tabTextActive]}
                onPress={() => setStatusFilter(status.key)}
              >
                {status.label}
                {count > 0 && ` (${count})`}
              </Text>
            </View>
          );
        })}
      </ScrollView>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, gap: 12, paddingBottom: 100 }}>
        {ordersError && !isLoadingOrders && !retrying ? (
          <View style={s(colors).errorState}>
            <Feather name="wifi-off" size={40} color={colors.mutedForeground} />
            <Text style={s(colors).errorStateTitle}>Connection Issue</Text>
            <Text style={s(colors).errorStateText}>{ordersError}</Text>
            <Pressable style={s(colors).retryBtn} onPress={handleRetry}>
              <Text style={s(colors).retryBtnText}>Try Again</Text>
            </Pressable>
          </View>
        ) : filtered.length === 0 ? (
          <View style={s(colors).empty}>
            <Feather name="clipboard" size={48} color={colors.mutedForeground} />
            <Text style={s(colors).emptyText}>No orders found</Text>
            <Text style={s(colors).emptySub}>Orders will appear here</Text>
          </View>
        ) : (
          filtered.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              showActions={isStaff}
              onUpdateStatus={(status) => updateOrderStatus(order.id, status)}
            />
          ))
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
      alignItems: "center",
      gap: 10,
      paddingHorizontal: 16,
      paddingBottom: 12,
    },
    title: { fontSize: 22, fontFamily: "Inter_700Bold", color: colors.foreground },
    badge: {
      backgroundColor: colors.primary,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
    },
    badgeText: { color: "#fff", fontSize: 12, fontFamily: "Inter_600SemiBold" },
    tabScroll: { marginBottom: 12 },
    tab: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
    },
    tabActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    tabText: { fontSize: 12, fontFamily: "Inter_500Medium", color: colors.mutedForeground },
    tabTextActive: { color: "#fff" },
    empty: { alignItems: "center", paddingTop: 80, gap: 10 },
    emptyText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: colors.mutedForeground },
    emptySub: { fontSize: 13, color: colors.mutedForeground, fontFamily: "Inter_400Regular" },
    errorState: { alignItems: "center", paddingTop: 80, gap: 12 },
    errorStateTitle: { fontSize: 18, fontFamily: "Inter_700Bold", color: colors.foreground },
    errorStateText: { fontSize: 14, color: colors.mutedForeground, fontFamily: "Inter_400Regular", textAlign: "center", paddingHorizontal: 32 },
    retryBtn: { backgroundColor: colors.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
    retryBtnText: { color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 14 },
  });
