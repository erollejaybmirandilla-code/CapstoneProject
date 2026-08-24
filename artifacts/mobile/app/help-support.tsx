import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

export default function HelpSupportScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  const faqs = [
    {
      question: "How do I place an order?",
      answer: "Browse products, add to cart, and checkout. You can pay via GCash, Maya, COD, or bank transfer.",
    },
    {
      question: "How do I become a vendor?",
      answer: "Register with a vendor account. Our team will review your application and verify your business.",
    },
    {
      question: "What payment methods are accepted?",
      answer: "We accept GCash, Maya, Cash on Delivery (COD), Bank Transfer, and 7-Eleven payment.",
    },
    {
      question: "How do I track my order?",
      answer: "Go to Orders in your profile to see real-time order status updates.",
    },
    {
      question: "Is my payment information secure?",
      answer: "Yes, all payments are processed through secure payment gateways. We do not store your payment details.",
    },
  ];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ paddingTop: topInset + 12, paddingBottom: bottomInset + 100 }}
    >
      <View style={{ paddingHorizontal: 16, marginBottom: 20 }}>
        <Pressable onPress={() => router.back()} style={{ marginBottom: 16 }}>
          <Feather name="arrow-left" size={24} color={colors.foreground} />
        </Pressable>
        <Text style={s(colors).title}>Help & Support</Text>
        <Text style={s(colors).subtitle}>How can we help you today?</Text>
      </View>

      {faqs.map((faq, index) => (
        <View key={index} style={s(colors).faqCard}>
          <View style={s(colors).faqHeader}>
            <Feather name="help-circle" size={18} color={colors.primary} />
            <Text style={s(colors).faqQuestion}>{faq.question}</Text>
          </View>
          <Text style={s(colors).faqAnswer}>{faq.answer}</Text>
        </View>
      ))}

      <View style={s(colors).contactSection}>
        <Text style={s(colors).contactTitle}>Still need help?</Text>
        <View style={s(colors).contactCard}>
          <Feather name="mail" size={20} color={colors.primary} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={s(colors).contactLabel}>Email Support</Text>
            <Text style={s(colors).contactValue}>support@legazpimarket.ph</Text>
          </View>
        </View>
        <View style={s(colors).contactCard}>
          <Feather name="phone" size={20} color={colors.primary} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={s(colors).contactLabel}>Hotline</Text>
            <Text style={s(colors).contactValue}>(052) 123-4567</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const s = (colors: any) =>
  StyleSheet.create({
    title: { fontSize: 28, fontFamily: "Inter_700Bold", color: colors.foreground },
    subtitle: { fontSize: 14, color: colors.mutedForeground, fontFamily: "Inter_400Regular", marginTop: 4 },
    faqCard: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      marginHorizontal: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    faqHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      marginBottom: 8,
    },
    faqQuestion: { flex: 1, fontSize: 15, fontFamily: "Inter_600SemiBold", color: colors.foreground },
    faqAnswer: { fontSize: 14, fontFamily: "Inter_400Regular", color: colors.mutedForeground, lineHeight: 20, marginLeft: 28 },
    contactSection: { marginHorizontal: 16, marginTop: 8 },
    contactTitle: { fontSize: 18, fontFamily: "Inter_700Bold", color: colors.foreground, marginBottom: 12 },
    contactCard: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: colors.border,
    },
    contactLabel: { fontSize: 12, fontFamily: "Inter_500Medium", color: colors.mutedForeground, textTransform: "uppercase" },
    contactValue: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: colors.foreground, marginTop: 2 },
  });
