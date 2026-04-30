import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
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

export default function LoginScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError("Please enter your email and password.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await login(email.trim(), password);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace("/(tabs)" as any);
    } catch (e: any) {
      setError(e.message ?? "Login failed");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingTop: topInset, paddingBottom: bottomInset + 20 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Top branding */}
        <View style={s(colors).topSection}>
          <View style={s(colors).logoWrap}>
            <Image source={require("../assets/images/icon.png")} style={s(colors).logo} />
          </View>
          <Text style={s(colors).appName}>Legazpi Souvenir Market</Text>
          <Text style={s(colors).tagline}>Authentic Bicolano Pasalubong</Text>
          <View style={s(colors).locationRow}>
            <Feather name="map-pin" size={12} color={colors.mutedForeground} />
            <Text style={s(colors).location}>Legazpi Grand Central Terminal, Albay</Text>
          </View>
        </View>

        {/* Form */}
        <View style={s(colors).form}>
          <Text style={s(colors).formTitle}>Welcome Back</Text>
          <Text style={s(colors).formSubtitle}>Sign in to your account</Text>

          {error ? (
            <View style={s(colors).errorBox}>
              <Feather name="alert-circle" size={14} color={colors.destructive} />
              <Text style={s(colors).errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={s(colors).fieldWrap}>
            <Text style={s(colors).label}>Email Address</Text>
            <View style={s(colors).inputWrap}>
              <Feather name="mail" size={16} color={colors.mutedForeground} style={{ marginLeft: 14 }} />
              <TextInput
                style={s(colors).input}
                placeholder="your@email.com"
                placeholderTextColor={colors.mutedForeground}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          <View style={s(colors).fieldWrap}>
            <Text style={s(colors).label}>Password</Text>
            <View style={s(colors).inputWrap}>
              <Feather name="lock" size={16} color={colors.mutedForeground} style={{ marginLeft: 14 }} />
              <TextInput
                style={s(colors).input}
                placeholder="••••••••"
                placeholderTextColor={colors.mutedForeground}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPass}
                autoCapitalize="none"
              />
              <Pressable onPress={() => setShowPass((v) => !v)} style={{ paddingRight: 14 }}>
                <Feather name={showPass ? "eye-off" : "eye"} size={16} color={colors.mutedForeground} />
              </Pressable>
            </View>
          </View>

          <Pressable
            style={({ pressed }) => [s(colors).loginBtn, pressed && { opacity: 0.85 }, loading && { opacity: 0.6 }]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <Text style={s(colors).loginBtnText}>Signing in...</Text>
            ) : (
              <>
                <Text style={s(colors).loginBtnText}>Sign In</Text>
                <Feather name="arrow-right" size={18} color="#fff" />
              </>
            )}
          </Pressable>

          <View style={s(colors).registerRow}>
            <Text style={s(colors).registerText}>Don't have an account?</Text>
            <Pressable onPress={() => router.push("/register" as any)}>
              <Text style={s(colors).registerLink}>Register here</Text>
            </Pressable>
          </View>
        </View>

        {/* Demo credentials */}
        <View style={s(colors).demoSection}>
          <Text style={s(colors).demoTitle}>Demo Accounts</Text>
          <View style={s(colors).demoGrid}>
            {[
              { role: "Admin", email: "admin@legazpimarket.ph", pass: "admin123", color: "#7C3AED" },
              { role: "Staff", email: "staff@groyon.ph", pass: "staff123", color: "#2563EB" },
              { role: "Customer", email: "customer@gmail.com", pass: "customer123", color: "#059669" },
            ].map((demo) => (
              <Pressable
                key={demo.role}
                style={[s(colors).demoCard, { borderColor: demo.color + "30" }]}
                onPress={() => {
                  setEmail(demo.email);
                  setPassword(demo.pass);
                }}
              >
                <View style={[s(colors).demoRoleBadge, { backgroundColor: demo.color + "15" }]}>
                  <Text style={[s(colors).demoRole, { color: demo.color }]}>{demo.role}</Text>
                </View>
                <Text style={s(colors).demoEmail} numberOfLines={1}>{demo.email}</Text>
                <Text style={s(colors).demoPass}>{demo.pass}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = (colors: ReturnType<typeof useColors>) =>
  StyleSheet.create({
    topSection: { alignItems: "center", paddingVertical: 32, paddingHorizontal: 24 },
    logoWrap: {
      width: 80,
      height: 80,
      borderRadius: 24,
      overflow: "hidden",
      marginBottom: 16,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 6,
    },
    logo: { width: "100%", height: "100%" },
    appName: { fontSize: 22, fontFamily: "Inter_700Bold", color: colors.foreground, textAlign: "center" },
    tagline: { fontSize: 14, color: colors.mutedForeground, fontFamily: "Inter_400Regular", marginTop: 4, textAlign: "center" },
    locationRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 6 },
    location: { fontSize: 12, color: colors.mutedForeground, fontFamily: "Inter_400Regular" },
    form: {
      backgroundColor: colors.card,
      borderRadius: 24,
      marginHorizontal: 16,
      padding: 24,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 16,
    },
    formTitle: { fontSize: 22, fontFamily: "Inter_700Bold", color: colors.foreground },
    formSubtitle: { fontSize: 14, color: colors.mutedForeground, fontFamily: "Inter_400Regular", marginTop: -8 },
    errorBox: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      backgroundColor: colors.destructive + "12",
      borderRadius: 10,
      padding: 12,
      borderWidth: 1,
      borderColor: colors.destructive + "30",
    },
    errorText: { flex: 1, color: colors.destructive, fontFamily: "Inter_500Medium", fontSize: 13 },
    fieldWrap: { gap: 6 },
    label: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: colors.foreground },
    inputWrap: {
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      backgroundColor: colors.background,
      height: 52,
    },
    input: {
      flex: 1,
      paddingHorizontal: 10,
      fontSize: 15,
      color: colors.foreground,
      fontFamily: "Inter_400Regular",
    },
    loginBtn: {
      backgroundColor: colors.primary,
      borderRadius: 14,
      height: 54,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      marginTop: 4,
    },
    loginBtnText: { color: "#fff", fontFamily: "Inter_700Bold", fontSize: 16 },
    registerRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
    registerText: { fontSize: 14, color: colors.mutedForeground, fontFamily: "Inter_400Regular" },
    registerLink: { fontSize: 14, color: colors.primary, fontFamily: "Inter_600SemiBold" },
    demoSection: { marginHorizontal: 16, marginTop: 24 },
    demoTitle: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: colors.mutedForeground, textAlign: "center", marginBottom: 12, textTransform: "uppercase", letterSpacing: 0.8 },
    demoGrid: { flexDirection: "row", gap: 8 },
    demoCard: {
      flex: 1,
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 10,
      borderWidth: 1,
      gap: 5,
    },
    demoRoleBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, alignSelf: "flex-start" },
    demoRole: { fontSize: 10, fontFamily: "Inter_700Bold" },
    demoEmail: { fontSize: 9, color: colors.mutedForeground, fontFamily: "Inter_400Regular" },
    demoPass: { fontSize: 11, fontFamily: "Inter_600SemiBold", color: colors.foreground },
  });
