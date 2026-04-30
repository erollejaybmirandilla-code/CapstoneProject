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
import { useCart } from "@/context/CartContext";
import { useStore } from "@/context/StoreContext";

const PAYMENT_METHODS = [
  { id: "gcash", label: "GCash", icon: "smartphone", color: "#007CE8" },
  { id: "maya", label: "Maya", icon: "credit-card", color: "#00BFA5" },
  { id: "cod", label: "Cash on Delivery", icon: "dollar-sign", color: "#059669" },
  { id: "bank", label: "Bank Transfer (InstaPay)", icon: "landmark", color: "#7C3AED" },
  { id: "otc", label: "Over-the-Counter (7-Eleven)", icon: "shopping-bag", color: "#F59E0B" },
];

const DELIVERY_METHODS = [
  { id: "pickup", label: "Store Pickup", icon: "map-pin", eta: "Ready in 30 min" },
  { id: "same_day", label: "Same-day Delivery (Lalamove)", icon: "truck", eta: "2-4 hours" },
  { id: "jnt", label: "J&T Express", icon: "package", eta: "2-3 days" },
  { id: "lbc", label: "LBC", icon: "package", eta: "2-5 days" },
  { id: "hotel", label: "Hotel Drop-off", icon: "home", eta: "As arranged" },
];

export default function CheckoutScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const { items, totalAmount, clearCart } = useCart();
  const { placeOrder } = useStore();

  const [paymentMethod, setPaymentMethod] = useState("gcash");
  const [deliveryMethod, setDeliveryMethod] = useState("pickup");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [placing, setPlacing] = useState(false);

  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;
  const deliveryFee = deliveryMethod === "pickup" ? 0 : deliveryMethod === "same_day" ? 80 : 50;
  const grandTotal = totalAmount + deliveryFee;

  const handlePlaceOrder = () => {
    if (!user) return;
    if (deliveryMethod !== "pickup" && !deliveryAddress.trim()) {
      Alert.alert("Address Required", "Please enter a delivery address.");
      return;
    }

    // Group items by vendor
    const byVendor: Record<string, typeof items> = {};
    items.forEach((item) => {
      if (!byVendor[item.vendorId]) byVendor[item.vendorId] = [];
      byVendor[item.vendorId].push(item);
    });

    const vendorId = Object.keys(byVendor)[0];
    const vendorItems = byVendor[vendorId];
    const vendorName = vendorItems[0].vendorName;

    setPlacing(true);
    setTimeout(() => {
      const order = placeOrder({
        customerId: user.id,
        customerName: user.name,
        vendorId,
        vendorName,
        items: vendorItems.map((i) => ({
          productId: i.productId,
          name: i.name,
          price: i.price,
          quantity: i.quantity,
        })),
        totalAmount: grandTotal,
        paymentMethod: PAYMENT_METHODS.find((p) => p.id === paymentMethod)?.label ?? paymentMethod,
        paymentStatus: "paid",
        orderStatus: "pending",
        deliveryMethod: DELIVERY_METHODS.find((d) => d.id === deliveryMethod)?.label ?? deliveryMethod,
        deliveryAddress: deliveryAddress || undefined,
      });
      clearCart();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setPlacing(false);
      Alert.alert(
        "Order Placed!",
        `Order #${order.id.slice(-6).toUpperCase()} has been placed successfully. ${PAYMENT_METHODS.find((p) => p.id === paymentMethod)?.label} payment confirmed.`,
        [{ text: "Track Order", onPress: () => router.replace("/(tabs)/orders" as any) }]
      );
    }, 1500);
  };

  return (
    <View style={[s(colors).container]}>
      <View style={[s(colors).header, { paddingTop: topInset + 12 }]}>
        <Pressable onPress={() => router.back()} style={s(colors).backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={s(colors).title}>Checkout</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: bottomInset + 120 }}>
        {/* Order Summary */}
        <View style={s(colors).section}>
          <Text style={s(colors).sectionTitle}>Order Summary</Text>
          {items.map((item) => (
            <View key={item.productId} style={s(colors).itemRow}>
              <Text style={s(colors).itemName} numberOfLines={1}>{item.name}</Text>
              <Text style={s(colors).itemQty}>x{item.quantity}</Text>
              <Text style={s(colors).itemPrice}>₱{(item.price * item.quantity).toLocaleString()}</Text>
            </View>
          ))}
        </View>

        {/* Payment Method */}
        <View style={s(colors).section}>
          <Text style={s(colors).sectionTitle}>Payment Method</Text>
          <View style={s(colors).optionGrid}>
            {PAYMENT_METHODS.map((pm) => (
              <Pressable
                key={pm.id}
                style={[s(colors).optionCard, paymentMethod === pm.id && s(colors).optionCardActive]}
                onPress={() => setPaymentMethod(pm.id)}
              >
                <View style={[s(colors).optionIcon, { backgroundColor: pm.color + "15" }]}>
                  <Feather name={pm.icon as any} size={18} color={pm.color} />
                </View>
                <Text style={[s(colors).optionLabel, paymentMethod === pm.id && { color: colors.primary, fontFamily: "Inter_600SemiBold" }]} numberOfLines={2}>
                  {pm.label}
                </Text>
                {paymentMethod === pm.id && (
                  <View style={s(colors).checkDot}>
                    <Feather name="check" size={10} color="#fff" />
                  </View>
                )}
              </Pressable>
            ))}
          </View>
        </View>

        {/* Delivery Method */}
        <View style={s(colors).section}>
          <Text style={s(colors).sectionTitle}>Delivery Method</Text>
          {DELIVERY_METHODS.map((dm) => (
            <Pressable
              key={dm.id}
              style={[s(colors).deliveryRow, deliveryMethod === dm.id && s(colors).deliveryRowActive]}
              onPress={() => setDeliveryMethod(dm.id)}
            >
              <View style={[s(colors).deliveryIcon, deliveryMethod === dm.id && { backgroundColor: colors.primary + "15" }]}>
                <Feather name={dm.icon as any} size={16} color={deliveryMethod === dm.id ? colors.primary : colors.mutedForeground} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s(colors).deliveryLabel, deliveryMethod === dm.id && { color: colors.primary, fontFamily: "Inter_600SemiBold" }]}>{dm.label}</Text>
                <Text style={s(colors).deliveryEta}>{dm.eta}</Text>
              </View>
              <View style={[s(colors).radio, deliveryMethod === dm.id && s(colors).radioActive]}>
                {deliveryMethod === dm.id && <View style={s(colors).radioDot} />}
              </View>
            </Pressable>
          ))}
        </View>

        {/* Address field for non-pickup */}
        {deliveryMethod !== "pickup" && (
          <View style={s(colors).section}>
            <Text style={s(colors).sectionTitle}>Delivery Address</Text>
            <View style={[s(colors).inputWrap, { height: 80, alignItems: "flex-start", paddingTop: 12 }]}>
              <TextInput
                style={[s(colors).input, { textAlignVertical: "top" }]}
                placeholder="Enter complete delivery address..."
                placeholderTextColor={colors.mutedForeground}
                value={deliveryAddress}
                onChangeText={setDeliveryAddress}
                multiline
              />
            </View>
          </View>
        )}

        {/* Price breakdown */}
        <View style={s(colors).priceBreakdown}>
          <View style={s(colors).priceRow}>
            <Text style={s(colors).priceLabel}>Subtotal</Text>
            <Text style={s(colors).priceValue}>₱{totalAmount.toLocaleString()}</Text>
          </View>
          <View style={s(colors).priceRow}>
            <Text style={s(colors).priceLabel}>Delivery Fee</Text>
            <Text style={s(colors).priceValue}>{deliveryFee === 0 ? "FREE" : `₱${deliveryFee}`}</Text>
          </View>
          <View style={[s(colors).priceRow, { borderTopWidth: 1, borderTopColor: colors.border, marginTop: 8, paddingTop: 8 }]}>
            <Text style={[s(colors).priceLabel, { fontSize: 16, fontFamily: "Inter_700Bold", color: colors.foreground }]}>Total</Text>
            <Text style={[s(colors).priceValue, { fontSize: 20, fontFamily: "Inter_700Bold", color: colors.primary }]}>₱{grandTotal.toLocaleString()}</Text>
          </View>
        </View>

        {/* Security note */}
        <View style={s(colors).securityNote}>
          <Feather name="lock" size={12} color={colors.mutedForeground} />
          <Text style={s(colors).securityText}>256-bit SSL encryption. Your payment is secure.</Text>
        </View>
      </ScrollView>

      {/* Place Order Button */}
      <View style={[s(colors).bottomBar, { paddingBottom: bottomInset + 12 }]}>
        <Pressable
          style={({ pressed }) => [s(colors).placeBtn, pressed && { opacity: 0.85 }, placing && { opacity: 0.6 }]}
          onPress={handlePlaceOrder}
          disabled={placing}
        >
          <Feather name={placing ? "loader" : "check-circle"} size={20} color="#fff" />
          <Text style={s(colors).placeBtnText}>
            {placing ? "Processing Payment..." : `Place Order • ₱${grandTotal.toLocaleString()}`}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const s = (colors: ReturnType<typeof useColors>) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 12 },
    backBtn: { padding: 6 },
    title: { fontSize: 20, fontFamily: "Inter_700Bold", color: colors.foreground },
    section: { marginBottom: 20 },
    sectionTitle: { fontSize: 15, fontFamily: "Inter_700Bold", color: colors.foreground, marginBottom: 12 },
    itemRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 6 },
    itemName: { flex: 1, fontSize: 14, color: colors.foreground, fontFamily: "Inter_400Regular" },
    itemQty: { fontSize: 13, color: colors.mutedForeground, fontFamily: "Inter_500Medium", width: 28, textAlign: "center" },
    itemPrice: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: colors.foreground, width: 80, textAlign: "right" },
    optionGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
    optionCard: {
      width: "30%",
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 10,
      alignItems: "center",
      gap: 6,
      borderWidth: 1.5,
      borderColor: colors.border,
      position: "relative",
    },
    optionCardActive: { borderColor: colors.primary, backgroundColor: colors.primary + "08" },
    optionIcon: { width: 40, height: 40, borderRadius: 10, alignItems: "center", justifyContent: "center" },
    optionLabel: { fontSize: 10, color: colors.mutedForeground, fontFamily: "Inter_400Regular", textAlign: "center" },
    checkDot: { position: "absolute", top: 6, right: 6, width: 16, height: 16, borderRadius: 8, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
    deliveryRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      padding: 14,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: colors.border,
      marginBottom: 8,
      backgroundColor: colors.card,
    },
    deliveryRowActive: { borderColor: colors.primary, backgroundColor: colors.primary + "05" },
    deliveryIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: colors.muted, alignItems: "center", justifyContent: "center" },
    deliveryLabel: { fontSize: 14, fontFamily: "Inter_500Medium", color: colors.foreground },
    deliveryEta: { fontSize: 11, color: colors.mutedForeground, fontFamily: "Inter_400Regular", marginTop: 2 },
    radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: colors.border, alignItems: "center", justifyContent: "center" },
    radioActive: { borderColor: colors.primary },
    radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },
    inputWrap: { borderWidth: 1, borderColor: colors.border, borderRadius: 12, backgroundColor: colors.card, paddingHorizontal: 14 },
    input: { color: colors.foreground, fontSize: 14, fontFamily: "Inter_400Regular", flex: 1 },
    priceBreakdown: { backgroundColor: colors.card, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: colors.border, gap: 8, marginBottom: 12 },
    priceRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    priceLabel: { fontSize: 14, color: colors.mutedForeground, fontFamily: "Inter_400Regular" },
    priceValue: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: colors.foreground },
    securityNote: { flexDirection: "row", alignItems: "center", gap: 6, justifyContent: "center", marginBottom: 8 },
    securityText: { fontSize: 11, color: colors.mutedForeground, fontFamily: "Inter_400Regular" },
    bottomBar: { position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: colors.card, borderTopWidth: 1, borderTopColor: colors.border, paddingHorizontal: 16, paddingTop: 12 },
    placeBtn: { backgroundColor: colors.primary, borderRadius: 14, height: 56, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10 },
    placeBtnText: { color: "#fff", fontFamily: "Inter_700Bold", fontSize: 16 },
  });
