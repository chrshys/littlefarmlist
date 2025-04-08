import { pgTable, text, serial, jsonb, timestamp, doublePrecision, integer, uniqueIndex, primaryKey, varchar, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Item schema
export const itemSchema = z.object({
  name: z.string().min(1),
  price: z.number().min(0)
});

export type Item = z.infer<typeof itemSchema>;

// Location coordinates schema
export const coordinatesSchema = z.object({
  lat: z.number(),
  lng: z.number()
});

export type Coordinates = z.infer<typeof coordinatesSchema>;

// Categories table
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => {
  return {
    nameIdx: uniqueIndex("categories_name_idx").on(table.name),
  };
});

export const categoriesRelations = relations(categories, ({ many }) => ({
  listingCategories: many(listingCategories),
}));

// Listings table
export const listings = pgTable("listings", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  items: jsonb("items").$type<Item[]>().notNull(),
  // Keep the original categories field for backward compatibility during migration
  categories: jsonb("categories").$type<string[]>().default([]),
  pickupInstructions: text("pickup_instructions").notNull(),
  paymentInfo: text("payment_info"),
  address: text("address").notNull(),
  coordinates: jsonb("coordinates").$type<Coordinates>(),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  // editToken removed as all users have accounts now
  userId: integer("user_id").references(() => users.id, { onDelete: "set null" }).notNull(),
});

export const listingsRelations = relations(listings, ({ many, one }) => ({
  listingCategories: many(listingCategories),
  user: one(users, {
    fields: [listings.userId],
    references: [users.id],
  }),
}));

// Junction table for the many-to-many relationship between listings and categories
export const listingCategories = pgTable("listing_categories", {
  listingId: integer("listing_id").notNull().references(() => listings.id, { onDelete: "cascade" }),
  categoryId: integer("category_id").notNull().references(() => categories.id, { onDelete: "cascade" }),
}, (table) => {
  return {
    pk: primaryKey({ columns: [table.listingId, table.categoryId] }),
  };
});

export const listingCategoriesRelations = relations(listingCategories, ({ one }) => ({
  listing: one(listings, {
    fields: [listingCategories.listingId],
    references: [listings.id],
  }),
  category: one(categories, {
    fields: [listingCategories.categoryId],
    references: [categories.id],
  }),
}));

// Insert schema
export const insertListingSchema = createInsertSchema(listings).omit({
  id: true,
  createdAt: true,
});

export const createListingSchema = insertListingSchema.extend({
  items: z.array(itemSchema).min(1, "Add at least one item"),
  title: z.string().min(3, "Title must be at least 3 characters"),
  pickupInstructions: z.string().min(5, "Pickup instructions are required"),
  address: z.string().min(5, "Address is required"),
  coordinates: coordinatesSchema.optional(),
  userId: z.number().optional(),
});

// Category schemas
export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
  createdAt: true,
});

export const createCategorySchema = insertCategorySchema.extend({
  name: z.string().min(2, "Category name must be at least 2 characters"),
});

// Types
export type InsertListing = z.infer<typeof insertListingSchema>;
export type CreateListing = z.infer<typeof createListingSchema>;
export type Listing = typeof listings.$inferSelect;

export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type CreateCategory = z.infer<typeof createCategorySchema>;
export type Category = typeof categories.$inferSelect;

export type ListingCategory = typeof listingCategories.$inferSelect;

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull(),
  username: varchar("username", { length: 50 }).notNull(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  firstName: varchar("first_name", { length: 100 }),
  lastName: varchar("last_name", { length: 100 }),
  isVerified: boolean("is_verified").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
}, (table) => {
  return {
    emailIdx: uniqueIndex("users_email_idx").on(table.email),
    usernameIdx: uniqueIndex("users_username_idx").on(table.username)
  };
});

// Favorites table - junction table for users and listings
export const favorites = pgTable("favorites", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  listingId: integer("listing_id").notNull().references(() => listings.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull()
}, (table) => {
  return {
    userListingIdx: uniqueIndex("favorites_user_listing_idx").on(table.userId, table.listingId)
  };
});

export const favoritesRelations = relations(favorites, ({ one }) => ({
  user: one(users, {
    fields: [favorites.userId],
    references: [users.id]
  }),
  listing: one(listings, {
    fields: [favorites.listingId],
    references: [listings.id]
  })
}));

// Favorites schemas
export const insertFavoriteSchema = createInsertSchema(favorites).omit({
  id: true,
  createdAt: true
});

export const toggleFavoriteSchema = z.object({
  listingId: z.number()
});

export type InsertFavorite = z.infer<typeof insertFavoriteSchema>;
export type ToggleFavorite = z.infer<typeof toggleFavoriteSchema>;

export const usersRelations = relations(users, ({ many }) => ({
  listings: many(listings),
  favorites: many(favorites)
}));

// Update listings relation to include favorites
export const listingsFavoritesRelation = relations(listings, ({ many }) => ({
  favoritedBy: many(favorites)
}));

// User schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  passwordHash: true,
  isVerified: true
}).extend({
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(8, "Password must be at least 8 characters")
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"]
});

export const loginUserSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required")
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type LoginUser = z.infer<typeof loginUserSchema>;
export type Favorite = typeof favorites.$inferSelect;
