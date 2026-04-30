import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useColors } from "@/hooks/useColors";

interface Props {
  stock: number;
  minThreshold: number;
}

export function StockBadge({ stock, minThreshold }: Props) {
  const colors = useColors();
  const isOut = stock === 0;
  const isLow = !isOut && stock <= minThreshold;

  if (isOut) {
    return (
      <View style={[styles.badge, { backgroundColor: colors.destructive + "15" }]}>
        <Feather name="x-circle" size={12} color={colors.destructive} />
        <Text style={[styles.text, { color: colors.destructive }]}>Out of Stock</Text>
      </View>
    );
  }
  if (isLow) {
    return (
      <View style={[styles.badge, { backgroundColor: colors.warningLight }]}>
        <Feather name="alert-triangle" size={12} color={colors.warning} />
        <Text style={[styles.text, { color: colors.warning }]}>Low Stock: {stock}</Text>
      </View>
    );
  }
  return (
    <View style={[styles.badge, { backgroundColor: colors.successLight }]}>
      <Feather name="check-circle" size={12} color={colors.success} />
      <Text style={[styles.text, { color: colors.success }]}>{stock} in stock</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  text: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
});
