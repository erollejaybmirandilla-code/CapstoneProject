import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import {
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
import { useStore, ProductCategory } from "@/context/StoreContext";
import { ProductCard } from "@/components/ProductCard";

const CATEGORIES: Array<ProductCategory | "All"> = [
  "All",
  "Food & Delicacies",
  "Handicrafts",
  "Apparel",
  "Keychains & Magnets",
  "Seasonal Items",
];

type SortOption = "name" | "price_asc" | "price_desc" | "rating" | "stock";

export default function CatalogScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { products, vendors } = useStore();

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<ProductCategory | "All">("All");
  const [vendorFilter, setVendorFilter] = useState("all");
  const [sort, setSort] = useState<SortOption>("rating");
  const [showFilters, setShowFilters] = useState(false);
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [showBestSellers, setShowBestSellers] = useState(false);
  const [showSeasonal, setShowSeasonal] = useState(false);

  const topInset = Platform.OS === "web" ? 67 : insets.top;

  const filtered = products
    .filter((p) => {
      if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !p.vendorName.toLowerCase().includes(search.toLowerCase())) return false;
      if (category !== "All" && p.category !== category) return false;
      if (vendorFilter !== "all" && p.vendorId !== vendorFilter) return false;
      if (maxPrice && p.price > maxPrice) return false;
      if (showBestSellers && !p.isBestSeller) return false;
      if (showSeasonal && !p.isSeasonal) return false;
      return true;
    })
    .sort((a, b) => {
      if (sort === "price_asc") return a.price - b.price;
      if (sort === "price_desc") return b.price - a.price;
      if (sort === "rating") return b.rating - a.rating;
      if (sort === "stock") return b.stock - a.stock;
      return a.name.localeCompare(b.name);
    });

  return (
    <View style={[s(colors).container]}>
      {/* Header */}
      <View style={[s(colors).header, { paddingTop: topInset + 12 }]}>
        <Text style={s(colors).title}>Product Catalog</Text>
        <Pressable
          style={[s(colors).filterBtn, showFilters && s(colors).filterBtnActive]}
          onPress={() => setShowFilters((prev) => !prev)}
        >
          <Feather name="sliders" size={16} color={showFilters ? colors.primaryForeground : colors.primary} />
          <Text style={[s(colors).filterBtnText, showFilters && { color: colors.primaryForeground }]}>Filters</Text>
        </Pressable>
      </View>

      {/* Search */}
      <View style={s(colors).searchWrap}>
        <Feather name="search" size={16} color={colors.mutedForeground} style={{ marginLeft: 12 }} />
        <TextInput
          style={s(colors).searchInput}
          placeholder="Search products..."
          placeholderTextColor={colors.mutedForeground}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <Pressable onPress={() => setSearch("")} style={{ paddingRight: 12 }}>
            <Feather name="x" size={14} color={colors.mutedForeground} />
          </Pressable>
        )}
      </View>

      {/* Category scroll */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s(colors).catScroll} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
        {CATEGORIES.map((cat) => (
          <Pressable
            key={cat}
            style={[s(colors).catChip, category === cat && s(colors).catChipActive]}
            onPress={() => setCategory(cat)}
          >
            <Text style={[s(colors).catLabel, category === cat && s(colors).catLabelActive]} numberOfLines={1}>
              {cat}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Filters panel */}
      {showFilters && (
        <View style={s(colors).filterPanel}>
          <Text style={s(colors).filterSectionTitle}>Sort by</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {([["rating", "Top Rated"], ["price_asc", "Price: Low to High"], ["price_desc", "Price: High to Low"], ["name", "Name"], ["stock", "In Stock"]] as [SortOption, string][]).map(([val, label]) => (
              <Pressable key={val} style={[s(colors).sortChip, sort === val && s(colors).sortChipActive]} onPress={() => setSort(val)}>
                <Text style={[s(colors).sortLabel, sort === val && s(colors).sortLabelActive]}>{label}</Text>
              </Pressable>
            ))}
          </ScrollView>
          <Text style={[s(colors).filterSectionTitle, { marginTop: 10 }]}>Vendor</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            <Pressable style={[s(colors).sortChip, vendorFilter === "all" && s(colors).sortChipActive]} onPress={() => setVendorFilter("all")}>
              <Text style={[s(colors).sortLabel, vendorFilter === "all" && s(colors).sortLabelActive]}>All Vendors</Text>
            </Pressable>
            {vendors.map((v) => (
              <Pressable key={v.id} style={[s(colors).sortChip, vendorFilter === v.id && s(colors).sortChipActive]} onPress={() => setVendorFilter(v.id)}>
                <Text style={[s(colors).sortLabel, vendorFilter === v.id && s(colors).sortLabelActive]}>{v.name}</Text>
              </Pressable>
            ))}
          </ScrollView>
          <View style={{ flexDirection: "row", gap: 8, marginTop: 10 }}>
            <Pressable
              style={[s(colors).toggleChip, showBestSellers && s(colors).toggleChipActive]}
              onPress={() => setShowBestSellers((v) => !v)}
            >
              <Feather name="trending-up" size={12} color={showBestSellers ? "#fff" : colors.primary} />
              <Text style={[s(colors).sortLabel, showBestSellers && s(colors).sortLabelActive]}>Best Sellers</Text>
            </Pressable>
            <Pressable
              style={[s(colors).toggleChip, showSeasonal && s(colors).toggleChipActive]}
              onPress={() => setShowSeasonal((v) => !v)}
            >
              <Feather name="sun" size={12} color={showSeasonal ? "#fff" : colors.primary} />
              <Text style={[s(colors).sortLabel, showSeasonal && s(colors).sortLabelActive]}>Seasonal</Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* Results count */}
      <Text style={s(colors).resultCount}>{filtered.length} products found</Text>

      {/* Product Grid */}
      <ScrollView contentContainerStyle={s(colors).grid} showsVerticalScrollIndicator={false}>
        {filtered.map((item) => (
          <View key={item.id} style={s(colors).gridItem}>
            <ProductCard product={item} />
          </View>
        ))}
        {filtered.length === 0 && (
          <View style={s(colors).empty}>
            <Feather name="search" size={40} color={colors.mutedForeground} />
            <Text style={s(colors).emptyText}>No products found</Text>
            <Text style={s(colors).emptySubText}>Adjust your filters</Text>
          </View>
        )}
        <View style={{ height: 100 }} />
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
    },
    title: { fontSize: 22, fontFamily: "Inter_700Bold", color: colors.foreground },
    filterBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.primary,
    },
    filterBtnActive: { backgroundColor: colors.primary },
    filterBtnText: { color: colors.primary, fontFamily: "Inter_500Medium", fontSize: 13 },
    searchWrap: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.card,
      borderRadius: 12,
      marginHorizontal: 16,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: colors.border,
      height: 44,
    },
    searchInput: {
      flex: 1,
      paddingHorizontal: 10,
      fontSize: 14,
      color: colors.foreground,
      fontFamily: "Inter_400Regular",
    },
    catScroll: { marginBottom: 4 },
    catChip: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
    },
    catChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    catLabel: { fontSize: 12, color: colors.mutedForeground, fontFamily: "Inter_500Medium" },
    catLabelActive: { color: colors.primaryForeground },
    filterPanel: {
      marginHorizontal: 16,
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 14,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 8,
    },
    filterSectionTitle: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: colors.mutedForeground, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 },
    sortChip: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
      backgroundColor: colors.secondary,
    },
    sortChipActive: { backgroundColor: colors.primary },
    sortLabel: { fontSize: 12, color: colors.foreground, fontFamily: "Inter_400Regular" },
    sortLabelActive: { color: "#fff", fontFamily: "Inter_500Medium" },
    toggleChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
      backgroundColor: colors.secondary,
    },
    toggleChipActive: { backgroundColor: colors.primary },
    resultCount: { paddingHorizontal: 16, paddingVertical: 6, fontSize: 12, color: colors.mutedForeground, fontFamily: "Inter_400Regular" },
    grid: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 16, gap: 12 },
    gridItem: { width: "47.5%" },
    empty: { width: "100%", alignItems: "center", paddingVertical: 60, gap: 8 },
    emptyText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: colors.mutedForeground },
    emptySubText: { fontSize: 13, color: colors.mutedForeground, fontFamily: "Inter_400Regular" },
  });
