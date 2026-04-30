import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  FlatList,
  Image,
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
import { ProductCard } from "@/components/ProductCard";

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const { products, vendors, inventory } = useStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryName, setSelectedCategoryName] = useState<string>("All");

  const lowStockCount = inventory.filter(i => i.stock <= 10).length;

  const filteredProducts = products.filter((p) => {
    const matchSearch =
      !searchQuery ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.vendorName ?? "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchCategory =
      selectedCategoryName === "All" ||
      (p.categoryName ?? "").toLowerCase().includes(selectedCategoryName.toLowerCase());
    return matchSearch && matchCategory;
  });

  const bestSellers = products.filter((p) => p.isBestSeller);
  const seasonalItems = products.filter((p) => p.isSeasonal);

  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : 0;

  const categoryList = ["All", "Food & Delicacies", "Handicrafts", "Home Decor", "Clothing", "Accessories"];

  return (
    <View style={[s(colors).container, { paddingBottom: bottomInset }]}>
      {/* Header */}
      <View style={[s(colors).header, { paddingTop: topInset + 12 }]}>
        <View>
          <Text style={s(colors).greeting}>
            {user ? `Hello, ${user.name.split(" ")[0]}` : "Welcome"}
          </Text>
          <Text style={s(colors).subtitle}>Legazpi Grand Central Terminal</Text>
        </View>
        {user && (
          <Pressable
            style={s(colors).notifBtn}
            onPress={() => router.push("/notifications" as any)}
          >
            <Feather name="bell" size={22} color={colors.foreground} />
            {(user.role !== "customer" && lowStockCount > 0) && (
              <View style={s(colors).notifDot} />
            )}
          </Pressable>
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Search */}
        <View style={s(colors).searchWrap}>
          <Feather name="search" size={18} color={colors.mutedForeground} style={{ marginLeft: 12 }} />
          <TextInput
            style={s(colors).searchInput}
            placeholder="Search products or vendors..."
            placeholderTextColor={colors.mutedForeground}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery("")} style={{ paddingRight: 12 }}>
              <Feather name="x" size={16} color={colors.mutedForeground} />
            </Pressable>
          )}
        </View>

        {/* Admin/Staff Alert Banner */}
        {(user?.role === "admin" || user?.role === "staff") && lowStockCount > 0 && (
          <Pressable
            style={s(colors).alertBanner}
            onPress={() => router.push("/(tabs)/inventory" as any)}
          >
            <Feather name="alert-triangle" size={16} color={colors.warning} />
            <Text style={s(colors).alertText}>
              {lowStockCount} product{lowStockCount > 1 ? "s" : ""} running low on stock
            </Text>
            <Feather name="chevron-right" size={16} color={colors.warning} />
          </Pressable>
        )}

        {/* Hero Banner */}
        <View style={s(colors).heroBanner}>
          <Image
            source={require("../../assets/images/market-banner.png")}
            style={s(colors).heroImage}
            resizeMode="cover"
          />
          <View style={s(colors).heroOverlay}>
            <View style={s(colors).heroBadge}>
              <Text style={s(colors).heroBadgeText}>LEGAZPI CITY, ALBAY</Text>
            </View>
            <Text style={s(colors).heroTitle}>Authentic Bicolano{"\n"}Pasalubong</Text>
            <Text style={s(colors).heroSub}>Directly from local vendors</Text>
          </View>
        </View>

        {/* Categories */}
        <View style={s(colors).section}>
          <Text style={s(colors).sectionTitle}>Browse by Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12 }}>
            <View style={{ flexDirection: "row", gap: 8, paddingHorizontal: 16 }}>
              {categoryList.map((cat) => (
                <Pressable
                  key={cat}
                  style={[
                    s(colors).catChip,
                    selectedCategoryName === cat && s(colors).catChipActive,
                  ]}
                  onPress={() => setSelectedCategoryName(cat)}
                >
                  <Text
                    style={[
                      s(colors).catLabel,
                      selectedCategoryName === cat && s(colors).catLabelActive,
                    ]}
                  >
                    {cat}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Best Sellers */}
        {!searchQuery && selectedCategoryName === "All" && bestSellers.length > 0 && (
          <View style={s(colors).section}>
            <View style={s(colors).sectionHeader}>
              <Text style={s(colors).sectionTitle}>Best Sellers</Text>
              <Pressable onPress={() => router.push("/(tabs)/catalog" as any)}>
                <Text style={s(colors).seeAll}>See all</Text>
              </Pressable>
            </View>
            <FlatList
              data={bestSellers}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
              renderItem={({ item }) => <ProductCard product={item} compact />}
              style={{ marginTop: 12 }}
            />
          </View>
        )}

        {/* Seasonal Items */}
        {!searchQuery && selectedCategoryName === "All" && seasonalItems.length > 0 && (
          <View style={s(colors).section}>
            <View style={s(colors).sectionHeader}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Text style={s(colors).sectionTitle}>Seasonal Picks</Text>
                <View style={[s(colors).catChipActive, { paddingHorizontal: 8, paddingVertical: 2 }]}>
                  <Text style={{ color: "#fff", fontSize: 10, fontFamily: "Inter_600SemiBold" }}>NEW</Text>
                </View>
              </View>
            </View>
            <FlatList
              data={seasonalItems}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
              renderItem={({ item }) => <ProductCard product={item} compact />}
              style={{ marginTop: 12 }}
            />
          </View>
        )}

        {/* Vendors */}
        {!searchQuery && selectedCategoryName === "All" && (
          <View style={s(colors).section}>
            <Text style={s(colors).sectionTitle}>Our Vendors</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12 }}>
              <View style={{ flexDirection: "row", gap: 12, paddingHorizontal: 16 }}>
                {vendors.map((v) => (
                  <Pressable
                    key={v.id}
                    style={s(colors).vendorCard}
                    onPress={() => router.push(`/vendor/${v.id}` as any)}
                  >
                    <View style={s(colors).vendorAvatar}>
                      <Feather name="shopping-bag" size={24} color={colors.primary} />
                    </View>
                    <Text style={s(colors).vendorName} numberOfLines={1}>{v.name}</Text>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
                      <Feather name="star" size={11} color={colors.gold} />
                      <Text style={s(colors).vendorRating}>{v.rating}</Text>
                    </View>
                    <Text style={s(colors).vendorLocation} numberOfLines={1}>{v.location}</Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          </View>
        )}

        {/* All Products Grid */}
        <View style={[s(colors).section, { paddingBottom: 0 }]}>
          <View style={s(colors).sectionHeader}>
            <Text style={s(colors).sectionTitle}>
              {searchQuery ? `Results for "${searchQuery}"` : selectedCategoryName === "All" ? "All Products" : selectedCategoryName}
            </Text>
            <Text style={s(colors).countText}>{filteredProducts.length} items</Text>
          </View>
          <View style={s(colors).productsGrid}>
            {filteredProducts.map((item) => (
              <View key={item.id} style={s(colors).productGridItem}>
                <ProductCard product={item} />
              </View>
            ))}
          </View>
          {filteredProducts.length === 0 && (
            <View style={s(colors).empty}>
              <Feather name="package" size={40} color={colors.mutedForeground} />
              <Text style={s(colors).emptyText}>No products found</Text>
              <Text style={s(colors).emptySubText}>Try a different search or category</Text>
            </View>
          )}
        </View>
      </ScrollView>
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
      paddingBottom: 12,
      backgroundColor: colors.background,
    },
    greeting: { fontSize: 22, fontFamily: "Inter_700Bold", color: colors.foreground },
    subtitle: { fontSize: 13, color: colors.mutedForeground, fontFamily: "Inter_400Regular", marginTop: 2 },
    notifBtn: { position: "relative", padding: 8 },
    notifDot: {
      position: "absolute",
      top: 8,
      right: 8,
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.primary,
      borderWidth: 1.5,
      borderColor: colors.background,
    },
    searchWrap: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.card,
      borderRadius: 12,
      marginHorizontal: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
      height: 48,
    },
    searchInput: {
      flex: 1,
      paddingHorizontal: 12,
      fontSize: 15,
      color: colors.foreground,
      fontFamily: "Inter_400Regular",
    },
    alertBanner: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginHorizontal: 16,
      marginBottom: 12,
      backgroundColor: colors.warningLight,
      borderRadius: 10,
      padding: 12,
      borderWidth: 1,
      borderColor: colors.warning + "40",
    },
    alertText: { flex: 1, color: colors.warning, fontFamily: "Inter_500Medium", fontSize: 13 },
    heroBanner: {
      marginHorizontal: 16,
      borderRadius: 16,
      overflow: "hidden",
      marginBottom: 4,
      height: 180,
    },
    heroImage: { width: "100%", height: "100%" },
    heroOverlay: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      padding: 16,
      backgroundColor: "rgba(0,0,0,0.45)",
    },
    heroBadge: {
      backgroundColor: colors.primary,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
      alignSelf: "flex-start",
      marginBottom: 6,
    },
    heroBadgeText: { color: "#fff", fontSize: 9, fontFamily: "Inter_700Bold", letterSpacing: 1 },
    heroTitle: { color: "#fff", fontSize: 20, fontFamily: "Inter_700Bold", lineHeight: 26 },
    heroSub: { color: "rgba(255,255,255,0.8)", fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
    section: { marginTop: 20, paddingHorizontal: 16 },
    sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    sectionTitle: { fontSize: 17, fontFamily: "Inter_700Bold", color: colors.foreground },
    seeAll: { fontSize: 13, color: colors.primary, fontFamily: "Inter_500Medium" },
    countText: { fontSize: 13, color: colors.mutedForeground, fontFamily: "Inter_400Regular" },
    catChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
    },
    catChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    catLabel: { fontSize: 12, color: colors.mutedForeground, fontFamily: "Inter_500Medium" },
    catLabelActive: { color: "#fff" },
    vendorCard: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 12,
      alignItems: "center",
      width: 110,
      borderWidth: 1,
      borderColor: colors.border,
    },
    vendorAvatar: {
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor: colors.secondary,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 8,
    },
    vendorName: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: colors.foreground, textAlign: "center", marginBottom: 3 },
    vendorRating: { fontSize: 11, fontFamily: "Inter_500Medium", color: colors.foreground },
    vendorLocation: { fontSize: 10, color: colors.mutedForeground, fontFamily: "Inter_400Regular", textAlign: "center", marginTop: 2 },
    productsGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 12,
      marginTop: 12,
    },
    productGridItem: { width: "47.5%" },
    empty: { alignItems: "center", paddingVertical: 48, gap: 8 },
    emptyText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: colors.mutedForeground },
    emptySubText: { fontSize: 13, color: colors.mutedForeground, fontFamily: "Inter_400Regular" },
  });
