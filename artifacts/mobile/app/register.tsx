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

type AccountType = "customer" | "vendor" | null;

type FormData = {
  name: string;
  email: string;
  phone: string;
  password: string;
  accountType: AccountType;
  vendorName: string;
  vendorDescription: string;
  vendorLocation: string;
  dtiRegistration: string;
};

const initialForm: FormData = {
  name: "",
  email: "",
  phone: "",
  password: "",
  accountType: null,
  vendorName: "",
  vendorDescription: "",
  vendorLocation: "",
  dtiRegistration: "",
};

export default function RegisterScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { register } = useAuth();

  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>(initialForm);
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  const totalSteps = form.accountType === "vendor" ? 3 : 2;

  const updateField = (field: keyof FormData, value: string | AccountType) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const validateStep1 = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!form.name.trim() || form.name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email.trim())) {
      newErrors.email = "Please enter a valid email address";
    }

    const phoneRegex = /^(\+63|0)\d{10}$/;
    const cleanPhone = form.phone.replace(/\s/g, "");
    if (!phoneRegex.test(cleanPhone)) {
      newErrors.phone = "Please enter a valid Philippine phone number";
    }

    if (form.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    } else if (!/(?=.*[A-Z])/.test(form.password)) {
      newErrors.password = "Password must contain at least one uppercase letter";
    } else if (!/(?=.*[0-9])/.test(form.password)) {
      newErrors.password = "Password must contain at least one number";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep3 = (): boolean => {
    if (form.accountType === "customer") return true;

    const newErrors: Record<string, string> = {};

    if (!form.vendorName.trim() || form.vendorName.trim().length < 3) {
      newErrors.vendorName = "Business name must be at least 3 characters";
    }

    if (!form.vendorDescription.trim() || form.vendorDescription.trim().length < 20) {
      newErrors.vendorDescription = "Description must be at least 20 characters";
    }

    if (!form.vendorLocation.trim()) {
      newErrors.vendorLocation = "Business location is required";
    }

    const dtiRegex = /^\d{8,10}$/;
    if (!dtiRegex.test(form.dtiRegistration.replace(/\s/g, ""))) {
      newErrors.dtiRegistration = "Please enter a valid DTI registration number";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinue = () => {
    if (step === 1) {
      if (validateStep1()) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setStep(2);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } else if (step === 2 && form.accountType) {
      if (form.accountType === "vendor") {
        setStep(3);
      } else {
        handleRegister();
      }
    } else if (step === 3) {
      if (validateStep3()) {
        handleRegister();
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    }
  };

  const handleRegister = async () => {
    setLoading(true);
    setErrors({});

    try {
      await register({
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        phone: form.phone.replace(/\s/g, ""),
        accountType: form.accountType!,
        vendorDetails:
          form.accountType === "vendor"
            ? {
                name: form.vendorName.trim(),
                description: form.vendorDescription.trim(),
                location: form.vendorLocation.trim(),
                dtiRegistration: form.dtiRegistration.replace(/\s/g, ""),
              }
            : undefined,
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      if (form.accountType === "vendor") {
        router.replace("/vendor-pending" as any);
      } else {
        router.replace("/kyc" as any);
      }
    } catch (e: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setErrors({ form: e.message ?? "Registration failed. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      router.back();
    }
  };

  const renderStepIndicator = () => (
    <View style={s(colors).stepIndicator}>
      {Array.from({ length: totalSteps }).map((_, i) => (
        <View key={i} style={s(colors).stepItem}>
          <View
            style={[
              s(colors).stepCircle,
              i + 1 === step && s(colors).stepCircleActive,
              i + 1 < step && s(colors).stepCircleComplete,
            ]}
          >
            {i + 1 < step ? (
              <Feather name="check" size={14} color="#fff" />
            ) : (
              <Text
                style={[
                  s(colors).stepNumber,
                  i + 1 === step && s(colors).stepNumberActive,
                ]}
              >
                {i + 1}
              </Text>
            )}
          </View>
          {i < totalSteps - 1 && (
            <View
              style={[
                s(colors).stepLine,
                i + 1 < step && s(colors).stepLineComplete,
              ]}
            />
          )}
        </View>
      ))}
    </View>
  );

  const renderStep1 = () => (
    <View style={s(colors).stepContent}>
      <Text style={s(colors).stepTitle}>Create Your Account</Text>
      <Text style={s(colors).stepSubtitle}>Enter your basic information to get started</Text>

      <View style={s(colors).fieldWrap}>
        <Text style={s(colors).label}>Full Name *</Text>
        <View style={s(colors).inputWrap}>
          <Feather name="user" size={16} color={colors.mutedForeground} style={s(colors).inputIcon} />
          <TextInput
            style={s(colors).input}
            placeholder="Juan dela Cruz"
            placeholderTextColor={colors.mutedForeground}
            value={form.name}
            onChangeText={(v) => updateField("name", v)}
            autoCapitalize="words"
          />
        </View>
        {errors.name && <Text style={s(colors).errorText}>{errors.name}</Text>}
      </View>

      <View style={s(colors).fieldWrap}>
        <Text style={s(colors).label}>Email Address *</Text>
        <View style={s(colors).inputWrap}>
          <Feather name="mail" size={16} color={colors.mutedForeground} style={s(colors).inputIcon} />
          <TextInput
            style={s(colors).input}
            placeholder="juan@email.com"
            placeholderTextColor={colors.mutedForeground}
            value={form.email}
            onChangeText={(v) => updateField("email", v)}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>
        {errors.email && <Text style={s(colors).errorText}>{errors.email}</Text>}
      </View>

      <View style={s(colors).fieldWrap}>
        <Text style={s(colors).label}>Phone Number *</Text>
        <View style={s(colors).inputWrap}>
          <Feather name="phone" size={16} color={colors.mutedForeground} style={s(colors).inputIcon} />
          <TextInput
            style={s(colors).input}
            placeholder="+63 9XX XXX XXXX"
            placeholderTextColor={colors.mutedForeground}
            value={form.phone}
            onChangeText={(v) => updateField("phone", v)}
            keyboardType="phone-pad"
          />
        </View>
        {errors.phone && <Text style={s(colors).errorText}>{errors.phone}</Text>}
      </View>

      <View style={s(colors).fieldWrap}>
        <Text style={s(colors).label}>Password *</Text>
        <View style={s(colors).inputWrap}>
          <Feather name="lock" size={16} color={colors.mutedForeground} style={s(colors).inputIcon} />
          <TextInput
            style={s(colors).input}
            placeholder="Min 8 chars, 1 uppercase, 1 number"
            placeholderTextColor={colors.mutedForeground}
            value={form.password}
            onChangeText={(v) => updateField("password", v)}
            secureTextEntry={!showPass}
            autoCapitalize="none"
          />
          <Pressable onPress={() => setShowPass(!showPass)} style={s(colors).eyeBtn}>
            <Feather name={showPass ? "eye-off" : "eye"} size={16} color={colors.mutedForeground} />
          </Pressable>
        </View>
        {errors.password && <Text style={s(colors).errorText}>{errors.password}</Text>}
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View style={s(colors).stepContent}>
      <Text style={s(colors).stepTitle}>Choose Account Type</Text>
      <Text style={s(colors).stepSubtitle}>Select how you'll use the platform</Text>

      <View style={s(colors).accountTypeGrid}>
        <Pressable
          style={[
            s(colors).accountTypeCard,
            form.accountType === "customer" && s(colors).accountTypeCardActive,
          ]}
          onPress={() => {
            updateField("accountType", "customer");
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}
        >
          <View style={s(colors).accountTypeIcon}>
            <Feather name="user" size={28} color={form.accountType === "customer" ? "#fff" : colors.primary} />
          </View>
          <Text style={[s(colors).accountTypeTitle, form.accountType === "customer" && s(colors).accountTypeTitleActive]}>
            Customer
          </Text>
          <Text style={[s(colors).accountTypeDesc, form.accountType === "customer" && s(colors).accountTypeDescActive]}>
            Shop products, track orders, and enjoy easy returns
          </Text>
          <View style={s(colors).featureList}>
            {["Browse products", "Place orders", "Track deliveries"].map((feature) => (
              <View key={feature} style={s(colors).featureItem}>
                <Feather name="check" size={12} color={form.accountType === "customer" ? "#fff" : colors.accent} />
                <Text style={[s(colors).featureText, form.accountType === "customer" && s(colors).featureTextActive]}>
                  {feature}
                </Text>
              </View>
            ))}
          </View>
        </Pressable>

        <Pressable
          style={[
            s(colors).accountTypeCard,
            form.accountType === "vendor" && s(colors).accountTypeCardActive,
          ]}
          onPress={() => {
            updateField("accountType", "vendor");
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}
        >
          <View style={s(colors).accountTypeIcon}>
            <Feather name="briefcase" size={28} color={form.accountType === "vendor" ? "#fff" : colors.primary} />
          </View>
          <Text style={[s(colors).accountTypeTitle, form.accountType === "vendor" && s(colors).accountTypeTitleActive]}>
            Vendor
          </Text>
          <Text style={[s(colors).accountTypeDesc, form.accountType === "vendor" && s(colors).accountTypeDescActive]}>
            Sell products, manage inventory, and view analytics
          </Text>
          <View style={s(colors).featureList}>
            {["List products", "Manage inventory", "View analytics"].map((feature) => (
              <View key={feature} style={s(colors).featureItem}>
                <Feather name="check" size={12} color={form.accountType === "vendor" ? "#fff" : colors.accent} />
                <Text style={[s(colors).featureText, form.accountType === "vendor" && s(colors).featureTextActive]}>
                  {feature}
                </Text>
              </View>
            ))}
          </View>
        </Pressable>
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View style={s(colors).stepContent}>
      <Text style={s(colors).stepTitle}>Business Information</Text>
      <Text style={s(colors).stepSubtitle}>Tell us about your business (Admin approval required)</Text>

      <View style={s(colors).infoBanner}>
        <Feather name="info" size={16} color={colors.primary} />
        <Text style={s(colors).infoBannerText}>
          Your vendor account will be reviewed by our team. You'll receive an email once approved.
        </Text>
      </View>

      <View style={s(colors).fieldWrap}>
        <Text style={s(colors).label}>Business Name *</Text>
        <View style={s(colors).inputWrap}>
          <Feather name="shopping-bag" size={16} color={colors.mutedForeground} style={s(colors).inputIcon} />
          <TextInput
            style={s(colors).input}
            placeholder="Your business name"
            placeholderTextColor={colors.mutedForeground}
            value={form.vendorName}
            onChangeText={(v) => updateField("vendorName", v)}
            autoCapitalize="words"
          />
        </View>
        {errors.vendorName && <Text style={s(colors).errorText}>{errors.vendorName}</Text>}
      </View>

      <View style={s(colors).fieldWrap}>
        <Text style={s(colors).label}>Business Description *</Text>
        <View style={[s(colors).inputWrap, s(colors).textAreaWrap]}>
          <TextInput
            style={[s(colors).input, s(colors).textArea]}
            placeholder="Describe your business and products (min 20 characters)"
            placeholderTextColor={colors.mutedForeground}
            value={form.vendorDescription}
            onChangeText={(v) => updateField("vendorDescription", v)}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>
        {errors.vendorDescription && <Text style={s(colors).errorText}>{errors.vendorDescription}</Text>}
      </View>

      <View style={s(colors).fieldWrap}>
        <Text style={s(colors).label}>Business Location *</Text>
        <View style={s(colors).inputWrap}>
          <Feather name="map-pin" size={16} color={colors.mutedForeground} style={s(colors).inputIcon} />
          <TextInput
            style={s(colors).input}
            placeholder="City, Province"
            placeholderTextColor={colors.mutedForeground}
            value={form.vendorLocation}
            onChangeText={(v) => updateField("vendorLocation", v)}
            autoCapitalize="words"
          />
        </View>
        {errors.vendorLocation && <Text style={s(colors).errorText}>{errors.vendorLocation}</Text>}
      </View>

      <View style={s(colors).fieldWrap}>
        <Text style={s(colors).label}>DTI Registration Number *</Text>
        <View style={s(colors).inputWrap}>
          <Feather name="file-text" size={16} color={colors.mutedForeground} style={s(colors).inputIcon} />
          <TextInput
            style={s(colors).input}
            placeholder="10-digit DTI registration"
            placeholderTextColor={colors.mutedForeground}
            value={form.dtiRegistration}
            onChangeText={(v) => updateField("dtiRegistration", v)}
            keyboardType="number-pad"
          />
        </View>
        {errors.dtiRegistration && <Text style={s(colors).errorText}>{errors.dtiRegistration}</Text>}
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingTop: topInset,
          paddingBottom: bottomInset + 20,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={s(colors).header}>
          <Pressable onPress={handleBack} style={s(colors).backBtn}>
            <Feather name="arrow-left" size={22} color={colors.foreground} />
          </Pressable>
        </View>

        {renderStepIndicator()}

        <View style={s(colors).form}>
          {errors.form && (
            <View style={s(colors).errorBox}>
              <Feather name="alert-circle" size={14} color={colors.destructive} />
              <Text style={s(colors).errorBoxText}>{errors.form}</Text>
            </View>
          )}

          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}

          <Pressable
            style={({ pressed }) => [
              s(colors).btn,
              pressed && { opacity: 0.85 },
              loading && { opacity: 0.6 },
            ]}
            onPress={handleContinue}
            disabled={loading || (step === 2 && !form.accountType)}
          >
            <Text style={s(colors).btnText}>
              {loading
                ? "Creating account..."
                : step === totalSteps
                ? "Complete Registration"
                : "Continue"}
            </Text>
            {!loading && (
              <Feather
                name={step === totalSteps ? "check" : "arrow-right"}
                size={18}
                color="#fff"
              />
            )}
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
    stepIndicator: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 40,
      paddingBottom: 24,
    },
    stepItem: { flexDirection: "row", alignItems: "center" },
    stepCircle: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
    },
    stepCircleActive: { backgroundColor: colors.primary },
    stepCircleComplete: { backgroundColor: colors.accent },
    stepNumber: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: colors.mutedForeground },
    stepNumberActive: { color: "#fff" },
    stepLine: { width: 40, height: 2, backgroundColor: colors.border, marginHorizontal: 8 },
    stepLineComplete: { backgroundColor: colors.accent },
    form: {
      marginHorizontal: 16,
      backgroundColor: colors.card,
      borderRadius: 24,
      padding: 24,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 16,
    },
    stepContent: { gap: 4 },
    stepTitle: { fontSize: 22, fontFamily: "Inter_700Bold", color: colors.foreground },
    stepSubtitle: { fontSize: 14, color: colors.mutedForeground, fontFamily: "Inter_400Regular", marginBottom: 12 },
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
    errorBoxText: { flex: 1, color: colors.destructive, fontFamily: "Inter_500Medium", fontSize: 13 },
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
    textAreaWrap: { height: "auto", minHeight: 100 },
    inputIcon: { marginLeft: 14 },
    input: {
      flex: 1,
      paddingHorizontal: 10,
      fontSize: 15,
      color: colors.foreground,
      fontFamily: "Inter_400Regular",
    },
    textArea: { paddingVertical: 12 },
    eyeBtn: { paddingRight: 14 },
    errorText: { fontSize: 12, color: colors.destructive, fontFamily: "Inter_500Medium", marginTop: 2 },
    accountTypeGrid: { gap: 12 },
    accountTypeCard: {
      backgroundColor: colors.background,
      borderRadius: 16,
      padding: 20,
      borderWidth: 2,
      borderColor: colors.border,
    },
    accountTypeCardActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    accountTypeIcon: {
      width: 56,
      height: 56,
      borderRadius: 16,
      backgroundColor: colors.card,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 12,
    },
    accountTypeTitle: { fontSize: 18, fontFamily: "Inter_700Bold", color: colors.foreground, marginBottom: 4 },
    accountTypeTitleActive: { color: "#fff" },
    accountTypeDesc: { fontSize: 13, color: colors.mutedForeground, fontFamily: "Inter_400Regular", marginBottom: 12 },
    accountTypeDescActive: { color: "#fff", opacity: 0.9 },
    featureList: { gap: 6 },
    featureItem: { flexDirection: "row", alignItems: "center", gap: 8 },
    featureText: { fontSize: 12, color: colors.foreground, fontFamily: "Inter_500Medium" },
    featureTextActive: { color: "#fff" },
    infoBanner: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 10,
      backgroundColor: colors.primary + "12",
      borderRadius: 10,
      padding: 14,
      borderWidth: 1,
      borderColor: colors.primary + "30",
    },
    infoBannerText: { flex: 1, fontSize: 13, color: colors.primary, fontFamily: "Inter_500Medium", lineHeight: 18 },
    btn: {
      backgroundColor: colors.primary,
      borderRadius: 14,
      height: 54,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      marginTop: 8,
    },
    btnText: { color: "#fff", fontFamily: "Inter_700Bold", fontSize: 16 },
    loginRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 8 },
    loginText: { fontSize: 14, color: colors.mutedForeground, fontFamily: "Inter_400Regular" },
    loginLink: { fontSize: 14, color: colors.primary, fontFamily: "Inter_600SemiBold" },
  });