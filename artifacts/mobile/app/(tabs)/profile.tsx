import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React from "react";
import {
  Alert,
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

const ROLE_CONFIG = {
  admin: { label: "Administrator", color: "#7C3AED", icon: "shield" as const },
  staff: { label: "Staff / Cashier", color: "#2563EB", icon: "users" as const },
  customer: { label: "Customer", color: "#059669", icon: "user" as const },
};

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { orders } = useStore();

  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  if (!user) {
    return (
      <View style={[s(colors).container, { paddingTop: topInset + 12, alignItems: "center", justifyContent: "center" }]}>
        <Feather name="user" size={48} color={colors.mutedForeground} />
        <Text style={{ color: colors.mutedForeground, fontFamily: "Inter_500Medium", fontSize: 16, marginTop: 12 }}>Not logged in</Text>
        <Pressable style={[s(colors).loginBtn, { marginTop: 20 }]} onPress={() => router.push("/login" as any)}>
          <Text style={s(colors).loginBtnText}>Sign In</Text>
        </Pressable>
      </View>
    );
  }

  const kycVerified = user.kycStatus === "approved";
  const roleConfig = ROLE_CONFIG[user.role];
  const myOrders = user.role === "customer" ? orders : [];
  const completedOrders = myOrders.filter((o) => o.status === "delivered").length;
  const totalSpent = myOrders.filter((o) => o.paymentStatus === "paid").reduce((sum, o) => sum + o.total, 0);

  const handleLogout = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          await logout();
          router.replace("/login" as any);
        },
      },
    ]);
  };

  return (
    <ScrollView
      style={s(colors).container}
      contentContainerStyle={{ paddingTop: topInset + 12, paddingBottom: bottomInset + 100 }}
    >
      {/* Avatar & Info */}
      <View style={s(colors).profileHeader}>
        <View style={s(colors).avatar}>
          <Feather name={roleConfig.icon} size={36} color={roleConfig.color} />
        </View>
        <Text style={s(colors).name}>{user.name}</Text>
        <Text style={s(colors).email}>{user.email}</Text>
        <View style={[s(colors).roleBadge, { backgroundColor: roleConfig.color + "18" }]}>
          <Feather name={roleConfig.icon} size={12} color={roleConfig.color} />
          <Text style={[s(colors).roleText, { color: roleConfig.color }]}>{roleConfig.label}</Text>
        </View>
        {user.phone && <Text style={s(colors).phone}>{user.phone}</Text>}
      </View>

      {/* KYC Status */}
      {user.role === "customer" && (
        <Pressable
          style={[s(colors).kycCard, kycVerified ? s(colors).kycVerified : s(colors).kycPending]}
          onPress={() => !kycVerified && router.push("/kyc" as any)}
        >
          <View style={{ flex: 1 }}>
            <Text style={[s(colors).kycTitle, kycVerified ? { color: colors.success } : { color: colors.warning }]}>
              {kycVerified ? "Identity Verified" : "Complete KYC Verification"}
            </Text>
            <Text style={[s(colors).kycSub, kycVerified ? { color: colors.success + "aa" } : { color: colors.warning + "aa" }]}>
              {kycVerified ? "Your account is fully verified" : "Required to place orders above ₱500"}
            </Text>
          </View>
          <Feather
            name={kycVerified ? "check-circle" : "alert-circle"}
            size={22}
            color={kycVerified ? colors.success : colors.warning}
          />
        </Pressable>
      )}

      {/* Stats (customers) */}
      {user.role === "customer" && (
        <View style={s(colors).statsRow}>
          <View style={s(colors).statCard}>
            <Text style={s(colors).statValue}>{myOrders.length}</Text>
            <Text style={s(colors).statLabel}>Total Orders</Text>
          </View>
          <View style={[s(colors).statCard, { borderColor: colors.border }]}>
            <Text style={s(colors).statValue}>{completedOrders}</Text>
            <Text style={s(colors).statLabel}>Delivered</Text>
          </View>
          <View style={s(colors).statCard}>
            <Text style={s(colors).statValue}>₱{(totalSpent / 1000).toFixed(1)}k</Text>
            <Text style={s(colors).statLabel}>Total Spent</Text>
          </View>
        </View>
      )}

      {/* Menu Items */}
      <View style={s(colors).menuSection}>
        <Text style={s(colors).menuTitle}>Account</Text>

        {user.role === "customer" && (
          <>
            <MenuItem icon="heart" label="My Wishlist" onPress={() => router.push("/wishlist" as any)} colors={colors} />
            <MenuItem icon="shopping-bag" label="Order History" onPress={() => router.push("/(tabs)/orders" as any)} colors={colors} />
            {!kycVerified && (
              <MenuItem icon="user-check" label="KYC Verification" onPress={() => router.push("/kyc" as any)} colors={colors} badge="Pending" />
            )}
          </>
        )}

        {(user.role === "admin" || user.role === "staff") && (
          <>
            <MenuItem icon="bar-chart-2" label="Analytics Dashboard" onPress={() => router.push("/analytics" as any)} colors={colors} />
            <MenuItem icon="archive" label="Inventory Management" onPress={() => router.push("/(tabs)/inventory" as any)} colors={colors} />
          </>
        )}

        {user.role === "admin" && (
          <MenuItem icon="users" label="User Management" onPress={() => router.push("/user-management" as any)} colors={colors} />
        )}

        <MenuItem icon="bell" label="Notifications" onPress={() => router.push("/notifications" as any)} colors={colors} />
        <MenuItem icon="settings" label="Settings" onPress={() => {}} colors={colors} />
        <MenuItem icon="help-circle" label="Help & Support" onPress={() => {}} colors={colors} />
      </View>

      {/* Test accounts hint */}
      <View style={s(colors).hintCard}>
        <Feather name="info" size={14} color={colors.mutedForeground} />
        <Text style={s(colors).hintText}>Demo: admin@legazpimarket.ph / staff@groyon.ph / customer@gmail.com (pass: role+123)</Text>
      </View>

      {/* Sign out */}
      <Pressable style={s(colors).logoutBtn} onPress={handleLogout}>
        <Feather name="log-out" size={18} color={colors.destructive} />
        <Text style={s(colors).logoutText}>Sign Out</Text>
      </Pressable>
    </ScrollView>
  );
}

function MenuItem({
  icon,
  label,
  onPress,
  colors,
  badge,
}: {
  icon: string;
  label: string;
  onPress: () => void;
  colors: ReturnType<typeof useColors>;
  badge?: string;
}) {
  return (
    <Pressable
      style={({ pressed }) => [menuStyles(colors).item, pressed && { opacity: 0.7 }]}
      onPress={onPress}
    >
      <View style={menuStyles(colors).iconWrap}>
        <Feather name={icon as any} size={18} color={colors.primary} />
      </View>
      <Text style={menuStyles(colors).label}>{label}</Text>
      {badge && (
        <View style={menuStyles(colors).badge}>
          <Text style={menuStyles(colors).badgeText}>{badge}</Text>
        </View>
      )}
      <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
    </Pressable>
  );
}

const menuStyles = (colors: ReturnType<typeof useColors>) =>
  StyleSheet.create({
    item: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    iconWrap: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: colors.secondary,
      alignItems: "center",
      justifyContent: "center",
    },
    label: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular", color: colors.foreground },
    badge: { backgroundColor: colors.warning, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, marginRight: 4 },
    badgeText: { color: "#fff", fontSize: 10, fontFamily: "Inter_600SemiBold" },
  });

const s = (colors: ReturnType<typeof useColors>) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    profileHeader: { alignItems: "center", paddingVertical: 24, paddingHorizontal: 16 },
    avatar: {
      width: 84,
      height: 84,
      borderRadius: 42,
      backgroundColor: colors.secondary,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 12,
      borderWidth: 3,
      borderColor: colors.border,
    },
    name: { fontSize: 22, fontFamily: "Inter_700Bold", color: colors.foreground },
    email: { fontSize: 14, color: colors.mutedForeground, fontFamily: "Inter_400Regular", marginTop: 2 },
    phone: { fontSize: 13, color: colors.mutedForeground, fontFamily: "Inter_400Regular", marginTop: 4 },
    roleBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 5,
      borderRadius: 20,
      marginTop: 8,
    },
    roleText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
    kycCard: {
      flexDirection: "row",
      alignItems: "center",
      marginHorizontal: 16,
      marginBottom: 16,
      borderRadius: 12,
      padding: 14,
      borderWidth: 1.5,
      gap: 12,
    },
    kycVerified: { backgroundColor: colors.successLight, borderColor: colors.success + "40" },
    kycPending: { backgroundColor: colors.warningLight, borderColor: colors.warning + "40" },
    kycTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold", marginBottom: 2 },
    kycSub: { fontSize: 12, fontFamily: "Inter_400Regular" },
    statsRow: { flexDirection: "row", gap: 10, paddingHorizontal: 16, marginBottom: 16 },
    statCard: {
      flex: 1,
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 12,
      alignItems: "center",
      borderWidth: 1,
      borderColor: colors.border,
    },
    statValue: { fontSize: 20, fontFamily: "Inter_700Bold", color: colors.primary },
    statLabel: { fontSize: 11, color: colors.mutedForeground, fontFamily: "Inter_400Regular", marginTop: 2 },
    menuSection: {
      backgroundColor: colors.card,
      borderRadius: 16,
      marginHorizontal: 16,
      marginBottom: 16,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: colors.border,
    },
    menuTitle: {
      fontSize: 11,
      fontFamily: "Inter_600SemiBold",
      color: colors.mutedForeground,
      textTransform: "uppercase",
      letterSpacing: 0.8,
      paddingHorizontal: 16,
      paddingTop: 14,
      paddingBottom: 6,
    },
    hintCard: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 8,
      marginHorizontal: 16,
      marginBottom: 16,
      backgroundColor: colors.muted,
      borderRadius: 10,
      padding: 12,
    },
    hintText: { flex: 1, fontSize: 11, color: colors.mutedForeground, fontFamily: "Inter_400Regular", lineHeight: 16 },
    logoutBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      marginHorizontal: 16,
      paddingVertical: 16,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.destructive + "40",
      backgroundColor: colors.destructive + "08",
      marginBottom: 16,
    },
    logoutText: { color: colors.destructive, fontFamily: "Inter_600SemiBold", fontSize: 16 },
    loginBtn: { backgroundColor: colors.primary, paddingHorizontal: 32, paddingVertical: 14, borderRadius: 12 },
    loginBtnText: { color: "#fff", fontFamily: "Inter_700Bold", fontSize: 16 },
  });
