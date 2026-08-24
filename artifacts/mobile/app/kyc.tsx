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
import { useStore } from "@/context/StoreContext";

const ID_TYPES = [
  "Philippine National ID",
  "Passport",
  "Driver's License",
  "SSS ID",
  "UMID",
  "PhilHealth ID",
  "Voter's ID",
  "Postal ID",
];

const STEPS = [
  { id: 1, title: "Personal Information", icon: "user" },
  { id: 2, title: "Government ID Upload", icon: "credit-card" },
  { id: 3, title: "Face Verification", icon: "camera" },
];

export default function KYCScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, refreshUser } = useAuth();
  const { submitKyc } = useStore();

  const [step, setStep] = useState(1);
  const [fullName, setFullName] = useState(user?.name ?? "");
  const [address, setAddress] = useState("");
  const [idType, setIdType] = useState(ID_TYPES[0]);
  const [idNumber, setIdNumber] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [faceScanned, setFaceScanned] = useState(false);

  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  if (user?.kycStatus === "approved") {
    return (
      <View style={[s(colors).container, { alignItems: "center", justifyContent: "center" }]}>
        <View style={s(colors).successCircle}>
          <Feather name="check" size={40} color="#fff" />
        </View>
        <Text style={s(colors).successTitle}>Already Verified!</Text>
        <Text style={s(colors).successSub}>Your identity has been successfully verified.</Text>
        <Pressable style={s(colors).primaryBtn} onPress={() => router.replace("/(tabs)" as any)}>
          <Text style={s(colors).primaryBtnText}>Go to Home</Text>
        </Pressable>
      </View>
    );
  }

  const handleNext = () => {
    if (step === 1) {
      if (!fullName.trim() || !address.trim()) {
        Alert.alert("Required", "Please fill in all fields.");
        return;
      }
    }
    if (step === 2) {
      if (!idNumber.trim()) {
        Alert.alert("Required", "Please enter your ID number.");
        return;
      }
    }
    if (step < 3) setStep((s) => s + 1);
    else handleSubmit();
  };

  const handleFaceScan = () => {
    setVerifying(true);
    setTimeout(() => {
      setVerifying(false);
      setFaceScanned(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, 2500);
  };

  const handleSubmit = async () => {
    if (!faceScanned) {
      Alert.alert("Face Scan Required", "Please complete the face verification step.");
      return;
    }
    setVerifying(true);
    try {
      await submitKyc({
        firstName: fullName.split(" ")[0] || fullName,
        lastName: fullName.split(" ").slice(1).join(" ") || "",
        birthDate: "",
        address,
        idType,
        idNumber,
      });
      await refreshUser();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        "KYC Submitted!",
        "Your verification is being reviewed. This usually takes 1-2 business days.",
        [{ text: "Continue Shopping", onPress: () => router.replace("/(tabs)" as any) }]
      );
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to submit KYC");
    } finally {
      setVerifying(false);
    }
  };

  return (
    <ScrollView
      style={[s(colors).container, { paddingTop: topInset }]}
      contentContainerStyle={{ paddingBottom: bottomInset + 40 }}
      keyboardShouldPersistTaps="handled"
    >
      {/* Header */}
      <View style={s(colors).header}>
        <Pressable onPress={() => router.back()} style={s(colors).backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={s(colors).headerTitle}>KYC Verification</Text>
        <View style={{ width: 38 }} />
      </View>

      {/* Progress */}
      <View style={s(colors).progressRow}>
        {STEPS.map((st, idx) => (
          <React.Fragment key={st.id}>
            <View style={[s(colors).stepDot, step >= st.id && s(colors).stepDotActive]}>
              {step > st.id ? (
                <Feather name="check" size={14} color="#fff" />
              ) : (
                <Text style={[s(colors).stepNum, step >= st.id && { color: "#fff" }]}>{st.id}</Text>
              )}
            </View>
            {idx < STEPS.length - 1 && (
              <View style={[s(colors).stepLine, step > st.id && s(colors).stepLineActive]} />
            )}
          </React.Fragment>
        ))}
      </View>
      <Text style={s(colors).stepTitle}>{STEPS[step - 1].title}</Text>

      {/* Step 1: Personal Info */}
      {step === 1 && (
        <View style={s(colors).card}>
          <View style={s(colors).infoHeader}>
            <Feather name="user" size={20} color={colors.primary} />
            <Text style={s(colors).cardTitle}>Personal Information</Text>
          </View>
          <Text style={s(colors).cardSub}>We need to verify your identity for secure transactions.</Text>
          <View style={s(colors).fieldWrap}>
            <Text style={s(colors).label}>Full Name (as in ID)</Text>
            <View style={s(colors).inputWrap}>
              <TextInput style={s(colors).input} value={fullName} onChangeText={setFullName} placeholder="Juan M. dela Cruz" placeholderTextColor={colors.mutedForeground} />
            </View>
          </View>
          <View style={s(colors).fieldWrap}>
            <Text style={s(colors).label}>Complete Address</Text>
            <View style={[s(colors).inputWrap, { height: 80, alignItems: "flex-start", paddingTop: 12 }]}>
              <TextInput style={[s(colors).input, { textAlignVertical: "top" }]} value={address} onChangeText={setAddress} placeholder="Barangay, City, Province" placeholderTextColor={colors.mutedForeground} multiline />
            </View>
          </View>
        </View>
      )}

      {/* Step 2: ID Upload */}
      {step === 2 && (
        <View style={s(colors).card}>
          <View style={s(colors).infoHeader}>
            <Feather name="credit-card" size={20} color={colors.primary} />
            <Text style={s(colors).cardTitle}>Government ID</Text>
          </View>
          <Text style={s(colors).cardSub}>Select and enter your valid government-issued ID details.</Text>
          <Text style={s(colors).label}>ID Type</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
            <View style={{ flexDirection: "row", gap: 8 }}>
              {ID_TYPES.map((type) => (
                <Pressable
                  key={type}
                  style={[s(colors).idChip, idType === type && s(colors).idChipActive]}
                  onPress={() => setIdType(type)}
                >
                  <Text style={[s(colors).idChipText, idType === type && { color: "#fff" }]}>{type}</Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
          <View style={s(colors).fieldWrap}>
            <Text style={s(colors).label}>ID Number</Text>
            <View style={s(colors).inputWrap}>
              <TextInput style={s(colors).input} value={idNumber} onChangeText={setIdNumber} placeholder="Enter your ID number" placeholderTextColor={colors.mutedForeground} autoCapitalize="characters" />
            </View>
          </View>
          <Pressable style={s(colors).uploadBox}>
            <Feather name="upload" size={24} color={colors.primary} />
            <Text style={s(colors).uploadTitle}>Upload ID (Front)</Text>
            <Text style={s(colors).uploadSub}>Tap to take a photo or choose from gallery</Text>
          </Pressable>
          <Pressable style={s(colors).uploadBox}>
            <Feather name="upload" size={24} color={colors.primary} />
            <Text style={s(colors).uploadTitle}>Upload ID (Back)</Text>
            <Text style={s(colors).uploadSub}>Tap to take a photo or choose from gallery</Text>
          </Pressable>
        </View>
      )}

      {/* Step 3: Face Verification */}
      {step === 3 && (
        <View style={s(colors).card}>
          <View style={s(colors).infoHeader}>
            <Feather name="camera" size={20} color={colors.primary} />
            <Text style={s(colors).cardTitle}>Face Verification</Text>
          </View>
          <Text style={s(colors).cardSub}>Take a selfie to verify your identity matches your ID.</Text>
          <Pressable
            style={[s(colors).faceBox, faceScanned && s(colors).faceBoxDone]}
            onPress={handleFaceScan}
            disabled={verifying || faceScanned}
          >
            {faceScanned ? (
              <>
                <View style={s(colors).successCircleSmall}>
                  <Feather name="check" size={28} color="#fff" />
                </View>
                <Text style={[s(colors).uploadTitle, { color: colors.success }]}>Face Verified!</Text>
                <Text style={[s(colors).uploadSub, { color: colors.success + "aa" }]}>Match score: 98.4%</Text>
              </>
            ) : verifying ? (
              <>
                <Feather name="loader" size={32} color={colors.primary} />
                <Text style={s(colors).uploadTitle}>Analyzing...</Text>
                <Text style={s(colors).uploadSub}>Processing your face scan</Text>
              </>
            ) : (
              <>
                <View style={s(colors).faceIcon}>
                  <Feather name="camera" size={32} color={colors.primary} />
                </View>
                <Text style={s(colors).uploadTitle}>Take Selfie</Text>
                <Text style={s(colors).uploadSub}>Face the camera and tap to scan</Text>
              </>
            )}
          </Pressable>
          <View style={s(colors).tipBox}>
            <Text style={s(colors).tipTitle}>Tips for a good scan:</Text>
            {["Good lighting on your face", "Remove glasses or hats", "Look directly at the camera", "Keep face centered in frame"].map((tip) => (
              <View key={tip} style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 }}>
                <Feather name="check" size={12} color={colors.success} />
                <Text style={s(colors).tipText}>{tip}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Navigation */}
      <View style={s(colors).navRow}>
        {step > 1 && (
          <Pressable style={s(colors).backNavBtn} onPress={() => setStep((s) => s - 1)}>
            <Feather name="arrow-left" size={16} color={colors.primary} />
            <Text style={s(colors).backNavText}>Back</Text>
          </Pressable>
        )}
        <Pressable
          style={[s(colors).primaryBtn, { flex: 1 }, verifying && { opacity: 0.6 }]}
          onPress={handleNext}
          disabled={verifying}
        >
          <Text style={s(colors).primaryBtnText}>
            {step === 3 ? (verifying ? "Submitting..." : "Submit Verification") : "Continue"}
          </Text>
          {!verifying && <Feather name="arrow-right" size={16} color="#fff" />}
        </Pressable>
      </View>
    </ScrollView>
  );
}

const s = (colors: ReturnType<typeof useColors>) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12 },
    backBtn: { padding: 6, borderRadius: 8 },
    headerTitle: { fontSize: 17, fontFamily: "Inter_700Bold", color: colors.foreground },
    progressRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingHorizontal: 32, marginBottom: 8 },
    stepDot: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.muted, borderWidth: 2, borderColor: colors.border, alignItems: "center", justifyContent: "center" },
    stepDotActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    stepNum: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: colors.mutedForeground },
    stepLine: { flex: 1, height: 2, backgroundColor: colors.border, marginHorizontal: 4 },
    stepLineActive: { backgroundColor: colors.primary },
    stepTitle: { textAlign: "center", fontSize: 13, fontFamily: "Inter_500Medium", color: colors.mutedForeground, marginBottom: 16 },
    card: { marginHorizontal: 16, backgroundColor: colors.card, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: colors.border, gap: 14, marginBottom: 16 },
    infoHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
    cardTitle: { fontSize: 17, fontFamily: "Inter_700Bold", color: colors.foreground },
    cardSub: { fontSize: 13, color: colors.mutedForeground, fontFamily: "Inter_400Regular", marginTop: -6 },
    fieldWrap: { gap: 6 },
    label: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: colors.foreground },
    inputWrap: { borderWidth: 1, borderColor: colors.border, borderRadius: 12, backgroundColor: colors.background, height: 52, justifyContent: "center" },
    input: { flex: 1, paddingHorizontal: 14, fontSize: 15, color: colors.foreground, fontFamily: "Inter_400Regular" },
    idChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, backgroundColor: colors.secondary, borderWidth: 1, borderColor: colors.border },
    idChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    idChipText: { fontSize: 12, fontFamily: "Inter_500Medium", color: colors.foreground },
    uploadBox: { borderWidth: 2, borderColor: colors.border, borderStyle: "dashed", borderRadius: 12, padding: 20, alignItems: "center", gap: 8 },
    uploadTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: colors.foreground },
    uploadSub: { fontSize: 12, color: colors.mutedForeground, fontFamily: "Inter_400Regular", textAlign: "center" },
    faceBox: { borderWidth: 2, borderColor: colors.primary + "40", borderRadius: 12, padding: 32, alignItems: "center", gap: 12, backgroundColor: colors.secondary },
    faceBoxDone: { borderColor: colors.success, backgroundColor: colors.successLight },
    faceIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.card, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: colors.border },
    successCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.success, alignItems: "center", justifyContent: "center", marginBottom: 20 },
    successCircleSmall: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.success, alignItems: "center", justifyContent: "center" },
    successTitle: { fontSize: 22, fontFamily: "Inter_700Bold", color: colors.foreground, textAlign: "center" },
    successSub: { fontSize: 14, color: colors.mutedForeground, fontFamily: "Inter_400Regular", textAlign: "center", marginBottom: 24, paddingHorizontal: 32 },
    tipBox: { backgroundColor: colors.muted, borderRadius: 10, padding: 12, gap: 2 },
    tipTitle: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: colors.foreground, marginBottom: 4 },
    tipText: { fontSize: 12, color: colors.mutedForeground, fontFamily: "Inter_400Regular" },
    navRow: { flexDirection: "row", gap: 10, paddingHorizontal: 16, marginTop: 8 },
    backNavBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 16, paddingVertical: 16, borderRadius: 14, borderWidth: 1, borderColor: colors.border },
    backNavText: { fontSize: 15, fontFamily: "Inter_500Medium", color: colors.primary },
    primaryBtn: { backgroundColor: colors.primary, borderRadius: 14, paddingVertical: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
    primaryBtnText: { color: "#fff", fontFamily: "Inter_700Bold", fontSize: 16 },
  });
