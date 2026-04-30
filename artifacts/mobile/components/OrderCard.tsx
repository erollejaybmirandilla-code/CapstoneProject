import { Feather } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useColors } from "@/hooks/useColors";
import { Order } from "@/context/StoreContext";
import { useRouter } from "expo-router";

const STATUS_CONFIG = {
  pending: { label: "Pending", color: "#D97706", icon: "clock" as const },
  preparing: { label: "Preparing", color: "#2563EB", icon: "package" as const },
  ready: { label: "Ready for Pickup", color: "#059669", icon: "check-circle" as const },
  delivered: { label: "Delivered", color: "#6B7280", icon: "check-square" as const },
  cancelled: { label: "Cancelled", color: "#DC2626", icon: "x-circle" as const },
};

const PAYMENT_STATUS_CONFIG = {
  pending: { label: "Pending Payment", color: "#D97706" },
  paid: { label: "Paid", color: "#059669" },
  failed: { label: "Payment Failed", color: "#DC2626" },
  refunded: { label: "Refunded", color: "#6B7280" },
};

interface Props {
  order: Order;
  showActions?: boolean;
  onUpdateStatus?: (status: Order["orderStatus"]) => void;
}

export function OrderCard({ order, showActions, onUpdateStatus }: Props) {
  const colors = useColors();
  const router = useRouter();
  const statusConfig = STATUS_CONFIG[order.orderStatus];
  const payConfig = PAYMENT_STATUS_CONFIG[order.paymentStatus];

  const nextStatus: Record<string, Order["orderStatus"]> = {
    pending: "preparing",
    preparing: "ready",
    ready: "delivered",
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("en-PH", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  return (
    <View style={styles(colors).card}>
      <View style={styles(colors).header}>
        <View style={styles(colors).orderMeta}>
          <Text style={styles(colors).orderId}>#{order.id.slice(-6).toUpperCase()}</Text>
          <Text style={styles(colors).date}>{formatDate(order.createdAt)}</Text>
        </View>
        <View style={[styles(colors).statusBadge, { backgroundColor: statusConfig.color + "20" }]}>
          <Feather name={statusConfig.icon} size={12} color={statusConfig.color} />
          <Text style={[styles(colors).statusText, { color: statusConfig.color }]}>
            {statusConfig.label}
          </Text>
        </View>
      </View>

      <View style={styles(colors).divider} />

      <View style={styles(colors).itemsSection}>
        {order.items.slice(0, 2).map((item) => (
          <View key={item.productId} style={styles(colors).itemRow}>
            <Text style={styles(colors).itemName} numberOfLines={1}>{item.name}</Text>
            <Text style={styles(colors).itemQty}>x{item.quantity}</Text>
            <Text style={styles(colors).itemPrice}>₱{(item.price * item.quantity).toLocaleString()}</Text>
          </View>
        ))}
        {order.items.length > 2 && (
          <Text style={styles(colors).moreItems}>+{order.items.length - 2} more items</Text>
        )}
      </View>

      <View style={styles(colors).divider} />

      <View style={styles(colors).footer}>
        <View>
          <Text style={styles(colors).vendorName}>{order.vendorName}</Text>
          <View style={[styles(colors).payBadge, { backgroundColor: payConfig.color + "15" }]}>
            <Text style={[styles(colors).payText, { color: payConfig.color }]}>{payConfig.label}</Text>
          </View>
        </View>
        <View style={styles(colors).totalWrap}>
          <Text style={styles(colors).totalLabel}>Total</Text>
          <Text style={styles(colors).totalAmount}>₱{order.totalAmount.toLocaleString()}</Text>
        </View>
      </View>

      {showActions && onUpdateStatus && nextStatus[order.orderStatus] && (
        <Pressable
          style={({ pressed }) => [styles(colors).actionBtn, pressed && { opacity: 0.8 }]}
          onPress={() => onUpdateStatus(nextStatus[order.orderStatus]!)}
        >
          <Text style={styles(colors).actionText}>
            Mark as {STATUS_CONFIG[nextStatus[order.orderStatus]!]?.label}
          </Text>
          <Feather name="arrow-right" size={16} color="#fff" />
        </Pressable>
      )}
    </View>
  );
}

const styles = (colors: ReturnType<typeof useColors>) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.card,
      borderRadius: colors.radius,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: "hidden",
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      padding: 12,
    },
    orderMeta: {},
    orderId: { fontSize: 14, fontFamily: "Inter_700Bold", color: colors.foreground },
    date: { fontSize: 11, color: colors.mutedForeground, fontFamily: "Inter_400Regular", marginTop: 2 },
    statusBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 20,
    },
    statusText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
    divider: { height: 1, backgroundColor: colors.border },
    itemsSection: { padding: 12, gap: 6 },
    itemRow: { flexDirection: "row", alignItems: "center", gap: 8 },
    itemName: { flex: 1, fontSize: 13, color: colors.foreground, fontFamily: "Inter_400Regular" },
    itemQty: { fontSize: 12, color: colors.mutedForeground, fontFamily: "Inter_500Medium", width: 28, textAlign: "center" },
    itemPrice: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: colors.foreground, width: 70, textAlign: "right" },
    moreItems: { fontSize: 12, color: colors.mutedForeground, fontFamily: "Inter_400Regular", marginTop: 2 },
    footer: {
      flexDirection: "row",
      alignItems: "flex-end",
      justifyContent: "space-between",
      padding: 12,
    },
    vendorName: { fontSize: 12, fontFamily: "Inter_500Medium", color: colors.foreground, marginBottom: 4 },
    payBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
    payText: { fontSize: 11, fontFamily: "Inter_500Medium" },
    totalWrap: { alignItems: "flex-end" },
    totalLabel: { fontSize: 11, color: colors.mutedForeground, fontFamily: "Inter_400Regular" },
    totalAmount: { fontSize: 18, fontFamily: "Inter_700Bold", color: colors.primary },
    actionBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      backgroundColor: colors.primary,
      paddingVertical: 12,
    },
    actionText: { color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 14 },
  });
