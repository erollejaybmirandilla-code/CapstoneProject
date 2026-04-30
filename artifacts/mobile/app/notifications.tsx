import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { useStore } from "@/context/StoreContext";

interface Notification {
  id: string;
  title: string;
  body: string;
  icon: string;
  iconColor: string;
  time: string;
  read: boolean;
  type: "order" | "stock" | "payment" | "kyc" | "promo";
}

export default function NotificationsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const { getLowStockProducts } = useStore();

  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  const lowStock = user?.role !== "customer" ? getLowStockProducts(user?.vendorId) : [];

  const notifications: Notification[] = [
    ...(user?.role === "customer" ? [
      {
        id: "n1",
        title: "Order Update",
        body: "Order #O1ABCD is now being prepared by Groyon Store.",
        icon: "package",
        iconColor: colors.primary,
        time: "2 min ago",
        read: false,
        type: "order" as const,
      },
      {
        id: "n2",
        title: "Payment Confirmed",
        body: "GCash payment of ₱765.00 was successfully processed.",
        icon: "check-circle",
        iconColor: colors.success,
        time: "1 hour ago",
        read: false,
        type: "payment" as const,
      },
      ...(user?.kycVerified ? [] : [{
        id: "n3",
        title: "Complete KYC Verification",
        body: "Verify your identity to unlock all features and start ordering.",
        icon: "user-check",
        iconColor: colors.warning,
        time: "1 day ago",
        read: true,
        type: "kyc" as const,
      }]),
      {
        id: "n4",
        title: "Ibalong Festival Special!",
        body: "Festival-themed souvenirs now available. Get yours before they sell out!",
        icon: "sun",
        iconColor: colors.gold,
        time: "2 days ago",
        read: true,
        type: "promo" as const,
      },
    ] : []),
    ...lowStock.map((p, idx) => ({
      id: `stock_${p.id}`,
      title: "Low Stock Alert",
      body: `${p.name} is running low with only ${p.stock} units remaining. Restock soon to avoid stockouts.`,
      icon: "alert-triangle",
      iconColor: colors.warning,
      time: `${idx + 1} hour${idx > 0 ? "s" : ""} ago`,
      read: false,
      type: "stock" as const,
    })),
  ];

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <View style={[s(colors).container]}>
      <View style={[s(colors).header, { paddingTop: topInset + 12 }]}>
        <Pressable onPress={() => router.back()} style={s(colors).backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={s(colors).title}>Notifications</Text>
        {unreadCount > 0 && (
          <View style={s(colors).badge}>
            <Text style={s(colors).badgeText}>{unreadCount}</Text>
          </View>
        )}
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: bottomInset + 40 }}>
        {notifications.length === 0 ? (
          <View style={s(colors).empty}>
            <Feather name="bell" size={48} color={colors.mutedForeground} />
            <Text style={s(colors).emptyTitle}>No Notifications</Text>
            <Text style={s(colors).emptySub}>You're all caught up!</Text>
          </View>
        ) : (
          notifications.map((notif) => (
            <Pressable
              key={notif.id}
              style={[s(colors).notifCard, !notif.read && s(colors).notifCardUnread]}
              onPress={() => {
                if (notif.type === "order") router.push("/(tabs)/orders" as any);
                else if (notif.type === "stock") router.push("/(tabs)/inventory" as any);
                else if (notif.type === "kyc") router.push("/kyc" as any);
              }}
            >
              <View style={[s(colors).iconWrap, { backgroundColor: notif.iconColor + "15" }]}>
                <Feather name={notif.icon as any} size={20} color={notif.iconColor} />
              </View>
              <View style={{ flex: 1, gap: 3 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <Text style={[s(colors).notifTitle, !notif.read && s(colors).notifTitleUnread]}>{notif.title}</Text>
                  <Text style={s(colors).time}>{notif.time}</Text>
                </View>
                <Text style={s(colors).notifBody} numberOfLines={3}>{notif.body}</Text>
              </View>
              {!notif.read && <View style={s(colors).unreadDot} />}
            </Pressable>
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
      paddingHorizontal: 16,
      paddingBottom: 12,
      gap: 12,
    },
    backBtn: { padding: 6 },
    title: { flex: 1, fontSize: 20, fontFamily: "Inter_700Bold", color: colors.foreground },
    badge: { backgroundColor: colors.primary, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    badgeText: { color: "#fff", fontSize: 12, fontFamily: "Inter_700Bold" },
    empty: { alignItems: "center", paddingTop: 100, gap: 10 },
    emptyTitle: { fontSize: 18, fontFamily: "Inter_600SemiBold", color: colors.mutedForeground },
    emptySub: { fontSize: 14, color: colors.mutedForeground, fontFamily: "Inter_400Regular" },
    notifCard: {
      flexDirection: "row",
      gap: 12,
      padding: 14,
      backgroundColor: colors.card,
      borderRadius: 12,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    notifCardUnread: {
      backgroundColor: colors.primary + "06",
      borderColor: colors.primary + "30",
    },
    iconWrap: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
    notifTitle: { fontSize: 13, fontFamily: "Inter_500Medium", color: colors.mutedForeground },
    notifTitleUnread: { color: colors.foreground, fontFamily: "Inter_700Bold" },
    notifBody: { fontSize: 13, color: colors.mutedForeground, fontFamily: "Inter_400Regular", lineHeight: 18 },
    time: { fontSize: 11, color: colors.mutedForeground, fontFamily: "Inter_400Regular" },
    unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary, marginTop: 4 },
  });
