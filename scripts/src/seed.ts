import { db } from "@workspace/db";
import {
  usersTable,
  vendorsTable,
  categoriesTable,
  productsTable,
} from "@workspace/db/schema";
import bcrypt from "bcryptjs";

async function seed() {
  console.log("🌱 Seeding database...");

  const adminHash = await bcrypt.hash("admin123", 12);
  const staffHash = await bcrypt.hash("staff123", 12);
  const customerHash = await bcrypt.hash("customer123", 12);

  const [admin] = await db.insert(usersTable).values({
    email: "admin@legazpimarket.ph",
    passwordHash: adminHash,
    name: "Market Admin",
    phone: "+639171234567",
    role: "admin",
    isVerified: true,
    kycStatus: "approved",
  }).onConflictDoNothing().returning();
  console.log("✅ Admin user created:", admin?.email ?? "already exists");

  const [staff] = await db.insert(usersTable).values({
    email: "staff@groyon.ph",
    passwordHash: staffHash,
    name: "Maria Santos",
    phone: "+639187654321",
    role: "staff",
    isVerified: true,
    kycStatus: "approved",
  }).onConflictDoNothing().returning();
  console.log("✅ Staff user created:", staff?.email ?? "already exists");

  const [customer] = await db.insert(usersTable).values({
    email: "customer@gmail.com",
    passwordHash: customerHash,
    name: "Juan dela Cruz",
    phone: "+639209876543",
    role: "customer",
    isVerified: false,
    kycStatus: "none",
  }).onConflictDoNothing().returning();
  console.log("✅ Customer user created:", customer?.email ?? "already exists");

  const categoryData = [
    { name: "All", slug: "all", icon: "grid", sortOrder: 0 },
    { name: "Food & Delicacies", slug: "food", icon: "coffee", sortOrder: 1 },
    { name: "Handicrafts", slug: "handicrafts", icon: "scissors", sortOrder: 2 },
    { name: "Clothing", slug: "clothing", icon: "shirt", sortOrder: 3 },
    { name: "Accessories", slug: "accessories", icon: "watch", sortOrder: 4 },
    { name: "Home Decor", slug: "home-decor", icon: "home", sortOrder: 5 },
  ];

  const insertedCategories: { id: string; slug: string }[] = [];
  for (const cat of categoryData) {
    const [c] = await db.insert(categoriesTable).values(cat).onConflictDoNothing().returning();
    if (c) insertedCategories.push(c);
  }

  const allCats = await db.select().from(categoriesTable);
  const catMap = Object.fromEntries(allCats.map(c => [c.slug, c.id]));
  console.log("✅ Categories seeded");

  const vendorData = [
    {
      name: "Groyon Store",
      description: "Premium Bicolano pasalubong and local delicacies since 1995. Known for the best pili nuts and spicy treats.",
      location: "Stall 12, Legazpi Grand Central Terminal",
      operatingHours: "6:00 AM - 9:00 PM",
      dtiRegistration: "DTI-2023-12345",
      rating: 4.8,
      totalProducts: 4,
      isActive: true,
    },
    {
      name: "Mayon Treats",
      description: "Authentic Bicolano sweets and snacks inspired by the majestic Mayon Volcano.",
      location: "Stall 7, Legazpi Grand Central Terminal",
      operatingHours: "7:00 AM - 8:00 PM",
      dtiRegistration: "DTI-2022-67890",
      rating: 4.6,
      totalProducts: 3,
      isActive: true,
    },
    {
      name: "Angeli's Souvenir Shop",
      description: "Handcrafted abaca and bamboo products made by local artisans from Albay.",
      location: "Stall 3, Legazpi Grand Central Terminal",
      operatingHours: "8:00 AM - 7:00 PM",
      dtiRegistration: "DTI-2021-11223",
      rating: 4.9,
      totalProducts: 3,
      isActive: true,
    },
  ];

  const insertedVendors: typeof vendorsTable.$inferSelect[] = [];
  for (const v of vendorData) {
    const existing = await db.select().from(vendorsTable);
    const existingNames = existing.map(e => e.name);
    if (!existingNames.includes(v.name)) {
      const [vendor] = await db.insert(vendorsTable).values(v).returning();
      if (vendor) insertedVendors.push(vendor);
    } else {
      const existing_v = existing.find(e => e.name === v.name);
      if (existing_v) insertedVendors.push(existing_v);
    }
  }
  console.log("✅ Vendors seeded");

  const groyon = insertedVendors.find(v => v.name === "Groyon Store");
  const mayon = insertedVendors.find(v => v.name === "Mayon Treats");
  const angeli = insertedVendors.find(v => v.name === "Angeli's Souvenir Shop");

  if (!groyon || !mayon || !angeli) {
    console.error("❌ Vendors not found, aborting product seed");
    return;
  }

  const existingProducts = await db.select().from(productsTable);
  if (existingProducts.length > 0) {
    console.log("✅ Products already seeded, skipping");
    return;
  }

  const productData = [
    {
      vendorId: groyon.id,
      categoryId: catMap["food"] ?? "",
      name: "Premium Pili Nuts (Original)",
      description: "Freshly harvested pili nuts from Bicol, lightly salted and roasted to perfection. A classic Bicolano delicacy.",
      price: 285,
      compareAtPrice: 320,
      unit: "250g pack",
      stock: 48,
      images: [],
      isBestSeller: true,
      isSeasonal: false,
      sku: "GRY-PILI-001",
      tags: ["pili", "nuts", "snack", "bestseller"],
      rating: 4.9,
      reviewCount: 128,
      ingredients: "Pili nuts, salt, vegetable oil",
      expirationMonths: 6,
      weight: "250g",
    },
    {
      vendorId: groyon.id,
      categoryId: catMap["food"] ?? "",
      name: "Bicol Express Paste",
      description: "Authentic Bicol Express in a jar — spicy coconut cream pork paste. Just heat and serve.",
      price: 180,
      compareAtPrice: null,
      unit: "jar (300g)",
      stock: 32,
      images: [],
      isBestSeller: false,
      isSeasonal: false,
      sku: "GRY-BEX-002",
      tags: ["spicy", "bicol express", "condiment"],
      rating: 4.7,
      reviewCount: 76,
      ingredients: "Pork, coconut milk, chili, garlic, shrimp paste",
      expirationMonths: 3,
      weight: "300g",
    },
    {
      vendorId: groyon.id,
      categoryId: catMap["food"] ?? "",
      name: "Pili Nut Brittle",
      description: "Crunchy pili nut brittle with caramelized sugar. Perfect pasalubong for the sweet tooth.",
      price: 150,
      compareAtPrice: null,
      unit: "200g pack",
      stock: 60,
      images: [],
      isBestSeller: false,
      isSeasonal: true,
      sku: "GRY-PNB-003",
      tags: ["pili", "brittle", "sweet", "seasonal"],
      rating: 4.6,
      reviewCount: 45,
      ingredients: "Pili nuts, sugar, butter",
      expirationMonths: 4,
      weight: "200g",
    },
    {
      vendorId: groyon.id,
      categoryId: catMap["food"] ?? "",
      name: "Laing in a Can",
      description: "Traditional taro leaves cooked in coconut milk with chili. A Bicolano staple dish, ready to eat.",
      price: 120,
      compareAtPrice: null,
      unit: "can (400g)",
      stock: 25,
      images: [],
      isBestSeller: false,
      isSeasonal: false,
      sku: "GRY-LAI-004",
      tags: ["laing", "taro", "coconut"],
      rating: 4.5,
      reviewCount: 38,
      ingredients: "Taro leaves, coconut milk, chili, bagoong",
      expirationMonths: 12,
      weight: "400g",
    },
    {
      vendorId: mayon.id,
      categoryId: catMap["food"] ?? "",
      name: "Mayon Volcano Keychain",
      description: "Miniature resin replica of the Mayon Volcano with intricate detail. A must-have souvenir.",
      price: 95,
      compareAtPrice: null,
      unit: "piece",
      stock: 100,
      images: [],
      isBestSeller: true,
      isSeasonal: false,
      sku: "MAY-KYC-001",
      tags: ["keychain", "souvenir", "mayon"],
      rating: 4.8,
      reviewCount: 203,
    },
    {
      vendorId: mayon.id,
      categoryId: catMap["food"] ?? "",
      name: "Pinangat sa Gata",
      description: "Traditional Bicolano fish wrapped in taro leaves, cooked in coconut milk and spices.",
      price: 220,
      compareAtPrice: null,
      unit: "pack (500g)",
      stock: 18,
      images: [],
      isBestSeller: false,
      isSeasonal: false,
      sku: "MAY-PNG-002",
      tags: ["pinangat", "fish", "coconut"],
      rating: 4.7,
      reviewCount: 54,
      ingredients: "Fish, taro leaves, coconut milk, chili",
      expirationMonths: 2,
      weight: "500g",
    },
    {
      vendorId: mayon.id,
      categoryId: catMap["food"] ?? "",
      name: "Tinagtag (Pili Candy)",
      description: "Traditional Bicolano pili candy with coconut and sesame. Chewy and sweet.",
      price: 85,
      compareAtPrice: null,
      unit: "pack (150g)",
      stock: 75,
      images: [],
      isBestSeller: false,
      isSeasonal: true,
      sku: "MAY-TNT-003",
      tags: ["candy", "pili", "sweet", "seasonal"],
      rating: 4.4,
      reviewCount: 62,
      ingredients: "Pili nuts, coconut sugar, sesame seeds",
      expirationMonths: 3,
      weight: "150g",
    },
    {
      vendorId: angeli.id,
      categoryId: catMap["handicrafts"] ?? "",
      name: "Abaca Woven Bag",
      description: "Handcrafted abaca fiber tote bag by Albay artisans. Eco-friendly, durable, and uniquely Filipino.",
      price: 650,
      compareAtPrice: 800,
      unit: "piece",
      stock: 12,
      images: [],
      isBestSeller: true,
      isSeasonal: false,
      sku: "ANG-ABG-001",
      tags: ["abaca", "bag", "handmade", "eco"],
      rating: 4.9,
      reviewCount: 89,
      weight: "300g",
    },
    {
      vendorId: angeli.id,
      categoryId: catMap["home-decor"] ?? "",
      name: "Bamboo Wind Chimes",
      description: "Handcrafted bamboo wind chimes with natural tones. A peaceful touch for any home.",
      price: 350,
      compareAtPrice: null,
      unit: "piece",
      stock: 20,
      images: [],
      isBestSeller: false,
      isSeasonal: false,
      sku: "ANG-BWC-002",
      tags: ["bamboo", "windchime", "home decor"],
      rating: 4.7,
      reviewCount: 41,
      weight: "200g",
    },
    {
      vendorId: angeli.id,
      categoryId: catMap["handicrafts"] ?? "",
      name: "Hand-painted Capiz Shell Frame",
      description: "Beautiful hand-painted capiz shell picture frame — a unique Bicolano keepsake.",
      price: 490,
      compareAtPrice: null,
      unit: "piece",
      stock: 8,
      images: [],
      isBestSeller: false,
      isSeasonal: true,
      sku: "ANG-CSF-003",
      tags: ["capiz", "frame", "handpainted", "seasonal"],
      rating: 4.8,
      reviewCount: 27,
      weight: "500g",
    },
  ];

  await db.insert(productsTable).values(productData);
  console.log(`✅ ${productData.length} products seeded`);

  console.log("🎉 Database seeding complete!");
}

seed().catch(console.error).finally(() => process.exit());
