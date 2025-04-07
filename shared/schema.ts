import { pgTable, text, serial, jsonb, timestamp, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

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

// Listings table
export const listings = pgTable("listings", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  items: jsonb("items").$type<Item[]>().notNull(),
  pickupInstructions: text("pickup_instructions").notNull(),
  paymentInfo: text("payment_info"),
  address: text("address").notNull(),
  coordinates: jsonb("coordinates").$type<Coordinates>(),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  editToken: text("edit_token").notNull(),
});

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

export type InsertListing = z.infer<typeof insertListingSchema>;
export type CreateListing = z.infer<typeof createListingSchema>;
export type Listing = typeof listings.$inferSelect;
