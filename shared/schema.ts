import { pgTable, text, serial, jsonb, timestamp, doublePrecision, integer, uniqueIndex, primaryKey } from "drizzle-orm/pg-core";
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
  editToken: text("edit_token").notNull(),
});

export const listingsRelations = relations(listings, ({ many }) => ({
  listingCategories: many(listingCategories),
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
}).omit({
  editToken: true, // Allow server to generate this
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
