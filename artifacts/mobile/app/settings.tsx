import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
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
import { api, updateUserProfile, changePassword } from "@/lib/api";

export default function SettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, logout, refreshUser } = useAuth();

  if (!user) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ color: colors.mutedForeground }}>Please log in to access settings</Text>
      </View>
    );
  }

  const [name, setName] = useState(user.name || "");
  const [phone, setPhone] = useState(user.phone || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);

  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;
  const userRole = user.role;

  const handleUpdateProfile = async () => {
    if (!name.trim()) {
      Alert.alert("Error", "Name cannot be empty");
      return;
    }
    setSaving(true);
    try {
      await updateUserProfile({ name: name.trim(), phone: phone.trim() || null });
      await refreshUser();
      Alert.alert("Success", "Profile updated successfully");
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert("Error", "Please fill in all password fields");
      return;
    }
    if (newPassword.length < 8) {
      Alert.alert("Error", "New password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "New passwords do not match");
      return;
    }
    setSaving(true);
    try {
      await changePassword(currentPassword, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      Alert.alert("Success", "Password changed successfully");
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to change password");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "This action cannot be undone. All your data will be permanently deleted.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await api.delete("/users/me");
              await logout();
              router.replace("/login");
            } catch (err: any) {
              Alert.alert("Error", err.message || "Failed to delete account");
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ paddingTop: topInset + 12, paddingBottom: bottomInset + 100 }}
    >
      {/* Profile Section */}
      <View style={s(colors).section}>
        <Text style={s(colors).sectionTitle}>Profile Information</Text>
        <View style={s(colors).card}>
          <View style={s(colors).field}>
            <Text style={s(colors).label}>Full Name</Text>
            <TextInput
              style={s(colors).input}
              value={name}
              onChangeText={setName}
              placeholder="Enter your name"
              placeholderTextColor={colors.mutedForeground}
            />
          </View>
          <View style={s(colors).field}>
            <Text style={s(colors).label}>Email</Text>
            <TextInput
              style={[s(colors).input, { color: colors.mutedForeground }]}
              value={user?.email}
              editable={false}
            />
            <Text style={s(colors).hint}>Email cannot be changed</Text>
          </View>
          <View style={s(colors).field}>
            <Text style={s(colors).label}>Phone</Text>
            <TextInput
              style={s(colors).input}
              value={phone}
              onChangeText={setPhone}
              placeholder="Enter your phone number"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="phone-pad"
            />
          </View>
          <Pressable
            style={[s(colors).saveBtn, saving && { opacity: 0.6 }]}
            onPress={handleUpdateProfile}
            disabled={saving}
          >
            <Text style={s(colors).saveBtnText}>{saving ? "Saving..." : "Save Changes"}</Text>
          </Pressable>
        </View>
      </View>

      {/* Password Section */}
      <View style={s(colors).section}>
        <Text style={s(colors).sectionTitle}>Change Password</Text>
        <View style={s(colors).card}>
          <View style={s(colors).field}>
            <Text style={s(colors).label}>Current Password</Text>
            <TextInput
              style={s(colors).input}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder="Enter current password"
              placeholderTextColor={colors.mutedForeground}
              secureTextEntry
            />
          </View>
          <View style={s(colors).field}>
            <Text style={s(colors).label}>New Password</Text>
            <TextInput
              style={s(colors).input}
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="Enter new password"
              placeholderTextColor={colors.mutedForeground}
              secureTextEntry
            />
          </View>
          <View style={s(colors).field}>
            <Text style={s(colors).label}>Confirm New Password</Text>
            <TextInput
              style={s(colors).input}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Confirm new password"
              placeholderTextColor={colors.mutedForeground}
              secureTextEntry
            />
          </View>
          <Pressable
            style={[s(colors).saveBtn, saving && { opacity: 0.6 }]}
            onPress={handleChangePassword}
            disabled={saving}
          >
            <Text style={s(colors).saveBtnText}>{saving ? "Updating..." : "Update Password"}</Text>
          </Pressable>
        </View>
      </View>

      {/* Admin/Staff Specific Settings */}
      {(userRole === "admin" || userRole === "staff") && (
        <View style={s(colors).section}>
          <Text style={s(colors).sectionTitle}>Management</Text>
          <View style={s(colors).card}>
            {userRole === "admin" && (
              <>
                <MenuItem
                  icon="users"
                  label="User Management"
                  onPress={() => router.push("/user-management" as any)}
                  colors={colors}
                />
                <MenuItem
                  icon="bar-chart-2"
                  label="Analytics Dashboard"
                  onPress={() => router.push("/analytics" as any)}
                  colors={colors}
                />
              </>
            )}
            <MenuItem
              icon="archive"
              label="Inventory Management"
              onPress={() => router.push("/(tabs)/inventory" as any)}
              colors={colors}
            />
            <MenuItem
              icon="package"
              label="Product Management"
              onPress={() => router.push("/product-management" as any)}
              colors={colors}
            />
          </View>
        </View>
      )}

      {/* Danger Zone */}
      <View style={s(colors).section}>
        <Text style={[s(colors).sectionTitle, { color: colors.destructive }]}>Danger Zone</Text>
        <View style={s(colors).card}>
          <Pressable style={s(colors).dangerBtn} onPress={handleDeleteAccount}>
            <Feather name="trash-2" size={18} color="#fff" />
            <Text style={s(colors).dangerBtnText}>Delete Account</Text>
          </Pressable>
        </View>
      </View>

      {/* App Info */}
      <View style={s(colors).section}>
        <Text style={s(colors).sectionTitle}>About</Text>
        <View style={s(colors).card}>
          <View style={s(colors).infoRow}>
            <Text style={s(colors).infoLabel}>Version</Text>
            <Text style={s(colors).infoValue}>1.0.0</Text>
          </View>
          <View style={s(colors).infoRow}>
            <Text style={s(colors).infoLabel}>Role</Text>
            <Text style={s(colors).infoValue}>{userRole}</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

function MenuItem({ icon, label, onPress, colors }: { icon: string; label: string; onPress: () => void; colors: any }) {
  return (
    <Pressable
      style={({ pressed }) => [menuStyles(colors).item, pressed && { opacity: 0.7 }]}
      onPress={onPress}
    >
      <View style={menuStyles(colors).iconWrap}>
        <Feather name={icon as any} size={18} color={colors.primary} />
      </View>
      <Text style={menuStyles(colors).label}>{label}</Text>
      <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
    </Pressable>
  );
}

const menuStyles = (colors: any) =>
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
  });

const s = (colors: any) =>
  StyleSheet.create({
    section: { marginHorizontal: 16, marginBottom: 20 },
    sectionTitle: {
      fontSize: 13,
      fontFamily: "Inter_600SemiBold",
      color: colors.mutedForeground,
      textTransform: "uppercase",
      letterSpacing: 0.8,
      marginBottom: 8,
    },
    card: {
      backgroundColor: colors.card,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: "hidden",
    },
    field: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
    label: {
      fontSize: 12,
      fontFamily: "Inter_500Medium",
      color: colors.mutedForeground,
      marginBottom: 6,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    input: {
      fontSize: 15,
      fontFamily: "Inter_400Regular",
      color: colors.foreground,
      paddingVertical: 8,
      paddingHorizontal: 12,
      backgroundColor: colors.background,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
    },
    hint: { fontSize: 11, color: colors.mutedForeground, marginTop: 4, fontFamily: "Inter_400Regular" },
    saveBtn: {
      margin: 16,
      backgroundColor: colors.primary,
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: "center",
    },
    saveBtnText: { color: "#fff", fontFamily: "Inter_700Bold", fontSize: 15 },
    dangerBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      paddingVertical: 14,
      margin: 16,
      backgroundColor: colors.destructive,
      borderRadius: 12,
    },
    dangerBtnText: { color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 15 },
    infoRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    infoLabel: { fontSize: 15, fontFamily: "Inter_400Regular", color: colors.foreground },
    infoValue: { fontSize: 15, fontFamily: "Inter_500Medium", color: colors.mutedForeground },
  });
