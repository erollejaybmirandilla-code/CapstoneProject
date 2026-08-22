import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import { useStore } from "@/context/StoreContext";
import { useAuth } from "@/context/AuthContext";
import type { SafeUser } from "@/lib/api";

const ROLE_COLORS: Record<string, string> = {
  admin: "#7C3AED",
  staff: "#2563EB",
  customer: "#059669",
};

export default function UserManagementScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const {
    adminUsers,
    selectedUser,
    isLoadingUsers,
    fetchAdminUsers,
    fetchUserDetails,
    updateUserRole,
    updateUserVerification,
    deleteUser,
  } = useStore();

  const [filterRole, setFilterRole] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [detailModalVisible, setDetailModalVisible] = useState(false);

  useEffect(() => {
    fetchAdminUsers();
  }, []);

  if (!currentUser || currentUser.role !== "admin") {
    return (
      <View style={[s(colors).container, { justifyContent: "center", alignItems: "center", paddingTop: insets.top }]}>
        <Feather name="lock" size={40} color={colors.mutedForeground} />
        <Text style={{ color: colors.mutedForeground, marginTop: 12, fontFamily: "Inter_500Medium" }}>Admin Access Required</Text>
      </View>
    );
  }

  const filteredUsers = adminUsers.filter((u) => {
    const matchesRole = filterRole === "all" || u.role === filterRole;
    const matchesSearch = !searchQuery || u.name.toLowerCase().includes(searchQuery.toLowerCase()) || u.email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesRole && matchesSearch;
  });

  const handleViewDetails = async (userId: string) => {
    await fetchUserDetails(userId);
    setDetailModalVisible(true);
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    Alert.alert("Change Role", `Change user role to ${newRole}?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Confirm", onPress: () => updateUserRole(userId, newRole) },
    ]);
  };

  const handleToggleVerify = async (userId: string, currentStatus: boolean) => {
    await updateUserVerification(userId, !currentStatus);
  };

  const handleDeleteUser = (userId: string, userName: string) => {
    if (userId === currentUser.id) {
      Alert.alert("Error", "You cannot delete your own account.");
      return;
    }
    Alert.alert("Delete User", `Are you sure you want to delete ${userName}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteUser(userId);
            setDetailModalVisible(false);
          } catch (error: any) {
            Alert.alert("Error", error.message || "Failed to delete user");
          }
        },
      },
    ]);
  };

  const stats = {
    total: adminUsers.length,
    admins: adminUsers.filter((u) => u.role === "admin").length,
    staff: adminUsers.filter((u) => u.role === "staff").length,
    customers: adminUsers.filter((u) => u.role === "customer").length,
  };

  return (
    <View style={[s(colors).container, { paddingTop: insets.top }]}>
      <View style={s(colors).header}>
        <Pressable onPress={() => router.back()} style={s(colors).backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={s(colors).headerTitle}>User Management</Text>
        <View style={{ width: 38 }} />
      </View>

      <View style={s(colors).statsRow}>
        <View style={s(colors).statCard}>
          <Text style={s(colors).statValue}>{stats.total}</Text>
          <Text style={s(colors).statLabel}>Total</Text>
        </View>
        <View style={s(colors).statCard}>
          <Text style={[s(colors).statValue, { color: ROLE_COLORS.admin }]}>{stats.admins}</Text>
          <Text style={s(colors).statLabel}>Admins</Text>
        </View>
        <View style={s(colors).statCard}>
          <Text style={[s(colors).statValue, { color: ROLE_COLORS.staff }]}>{stats.staff}</Text>
          <Text style={s(colors).statLabel}>Staff</Text>
        </View>
        <View style={s(colors).statCard}>
          <Text style={[s(colors).statValue, { color: ROLE_COLORS.customer }]}>{stats.customers}</Text>
          <Text style={s(colors).statLabel}>Customers</Text>
        </View>
      </View>

      <View style={s(colors).searchRow}>
        <Feather name="search" size={18} color={colors.mutedForeground} />
        <TextInput
          style={s(colors).searchInput}
          placeholder="Search users..."
          placeholderTextColor={colors.mutedForeground}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s(colors).filterBar}>
        {["all", "admin", "staff", "customer"].map((role) => (
          <Pressable
            key={role}
            onPress={() => setFilterRole(role)}
            style={[s(colors).filterChip, filterRole === role && s(colors).filterChipActive]}
          >
            <Text style={[s(colors).filterText, filterRole === role && s(colors).filterTextActive]}>
              {role === "all" ? "All" : role.charAt(0).toUpperCase() + role.slice(1)}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {isLoadingUsers ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : filteredUsers.length === 0 ? (
        <View style={s(colors).emptyState}>
          <Feather name="users" size={48} color={colors.mutedForeground} />
          <Text style={s(colors).emptyTitle}>No users found</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, gap: 10 }}>
          {filteredUsers.map((user) => (
            <View key={user.id} style={s(colors).userCard}>
              <View style={s(colors).userRow}>
                <View style={[s(colors).avatar, { backgroundColor: ROLE_COLORS[user.role] + "15" }]}>
                  <Feather name={user.role === "admin" ? "shield" : user.role === "staff" ? "user-check" : "user"} size={20} color={ROLE_COLORS[user.role]} />
                </View>
                <View style={s(colors).userInfo}>
                  <Text style={s(colors).userName}>{user.name}</Text>
                  <Text style={s(colors).userEmail}>{user.email}</Text>
                  <View style={s(colors).userMeta}>
                    <View style={[s(colors).roleBadge, { backgroundColor: ROLE_COLORS[user.role] + "15" }]}>
                      <Text style={[s(colors).roleText, { color: ROLE_COLORS[user.role] }]}>{user.role}</Text>
                    </View>
                    {user.isVerified && (
                      <View style={s(colors).verifiedBadge}>
                        <Feather name="check-circle" size={10} color="#059669" />
                        <Text style={s(colors).verifiedText}>Verified</Text>
                      </View>
                    )}
                    {user.kycStatus !== "none" && (
                      <View style={[s(colors).kycBadge, { backgroundColor: user.kycStatus === "approved" ? "#05966915" : "#F59E0B15" }]}>
                        <Text style={[s(colors).kycText, { color: user.kycStatus === "approved" ? "#059669" : "#F59E0B" }]}>
                          KYC {user.kycStatus}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
                <Pressable onPress={() => handleViewDetails(user.id)} style={s(colors).viewBtn}>
                  <Feather name="eye" size={16} color={colors.primary} />
                </Pressable>
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      <Modal visible={detailModalVisible} animationType="slide" presentationStyle="pageSheet">
        <View style={[s(colors).modalContainer, { paddingTop: insets.top }]}>
          <View style={s(colors).modalHeader}>
            <Pressable onPress={() => setDetailModalVisible(false)}>
              <Text style={s(colors).modalCancel}>Close</Text>
            </Pressable>
            <Text style={s(colors).modalTitle}>User Details</Text>
            <View style={{ width: 50 }} />
          </View>

          {selectedUser ? (
            <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
              <View style={s(colors).detailHeader}>
                <View style={[s(colors).detailAvatar, { backgroundColor: ROLE_COLORS[selectedUser.role] + "15" }]}>
                  <Feather name={selectedUser.role === "admin" ? "shield" : selectedUser.role === "staff" ? "user-check" : "user"} size={32} color={ROLE_COLORS[selectedUser.role]} />
                </View>
                <Text style={s(colors).detailName}>{selectedUser.name}</Text>
                <Text style={s(colors).detailEmail}>{selectedUser.email}</Text>
              </View>

              <View style={s(colors).detailSection}>
                <Text style={s(colors).sectionTitle}>Account Info</Text>
                <View style={s(colors).detailRow}>
                  <Text style={s(colors).detailLabel}>Role</Text>
                  <View style={[s(colors).roleBadge, { backgroundColor: ROLE_COLORS[selectedUser.role] + "15" }]}>
                    <Text style={[s(colors).roleText, { color: ROLE_COLORS[selectedUser.role] }]}>{selectedUser.role}</Text>
                  </View>
                </View>
                <View style={s(colors).detailRow}>
                  <Text style={s(colors).detailLabel}>Status</Text>
                  <Text style={s(colors).detailValue}>{selectedUser.isVerified ? "Verified" : "Unverified"}</Text>
                </View>
                <View style={s(colors).detailRow}>
                  <Text style={s(colors).detailLabel}>KYC</Text>
                  <Text style={s(colors).detailValue}>{selectedUser.kycStatus}</Text>
                </View>
                {selectedUser.phone && (
                  <View style={s(colors).detailRow}>
                    <Text style={s(colors).detailLabel}>Phone</Text>
                    <Text style={s(colors).detailValue}>{selectedUser.phone}</Text>
                  </View>
                )}
                <View style={s(colors).detailRow}>
                  <Text style={s(colors).detailLabel}>Joined</Text>
                  <Text style={s(colors).detailValue}>{new Date(selectedUser.createdAt).toLocaleDateString()}</Text>
                </View>
              </View>

              {selectedUser.orderStats && (
                <View style={s(colors).detailSection}>
                  <Text style={s(colors).sectionTitle}>Order Statistics</Text>
                  <View style={s(colors).detailRow}>
                    <Text style={s(colors).detailLabel}>Total Orders</Text>
                    <Text style={s(colors).detailValue}>{selectedUser.orderStats.totalOrders}</Text>
                  </View>
                  <View style={s(colors).detailRow}>
                    <Text style={s(colors).detailLabel}>Total Spent</Text>
                    <Text style={s(colors).detailValue}>₱{selectedUser.orderStats.totalSpent.toFixed(2)}</Text>
                  </View>
                </View>
              )}

              {selectedUser.id !== currentUser.id && (
                <View style={s(colors).detailSection}>
                  <Text style={s(colors).sectionTitle}>Actions</Text>

                  <Text style={s(colors).actionLabel}>Change Role</Text>
                  <View style={s(colors).roleButtons}>
                    {["admin", "staff", "customer"].map((role) => (
                      <Pressable
                        key={role}
                        onPress={() => handleRoleChange(selectedUser.id, role)}
                        style={[
                          s(colors).roleBtn,
                          selectedUser.role === role && s(colors).roleBtnActive,
                        ]}
                      >
                        <Text style={[
                          s(colors).roleBtnText,
                          selectedUser.role === role && s(colors).roleBtnTextActive,
                        ]}>
                          {role}
                        </Text>
                      </Pressable>
                    ))}
                  </View>

                  <Pressable
                    onPress={() => handleToggleVerify(selectedUser.id, selectedUser.isVerified)}
                    style={s(colors).actionButton}
                  >
                    <Feather name={selectedUser.isVerified ? "x-circle" : "check-circle"} size={18} color={selectedUser.isVerified ? colors.destructive : "#059669"} />
                    <Text style={s(colors).actionButtonText}>
                      {selectedUser.isVerified ? "Unverify User" : "Verify User"}
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() => handleDeleteUser(selectedUser.id, selectedUser.name)}
                    style={[s(colors).actionButton, { borderColor: colors.destructive }]}
                  >
                    <Feather name="trash-2" size={18} color={colors.destructive} />
                    <Text style={[s(colors).actionButtonText, { color: colors.destructive }]}>Delete User</Text>
                  </Pressable>
                </View>
              )}
            </ScrollView>
          ) : (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
}

const s = (colors: ReturnType<typeof useColors>) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    backBtn: { width: 38, height: 38, borderRadius: 10, alignItems: "center", justifyContent: "center" },
    headerTitle: { fontSize: 18, fontFamily: "Inter_700Bold", color: colors.foreground },
    statsRow: { flexDirection: "row", padding: 16, gap: 10 },
    statCard: { flex: 1, backgroundColor: colors.card, borderRadius: 12, padding: 12, alignItems: "center", borderWidth: 1, borderColor: colors.border },
    statValue: { fontSize: 20, fontFamily: "Inter_700Bold", color: colors.foreground },
    statLabel: { fontSize: 11, color: colors.mutedForeground, marginTop: 2 },
    searchRow: { flexDirection: "row", alignItems: "center", marginHorizontal: 16, marginBottom: 8, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: colors.card, borderRadius: 10, borderWidth: 1, borderColor: colors.border, gap: 8 },
    searchInput: { flex: 1, fontSize: 15, color: colors.foreground, fontFamily: "Inter_400Regular" },
    filterBar: { flexDirection: "row", paddingHorizontal: 16, paddingBottom: 12 },
    filterChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, marginRight: 8 },
    filterChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    filterText: { fontSize: 13, color: colors.mutedForeground },
    filterTextActive: { color: "#fff" },
    emptyState: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 12 },
    emptyTitle: { fontSize: 18, fontFamily: "Inter_600SemiBold", color: colors.foreground },
    userCard: { backgroundColor: colors.card, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: colors.border },
    userRow: { flexDirection: "row", alignItems: "center", gap: 12 },
    avatar: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
    userInfo: { flex: 1, gap: 2 },
    userName: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: colors.foreground },
    userEmail: { fontSize: 12, color: colors.mutedForeground },
    userMeta: { flexDirection: "row", gap: 6, marginTop: 4, flexWrap: "wrap" },
    roleBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
    roleText: { fontSize: 10, fontFamily: "Inter_600SemiBold", textTransform: "uppercase" },
    verifiedBadge: { flexDirection: "row", alignItems: "center", gap: 3, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, backgroundColor: "#05966915" },
    verifiedText: { fontSize: 9, fontFamily: "Inter_500Medium", color: "#059669" },
    kycBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
    kycText: { fontSize: 9, fontFamily: "Inter_500Medium" },
    viewBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: colors.background, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.border },
    modalContainer: { flex: 1, backgroundColor: colors.background },
    modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
    modalCancel: { fontSize: 15, color: colors.primary },
    modalTitle: { fontSize: 17, fontFamily: "Inter_600SemiBold", color: colors.foreground },
    detailHeader: { alignItems: "center", gap: 8, paddingVertical: 16 },
    detailAvatar: { width: 72, height: 72, borderRadius: 20, alignItems: "center", justifyContent: "center" },
    detailName: { fontSize: 20, fontFamily: "Inter_700Bold", color: colors.foreground },
    detailEmail: { fontSize: 14, color: colors.mutedForeground },
    detailSection: { backgroundColor: colors.card, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: colors.border, gap: 12 },
    sectionTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: colors.foreground, marginBottom: 4 },
    detailRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    detailLabel: { fontSize: 14, color: colors.mutedForeground },
    detailValue: { fontSize: 14, fontFamily: "Inter_500Medium", color: colors.foreground },
    actionLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: colors.foreground, marginBottom: 8 },
    roleButtons: { flexDirection: "row", gap: 8, marginBottom: 12 },
    roleBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, alignItems: "center" },
    roleBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    roleBtnText: { fontSize: 13, color: colors.mutedForeground },
    roleBtnTextActive: { color: "#fff" },
    actionButton: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 10, borderWidth: 1, borderColor: colors.border, marginBottom: 8 },
    actionButtonText: { fontSize: 14, fontFamily: "Inter_500Medium", color: colors.foreground },
  });