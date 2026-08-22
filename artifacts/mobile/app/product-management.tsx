import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import { useStore } from "@/context/StoreContext";
import { useAuth } from "@/context/AuthContext";
import type { Product } from "@/lib/api";

type ProductFormData = {
  name: string;
  description: string;
  price: string;
  compareAtPrice: string;
  unit: string;
  stock: string;
  sku: string;
  categoryId: string;
  vendorId: string;
  weight: string;
  ingredients: string;
  expirationMonths: string;
  tags: string;
  isBestSeller: boolean;
  isSeasonal: boolean;
};

const emptyForm: ProductFormData = {
  name: "",
  description: "",
  price: "",
  compareAtPrice: "",
  unit: "piece",
  stock: "0",
  sku: "",
  categoryId: "",
  vendorId: "",
  weight: "",
  ingredients: "",
  expirationMonths: "",
  tags: "",
  isBestSeller: false,
  isSeasonal: false,
};

export default function ProductManagementScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const {
    products,
    categories,
    vendors,
    selectedProduct,
    isLoadingProducts,
    isManagingProduct,
    fetchProducts,
    fetchCategories,
    fetchVendors,
    fetchProductForEdit,
    createProduct,
    updateProduct,
    deleteProduct,
    uploadImage,
    removeProductImage,
  } = useStore();

  const [form, setForm] = useState<ProductFormData>(emptyForm);
  const [isEditing, setIsEditing] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchProducts({ limit: "100" });
    fetchCategories();
    fetchVendors();
  }, []);

  if (!user || (user.role !== "admin" && user.role !== "staff")) {
    return (
      <View style={[s(colors).container, { justifyContent: "center", alignItems: "center", paddingTop: insets.top }]}>
        <Feather name="lock" size={40} color={colors.mutedForeground} />
        <Text style={{ color: colors.mutedForeground, marginTop: 12, fontFamily: "Inter_500Medium" }}>Admin/Staff Access Required</Text>
      </View>
    );
  }

  const filteredProducts = products.filter((p) => {
    const matchesCategory = filterCategory === "all" || p.categoryId === filterCategory;
    const matchesSearch = !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const resetForm = () => {
    setForm(emptyForm);
    setIsEditing(false);
    setEditingProductId(null);
    setSelectedImageUri(null);
  };

  const handleCreateNew = () => {
    resetForm();
    setForm(prev => ({
      ...prev,
      vendorId: user.role === "admin" ? "" : user.vendorId || "",
    }));
    setShowForm(true);
  };

  const handleEdit = async (product: Product) => {
    await fetchProductForEdit(product.id);
    setForm({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      compareAtPrice: product.compareAtPrice?.toString() || "",
      unit: product.unit,
      stock: product.stock.toString(),
      sku: product.sku || "",
      categoryId: product.categoryId,
      vendorId: product.vendorId,
      weight: product.weight || "",
      ingredients: product.ingredients || "",
      expirationMonths: product.expirationMonths?.toString() || "",
      tags: product.tags?.join(", ") || "",
      isBestSeller: product.isBestSeller,
      isSeasonal: product.isSeasonal,
    });
    setIsEditing(true);
    setEditingProductId(product.id);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.price || !form.categoryId || !form.vendorId) {
      Alert.alert("Validation Error", "Please fill in all required fields: Name, Price, Category, Vendor");
      return;
    }

    const productData = {
      name: form.name.trim(),
      description: form.description.trim(),
      price: parseFloat(form.price),
      compareAtPrice: form.compareAtPrice ? parseFloat(form.compareAtPrice) : null,
      unit: form.unit || "piece",
      stock: parseInt(form.stock) || 0,
      sku: form.sku.trim() || null,
      categoryId: form.categoryId,
      vendorId: form.vendorId,
      weight: form.weight.trim() || null,
      ingredients: form.ingredients.trim() || null,
      expirationMonths: form.expirationMonths ? parseInt(form.expirationMonths) : null,
      tags: form.tags ? form.tags.split(",").map(t => t.trim()).filter(Boolean) : [],
      isBestSeller: form.isBestSeller,
      isSeasonal: form.isSeasonal,
    };

    try {
      if (isEditing && editingProductId) {
        await updateProduct(editingProductId, productData);
        Alert.alert("Success", "Product updated successfully");
      } else {
        await createProduct(productData);
        Alert.alert("Success", "Product created successfully");
      }
      resetForm();
      setShowForm(false);
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to save product");
    }
  };

  const handlePickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission Required", "Please grant permission to access your photo library");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: false,
      quality: 0.8,
      allowsEditing: true,
      aspect: [1, 1],
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedImageUri(result.assets[0].uri);
    }
  };

  const handleUploadImage = async () => {
    if (!selectedImageUri || !editingProductId) {
      Alert.alert("Error", "Please select an image first");
      return;
    }

    try {
      await uploadImage(editingProductId, selectedImageUri);
      setSelectedImageUri(null);
      Alert.alert("Success", "Image uploaded successfully");
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to upload image");
    }
  };

  const handleRemoveImage = async (productId: string, imageIndex: number) => {
    Alert.alert("Remove Image", "Are you sure you want to remove this image?", [
      { text: "Cancel", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: () => removeProductImage(productId, imageIndex) },
    ]);
  };

  const handleDeleteProduct = async (product: Product) => {
    Alert.alert("Delete Product", `Are you sure you want to delete "${product.name}"?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteProduct(product.id) },
    ]);
  };

  return (
    <View style={[s(colors).container, { paddingTop: insets.top }]}>
      <View style={s(colors).header}>
        <Pressable onPress={() => router.back()} style={s(colors).backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={s(colors).headerTitle}>Product Management</Text>
        <Pressable onPress={handleCreateNew} style={s(colors).addBtn}>
          <Feather name="plus" size={20} color="#fff" />
        </Pressable>
      </View>

      <View style={s(colors).searchRow}>
        <Feather name="search" size={18} color={colors.mutedForeground} />
        <TextInput
          style={s(colors).searchInput}
          placeholder="Search products..."
          placeholderTextColor={colors.mutedForeground}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s(colors).filterBar}>
        <Pressable
          onPress={() => setFilterCategory("all")}
          style={[s(colors).filterChip, filterCategory === "all" && s(colors).filterChipActive]}
        >
          <Text style={[s(colors).filterText, filterCategory === "all" && s(colors).filterTextActive]}>All</Text>
        </Pressable>
        {categories.map((cat) => (
          <Pressable
            key={cat.id}
            onPress={() => setFilterCategory(cat.id)}
            style={[s(colors).filterChip, filterCategory === cat.id && s(colors).filterChipActive]}
          >
            <Text style={[s(colors).filterText, filterCategory === cat.id && s(colors).filterTextActive]}>{cat.name}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {isLoadingProducts ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : filteredProducts.length === 0 ? (
        <View style={s(colors).emptyState}>
          <Feather name="package" size={48} color={colors.mutedForeground} />
          <Text style={s(colors).emptyTitle}>No products found</Text>
          <Text style={s(colors).emptySubtitle}>Tap + to create a new product</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, gap: 10 }}>
          {filteredProducts.map((product) => (
            <View key={product.id} style={s(colors).productCard}>
              <View style={s(colors).productRow}>
                <View style={s(colors).productImageContainer}>
                  {product.images && product.images.length > 0 ? (
                    <Image
                      source={{ uri: `http://localhost:8080${product.images[0]}` }}
                      style={s(colors).productImage}
                    />
                  ) : (
                    <View style={[s(colors).productImage, { backgroundColor: colors.border, alignItems: "center", justifyContent: "center" }]}>
                      <Feather name="image" size={24} color={colors.mutedForeground} />
                    </View>
                  )}
                </View>
                <View style={s(colors).productInfo}>
                  <Text style={s(colors).productName}>{product.name}</Text>
                  <Text style={s(colors).sku}>{product.sku || "No SKU"}</Text>
                  <Text style={s(colors).productPrice}>₱{product.price.toFixed(2)}</Text>
                  <View style={s(colors).productMeta}>
                    <Text style={s(colors).productStock}>Stock: {product.stock}</Text>
                    {product.isBestSeller && (
                      <View style={s(colors).badge}>
                        <Text style={s(colors).badgeText}>Best Seller</Text>
                      </View>
                    )}
                    {product.isSeasonal && (
                      <View style={[s(colors).badge, { backgroundColor: "#F59E0B15" }]}>
                        <Text style={[s(colors).badgeText, { color: "#F59E0B" }]}>Seasonal</Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
              <View style={s(colors).productActions}>
                <Pressable onPress={() => handleEdit(product)} style={s(colors).actionBtn}>
                  <Feather name="edit-2" size={16} color={colors.primary} />
                  <Text style={s(colors).actionText}>Edit</Text>
                </Pressable>
                <Pressable onPress={() => handleDeleteProduct(product)} style={s(colors).actionBtn}>
                  <Feather name="trash-2" size={16} color={colors.destructive} />
                  <Text style={[s(colors).actionText, { color: colors.destructive }]}>Delete</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      <Modal visible={showForm} animationType="slide" presentationStyle="pageSheet">
        <View style={[s(colors).modalContainer, { paddingTop: insets.top }]}>
          <View style={s(colors).modalHeader}>
            <Pressable onPress={() => { resetForm(); setShowForm(false); }}>
              <Text style={s(colors).modalCancel}>Cancel</Text>
            </Pressable>
            <Text style={s(colors).modalTitle}>{isEditing ? "Edit Product" : "New Product"}</Text>
            <Pressable onPress={handleSave} disabled={isManagingProduct}>
              <Text style={[s(colors).modalSave, isManagingProduct && { opacity: 0.5 }]}>Save</Text>
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
            {isEditing && selectedProduct && (
              <View style={s(colors).imagesSection}>
                <Text style={s(colors).sectionTitle}>Product Images</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
                  {(selectedProduct.images || []).map((img, idx) => (
                    <View key={idx} style={s(colors).imageWrapper}>
                      <Image source={{ uri: `http://localhost:8080${img}` }} style={s(colors).uploadedImage} />
                      <Pressable
                        onPress={() => handleRemoveImage(selectedProduct.id, idx)}
                        style={s(colors).removeImageBtn}
                      >
                        <Feather name="x" size={14} color="#fff" />
                      </Pressable>
                    </View>
                  ))}
                  <Pressable onPress={handlePickImage} style={s(colors).addImageBtn}>
                    <Feather name="plus" size={24} color={colors.mutedForeground} />
                    <Text style={s(colors).addImageText}>Add Image</Text>
                  </Pressable>
                </ScrollView>
                {selectedImageUri && (
                  <View style={s(colors).previewContainer}>
                    <Image source={{ uri: selectedImageUri }} style={s(colors).previewImage} />
                    <Pressable onPress={handleUploadImage} disabled={isManagingProduct} style={s(colors).uploadBtn}>
                      {isManagingProduct ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <>
                          <Feather name="upload" size={16} color="#fff" />
                          <Text style={s(colors).uploadBtnText}>Upload</Text>
                        </>
                      )}
                    </Pressable>
                  </View>
                )}
              </View>
            )}

            <View style={s(colors).formSection}>
              <Text style={s(colors).sectionTitle}>Basic Information</Text>

              <View style={s(colors).inputGroup}>
                <Text style={s(colors).label}>Product Name *</Text>
                <TextInput
                  style={s(colors).input}
                  value={form.name}
                  onChangeText={(v) => setForm(prev => ({ ...prev, name: v }))}
                  placeholder="Enter product name"
                  placeholderTextColor={colors.mutedForeground}
                />
              </View>

              <View style={s(colors).inputGroup}>
                <Text style={s(colors).label}>Description</Text>
                <TextInput
                  style={[s(colors).input, s(colors).textarea]}
                  value={form.description}
                  onChangeText={(v) => setForm(prev => ({ ...prev, description: v }))}
                  placeholder="Enter product description"
                  placeholderTextColor={colors.mutedForeground}
                  multiline
                  numberOfLines={4}
                />
              </View>

              <View style={s(colors).inputRow}>
                <View style={[s(colors).inputGroup, { flex: 1 }]}>
                  <Text style={s(colors).label}>Price (₱) *</Text>
                  <TextInput
                    style={s(colors).input}
                    value={form.price}
                    onChangeText={(v) => setForm(prev => ({ ...prev, price: v }))}
                    placeholder="0.00"
                    placeholderTextColor={colors.mutedForeground}
                    keyboardType="decimal-pad"
                  />
                </View>
                <View style={[s(colors).inputGroup, { flex: 1 }]}>
                  <Text style={s(colors).label}>Compare Price</Text>
                  <TextInput
                    style={s(colors).input}
                    value={form.compareAtPrice}
                    onChangeText={(v) => setForm(prev => ({ ...prev, compareAtPrice: v }))}
                    placeholder="0.00"
                    placeholderTextColor={colors.mutedForeground}
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>

              <View style={s(colors).inputRow}>
                <View style={[s(colors).inputGroup, { flex: 1 }]}>
                  <Text style={s(colors).label}>Unit</Text>
                  <TextInput
                    style={s(colors).input}
                    value={form.unit}
                    onChangeText={(v) => setForm(prev => ({ ...prev, unit: v }))}
                    placeholder="piece, kg, g"
                    placeholderTextColor={colors.mutedForeground}
                  />
                </View>
                <View style={[s(colors).inputGroup, { flex: 1 }]}>
                  <Text style={s(colors).label}>Stock *</Text>
                  <TextInput
                    style={s(colors).input}
                    value={form.stock}
                    onChangeText={(v) => setForm(prev => ({ ...prev, stock: v }))}
                    placeholder="0"
                    placeholderTextColor={colors.mutedForeground}
                    keyboardType="number-pad"
                  />
                </View>
              </View>

              <View style={s(colors).inputGroup}>
                <Text style={s(colors).label}>SKU</Text>
                <TextInput
                  style={s(colors).input}
                  value={form.sku}
                  onChangeText={(v) => setForm(prev => ({ ...prev, sku: v }))}
                  placeholder="Stock Keeping Unit"
                  placeholderTextColor={colors.mutedForeground}
                />
              </View>
            </View>

            <View style={s(colors).formSection}>
              <Text style={s(colors).sectionTitle}>Category & Vendor</Text>

              <View style={s(colors).inputGroup}>
                <Text style={s(colors).label}>Category *</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s(colors).chipContainer}>
                  {categories.map((cat) => (
                    <Pressable
                      key={cat.id}
                      onPress={() => setForm(prev => ({ ...prev, categoryId: cat.id }))}
                      style={[s(colors).chip, form.categoryId === cat.id && s(colors).chipActive]}
                    >
                      <Text style={[s(colors).chipText, form.categoryId === cat.id && s(colors).chipTextActive]}>
                        {cat.name}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>

              {user.role === "admin" && (
                <View style={s(colors).inputGroup}>
                  <Text style={s(colors).label}>Vendor *</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s(colors).chipContainer}>
                    {vendors.map((vendor) => (
                      <Pressable
                        key={vendor.id}
                        onPress={() => setForm(prev => ({ ...prev, vendorId: vendor.id }))}
                        style={[s(colors).chip, form.vendorId === vendor.id && s(colors).chipActive]}
                      >
                        <Text style={[s(colors).chipText, form.vendorId === vendor.id && s(colors).chipTextActive]}>
                          {vendor.name}
                        </Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>

            <View style={s(colors).formSection}>
              <Text style={s(colors).sectionTitle}>Additional Details</Text>

              <View style={s(colors).inputGroup}>
                <Text style={s(colors).label}>Weight</Text>
                <TextInput
                  style={s(colors).input}
                  value={form.weight}
                  onChangeText={(v) => setForm(prev => ({ ...prev, weight: v }))}
                  placeholder="e.g., 500g, 1kg"
                  placeholderTextColor={colors.mutedForeground}
                />
              </View>

              <View style={s(colors).inputGroup}>
                <Text style={s(colors).label}>Ingredients</Text>
                <TextInput
                  style={[s(colors).input, s(colors).textarea]}
                  value={form.ingredients}
                  onChangeText={(v) => setForm(prev => ({ ...prev, ingredients: v }))}
                  placeholder="List ingredients (comma separated)"
                  placeholderTextColor={colors.mutedForeground}
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={s(colors).inputGroup}>
                <Text style={s(colors).label}>Expiration (months)</Text>
                <TextInput
                  style={s(colors).input}
                  value={form.expirationMonths}
                  onChangeText={(v) => setForm(prev => ({ ...prev, expirationMonths: v }))}
                  placeholder="e.g., 12"
                  placeholderTextColor={colors.mutedForeground}
                  keyboardType="number-pad"
                />
              </View>

              <View style={s(colors).inputGroup}>
                <Text style={s(colors).label}>Tags (comma separated)</Text>
                <TextInput
                  style={s(colors).input}
                  value={form.tags}
                  onChangeText={(v) => setForm(prev => ({ ...prev, tags: v }))}
                  placeholder="e.g., organic, fresh, local"
                  placeholderTextColor={colors.mutedForeground}
                />
              </View>
            </View>

            <View style={s(colors).formSection}>
              <Text style={s(colors).sectionTitle}>Flags</Text>
              <View style={s(colors).switchRow}>
                <Text style={s(colors).switchLabel}>Best Seller</Text>
                <Switch
                  value={form.isBestSeller}
                  onValueChange={(v) => setForm(prev => ({ ...prev, isBestSeller: v }))}
                  trackColor={{ false: colors.border, true: colors.primary }}
                />
              </View>
              <View style={s(colors).switchRow}>
                <Text style={s(colors).switchLabel}>Seasonal</Text>
                <Switch
                  value={form.isSeasonal}
                  onValueChange={(v) => setForm(prev => ({ ...prev, isSeasonal: v }))}
                  trackColor={{ false: colors.border, true: colors.primary }}
                />
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
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
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    backBtn: { width: 38, height: 38, borderRadius: 10, alignItems: "center", justifyContent: "center" },
    headerTitle: { fontSize: 18, fontFamily: "Inter_700Bold", color: colors.foreground },
    addBtn: { width: 38, height: 38, borderRadius: 10, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
    searchRow: { flexDirection: "row", alignItems: "center", marginHorizontal: 16, marginTop: 12, marginBottom: 8, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: colors.card, borderRadius: 10, borderWidth: 1, borderColor: colors.border, gap: 8 },
    searchInput: { flex: 1, fontSize: 15, color: colors.foreground, fontFamily: "Inter_400Regular" },
    filterBar: { flexDirection: "row", paddingHorizontal: 16, paddingBottom: 12 },
    filterChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, marginRight: 8 },
    filterChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    filterText: { fontSize: 13, color: colors.mutedForeground },
    filterTextActive: { color: "#fff" },
    emptyState: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 8 },
    emptyTitle: { fontSize: 18, fontFamily: "Inter_600SemiBold", color: colors.foreground },
    emptySubtitle: { fontSize: 14, color: colors.mutedForeground },
    productCard: { backgroundColor: colors.card, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: colors.border },
    productRow: { flexDirection: "row", gap: 12 },
    productImageContainer: { borderRadius: 10, overflow: "hidden" },
    productImage: { width: 72, height: 72 },
    productInfo: { flex: 1, gap: 2 },
    productName: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: colors.foreground },
    sku: { fontSize: 11, color: colors.mutedForeground },
    productPrice: { fontSize: 16, fontFamily: "Inter_700Bold", color: colors.primary },
    productMeta: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4, flexWrap: "wrap" },
    productStock: { fontSize: 12, color: colors.mutedForeground },
    badge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, backgroundColor: "#05966915" },
    badgeText: { fontSize: 9, fontFamily: "Inter_500Medium", color: "#059669" },
    productActions: { flexDirection: "row", gap: 8, marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.border },
    actionBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 8, borderRadius: 8, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border },
    actionText: { fontSize: 13, fontFamily: "Inter_500Medium", color: colors.primary },
    modalContainer: { flex: 1, backgroundColor: colors.background },
    modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
    modalCancel: { fontSize: 15, color: colors.primary },
    modalTitle: { fontSize: 17, fontFamily: "Inter_600SemiBold", color: colors.foreground },
    modalSave: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: colors.primary },
    sectionTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: colors.foreground, marginBottom: 4 },
    formSection: { backgroundColor: colors.card, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: colors.border, gap: 12 },
    inputGroup: { gap: 6 },
    inputRow: { flexDirection: "row", gap: 12 },
    label: { fontSize: 13, fontFamily: "Inter_500Medium", color: colors.mutedForeground },
    input: { borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, color: colors.foreground, backgroundColor: colors.background },
    textarea: { minHeight: 80, textAlignVertical: "top" },
    chipContainer: { flexDirection: "row", marginTop: 4 },
    chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, marginRight: 8 },
    chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    chipText: { fontSize: 13, color: colors.mutedForeground },
    chipTextActive: { color: "#fff" },
    switchRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    switchLabel: { fontSize: 14, color: colors.foreground },
    imagesSection: { backgroundColor: colors.card, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: colors.border, gap: 8 },
    imageWrapper: { position: "relative", marginRight: 10 },
    uploadedImage: { width: 100, height: 100, borderRadius: 10 },
    removeImageBtn: { position: "absolute", top: -6, right: -6, width: 22, height: 22, borderRadius: 11, backgroundColor: colors.destructive, alignItems: "center", justifyContent: "center" },
    addImageBtn: { width: 100, height: 100, borderRadius: 10, borderWidth: 2, borderColor: colors.border, borderStyle: "dashed", alignItems: "center", justifyContent: "center", gap: 4 },
    addImageText: { fontSize: 11, color: colors.mutedForeground },
    previewContainer: { alignItems: "center", gap: 12, marginTop: 8 },
    previewImage: { width: 120, height: 120, borderRadius: 10 },
    uploadBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, backgroundColor: colors.primary },
    uploadBtnText: { color: "#fff", fontFamily: "Inter_500Medium", fontSize: 14 },
  });