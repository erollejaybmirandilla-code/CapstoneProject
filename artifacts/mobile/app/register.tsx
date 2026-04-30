import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
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

export default function RegisterScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { register } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password.trim() || !phone.trim()) {
      setError("All fields are required.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await register({ name: name.trim(), email: email.trim(), password, phone: phone.trim() });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace("/kyc" as any);
    } catch (e: any) {
      setError(e.message ?? "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingTop: topInset, paddingBottom: bottomInset + 20 }} keyboardShouldPersistTaps="handled">
        <View style={s(colors).header}>
          <Pressable onPress={() => router.back()} style={s(colors).backBtn}>
            <Feather name="arrow-left" size={22} color={colors.foreground} />
          </Pressable>
        </View>

        <View style={s(colors).form}>
          <Text style={s(colors).title}>Create Account</Text>
          <Text style={s(colors).subtitle}>Join the Legazpi Souvenir Market</Text>

          {error ? (
            <View style={s(colors).errorBox}>
              <Feather name="alert-circle" size={14} color={colors.destructive} />
              <Text style={s(colors).errorText}>{error}</Text>
            </View>
          ) : null}

          {[
            { label: "Full Name", value: name, setter: setName, placeholder: "Juan dela Cruz", icon: "user", type: "default" },
            { label: "Email Address", value: email, setter: setEmail, placeholder: "juan@email.com", icon: "mail", type: "email-address" },
            { label: "Phone Number", value: phone, setter: setPhone, placeholder: "+63 9XX XXX XXXX", icon: "phone", type: "phone-pad" },
          ].map((field) => (
            <View key={field.label} style={s(colors).fieldWrap}>
              <Text style={s(colors).label}>{field.label}</Text>
              <View style={s(colors).inputWrap}>
                <Feather name={field.icon as any} size={16} color={colors.mutedForeground} style={{ marginLeft: 14 }} />
                <TextInput
                  style={s(colors).input}
                  placeholder={field.placeholder}
                  placeholderTextColor={colors.mutedForeground}
                  value={field.value}
                  onChangeText={field.setter}
                  keyboardType={field.type as any}
                  autoCapitalize={field.type === "email-address" ? "none" : "words"}
                />
              </View>
            </View>
          ))}

          <View style={s(colors).fieldWrap}>
            <Text style={s(colors).label}>Password</Text>
            <View style={s(colors).inputWrap}>
              <Feather name="lock" size={16} color={colors.mutedForeground} style={{ marginLeft: 14 }} />
              <TextInput
                style={s(colors).input}
                placeholder="Min 6 characters"
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

          <View style={s(colors).termsRow}>
            <Feather name="info" size={12} color={colors.mutedForeground} />
            <Text style={s(colors).termsText}>By registering, you agree to our Terms of Service and Privacy Policy.</Text>
          </View>

          <Pressable
            style={({ pressed }) => [s(colors).btn, pressed && { opacity: 0.85 }, loading && { opacity: 0.6 }]}
            onPress={handleRegister}
            disabled={loading}
          >
            <Text style={s(colors).btnText}>{loading ? "Creating account..." : "Create Account"}</Text>
            {!loading && <Feather name="arrow-right" size={18} color="#fff" />}
          </Pressable>

          <View style={s(colors).loginRow}>
            <Text style={s(colors).loginText}>Already have an account?</Text>
            <Pressable onPress={() => router.push("/login" as any)}>
              <Text style={s(colors).loginLink}>Sign In</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = (colors: ReturnType<typeof useColors>) =>
  StyleSheet.create({
    header: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
    backBtn: { padding: 8, alignSelf: "flex-start" },
    form: { marginHorizontal: 16, backgroundColor: colors.card, borderRadius: 24, padding: 24, borderWidth: 1, borderColor: colors.border, gap: 16 },
    title: { fontSize: 24, fontFamily: "Inter_700Bold", color: colors.foreground },
    subtitle: { fontSize: 14, color: colors.mutedForeground, fontFamily: "Inter_400Regular", marginTop: -8 },
    errorBox: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: colors.destructive + "12", borderRadius: 10, padding: 12, borderWidth: 1, borderColor: colors.destructive + "30" },
    errorText: { flex: 1, color: colors.destructive, fontFamily: "Inter_500Medium", fontSize: 13 },
    fieldWrap: { gap: 6 },
    label: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: colors.foreground },
    inputWrap: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: colors.border, borderRadius: 12, backgroundColor: colors.background, height: 52 },
    input: { flex: 1, paddingHorizontal: 10, fontSize: 15, color: colors.foreground, fontFamily: "Inter_400Regular" },
    termsRow: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
    termsText: { flex: 1, fontSize: 11, color: colors.mutedForeground, fontFamily: "Inter_400Regular", lineHeight: 16 },
    btn: { backgroundColor: colors.primary, borderRadius: 14, height: 54, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
    btnText: { color: "#fff", fontFamily: "Inter_700Bold", fontSize: 16 },
    loginRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
    loginText: { fontSize: 14, color: colors.mutedForeground, fontFamily: "Inter_400Regular" },
    loginLink: { fontSize: 14, color: colors.primary, fontFamily: "Inter_600SemiBold" },
  });
