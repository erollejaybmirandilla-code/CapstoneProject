import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { useStore } from "@/context/StoreContext";

const iconMap: Record<string, { icon: string; color: string }> = {
  order: { icon: "shopping-bag", color: "#3B82F6" },
  stock: { icon: "alert-triangle", color: "#F59E0B" },
  payment: { icon: "check-circle", color: "#10B981" },
  kyc: { icon: "user-check", color: "#F59E0B" },
  promo: { icon: "sun", color: "#F59E0B" },
  system: { icon: "bell", color: "#6B7280" },
};

export default function NotificationsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const { notifications, markNotificationRead, markAllNotificationsRead } = useStore();

  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handlePress = async (id: string, type: string) => {
    await markNotificationRead(id);
    if (type === "order") router.push("/(tabs)/orders" as any);
    else if (type === "stock") router.push("/(tabs)/inventory" as any);
    else if (type === "kyc") router.push("/kyc" as any);
  };

  const formatTime = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins || 1} min ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} hr ago`;
    return `${Math.floor(hours / 24)} day${Math.floor(hours / 24) > 1 ? "s" : ""} ago`;
  };

  return (
    <View style={[s(colors).container]}>
      <View style={[s(colors).header, { paddingTop: topInset + 12 }]}>
        <Pressable onPress={() => router.back()} style={s(colors).backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={s(colors).title}>Notifications</Text>
        {unreadCount > 0 && (
          <Pressable style={s(colors).badge} onPress={() => markAllNotificationsRead()}>
            <Text style={s(colors).badgeText}>Mark all read</Text>
          </Pressable>
        )}
      </View>

      {unreadCount > 0 && (
        <View style={s(colors).unreadBanner}>
          <Text style={s(colors).unreadText}>{unreadCount} unread notification{unreadCount > 1 ? "s" : ""}</Text>
        </View>
      )}

      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: bottomInset + 40 }}>
        {notifications.length === 0 ? (
          <View style={s(colors).empty}>
            <Feather name="bell" size={48} color={colors.mutedForeground} />
            <Text style={s(colors).emptyTitle}>No Notifications</Text>
            <Text style={s(colors).emptySub}>You're all caught up!</Text>
          </View>
        ) : (
          notifications.map((notif) => {
            const meta = iconMap[notif.type] ?? iconMap.system;
            return (
              <Pressable
                key={notif.id}
                style={[s(colors).notifCard, !notif.isRead && s(colors).notifCardUnread]}
                onPress={() => handlePress(notif.id, notif.type)}
              >
                <View style={[s(colors).iconWrap, { backgroundColor: meta.color + "18" }]}>
                  <Feather name={meta.icon as any} size={20} color={meta.color} />
                </View>
                <View style={{ flex: 1, gap: 3 }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                    <Text style={[s(colors).notifTitle, !notif.isRead && s(colors).notifTitleUnread]} numberOfLines={1}>
                      {notif.title}
                    </Text>
                    <Text style={s(colors).time}>{formatTime(notif.createdAt)}</Text>
                  </View>
                  <Text style={s(colors).notifBody} numberOfLines={3}>{notif.body}</Text>
                </View>
                {!notif.isRead && <View style={s(colors).unreadDot} />}
              </Pressable>
            );
          })
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
    badge: { backgroundColor: colors.muted, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
    badgeText: { color: colors.primary, fontSize: 11, fontFamily: "Inter_600SemiBold" },
    unreadBanner: { marginHorizontal: 16, marginBottom: 12, backgroundColor: colors.primary + "10", borderRadius: 8, padding: 10 },
    unreadText: { color: colors.primary, fontSize: 12, fontFamily: "Inter_500Medium" },
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
    notifTitle: { fontSize: 13, fontFamily: "Inter_500Medium", color: colors.mutedForeground, flex: 1 },
    notifTitleUnread: { color: colors.foreground, fontFamily: "Inter_700Bold" },
    notifBody: { fontSize: 13, color: colors.mutedForeground, fontFamily: "Inter_400Regular", lineHeight: 18 },
    time: { fontSize: 11, color: colors.mutedForeground, fontFamily: "Inter_400Regular" },
    unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary, marginTop: 4 },
  });
