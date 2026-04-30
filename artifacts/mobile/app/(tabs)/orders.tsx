import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { useStore, Order } from "@/context/StoreContext";
import { OrderCard } from "@/components/OrderCard";

const ORDER_STATUSES: Array<{ key: Order["orderStatus"] | "all"; label: string }> = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "preparing", label: "Preparing" },
  { key: "ready", label: "Ready" },
  { key: "delivered", label: "Delivered" },
  { key: "cancelled", label: "Cancelled" },
];

export default function OrdersScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { getVendorOrders, getCustomerOrders, updateOrderStatus } = useStore();

  const [statusFilter, setStatusFilter] = useState<Order["orderStatus"] | "all">("all");

  const topInset = Platform.OS === "web" ? 67 : insets.top;

  if (!user) return null;

  const orders = user.role === "customer"
    ? getCustomerOrders(user.id)
    : getVendorOrders(user.vendorId ?? "v1");

  const filtered = statusFilter === "all"
    ? orders
    : orders.filter((o) => o.orderStatus === statusFilter);

  const isStaff = user.role === "admin" || user.role === "staff";

  return (
    <View style={[s(colors).container]}>
      <View style={[s(colors).header, { paddingTop: topInset + 12 }]}>
        <Text style={s(colors).title}>
          {isStaff ? "Order Management" : "My Orders"}
        </Text>
        {isStaff && (
          <View style={[s(colors).badge]}>
            <Text style={s(colors).badgeText}>{orders.filter(o => o.orderStatus === "pending" || o.orderStatus === "preparing").length} Active</Text>
          </View>
        )}
      </View>

      {/* Status filter tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s(colors).tabScroll} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
        {ORDER_STATUSES.map((status) => {
          const count = status.key === "all"
            ? orders.length
            : orders.filter((o) => o.orderStatus === status.key).length;
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
        {filtered.length === 0 ? (
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
  });
