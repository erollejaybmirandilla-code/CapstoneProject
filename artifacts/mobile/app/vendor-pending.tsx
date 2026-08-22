import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

export default function VendorPendingScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View style={[s(colors).container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={s(colors).content}>
        <View style={s(colors).iconContainer}>
          <Feather name="clock" size={48} color={colors.primary} />
        </View>

        <Text style={s(colors).title}>Registration Submitted</Text>
        <Text style={s(colors).subtitle}>
          Your vendor account is pending review by our admin team.
        </Text>

        <View style={s(colors).infoCard}>
          <View style={s(colors).infoRow}>
            <Feather name="mail" size={18} color={colors.primary} />
            <View style={s(colors).infoTextWrap}>
              <Text style={s(colors).infoLabel}>Check your email</Text>
              <Text style={s(colors).infoText}>
                We'll send a confirmation email once your account is approved.
              </Text>
            </View>
          </View>

          <View style={s(colors).divider} />

          <View style={s(colors).infoRow}>
            <Feather name="shield" size={18} color={colors.accent} />
            <View style={s(colors).infoTextWrap}>
              <Text style={s(colors).infoLabel}>Verification process</Text>
              <Text style={s(colors).infoText}>
                Our team will verify your business details within 1-2 business days.
              </Text>
            </View>
          </View>

          <View style={s(colors).divider} />

          <View style={s(colors).infoRow}>
            <Feather name="check-circle" size={18} color={colors.success} />
            <View style={s(colors).infoTextWrap}>
              <Text style={s(colors).infoLabel}>After approval</Text>
              <Text style={s(colors).infoText}>
                You'll be able to list products and manage your inventory.
              </Text>
            </View>
          </View>
        </View>

        <Pressable
          style={({ pressed }) => [s(colors).btn, pressed && { opacity: 0.85 }]}
          onPress={() => router.replace("/login" as any)}
        >
          <Text style={s(colors).btnText}>Back to Login</Text>
        </Pressable>
      </View>
    </View>
  );
}

const s = (colors: ReturnType<typeof useColors>) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { flex: 1, padding: 24, alignItems: "center", justifyContent: "center" },
    iconContainer: {
      width: 96,
      height: 96,
      borderRadius: 48,
      backgroundColor: colors.primary + "15",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 24,
    },
    title: { fontSize: 24, fontFamily: "Inter_700Bold", color: colors.foreground, textAlign: "center" },
    subtitle: {
      fontSize: 15,
      color: colors.mutedForeground,
      fontFamily: "Inter_400Regular",
      textAlign: "center",
      marginTop: 8,
      lineHeight: 22,
    },
    infoCard: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 20,
      borderWidth: 1,
      borderColor: colors.border,
      width: "100%",
      marginTop: 32,
      marginBottom: 32,
    },
    infoRow: { flexDirection: "row", alignItems: "flex-start", gap: 14 },
    infoTextWrap: { flex: 1 },
    infoLabel: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: colors.foreground, marginBottom: 2 },
    infoText: { fontSize: 13, color: colors.mutedForeground, fontFamily: "Inter_400Regular", lineHeight: 18 },
    divider: { height: 1, backgroundColor: colors.border, marginVertical: 16 },
    btn: {
      backgroundColor: colors.primary,
      borderRadius: 14,
      height: 54,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      width: "100%",
    },
    btnText: { color: "#fff", fontFamily: "Inter_700Bold", fontSize: 16 },
  });