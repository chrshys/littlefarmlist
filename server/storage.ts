import { nanoid } from "nanoid";
import { eq, sql } from "drizzle-orm";
import {
  listings,
  type Listing,
  type InsertListing,
  type CreateListing, 
  type Item,
  type Coordinates
} from "@shared/schema";
import { db } from "./db";

// Storage interface
export interface IStorage {
  createListing(listing: CreateListing): Promise<Listing>;
  getListing(id: number): Promise<Listing | undefined>;
  getAllListings(): Promise<Listing[]>;
  getListingByEditToken(editToken: string): Promise<Listing | undefined>;
  updateListing(id: number, listing: Partial<InsertListing>): Promise<Listing | undefined>;
  deleteListing(id: number): Promise<boolean>;
}

// PostgreSQL database storage implementation
export class DbStorage implements IStorage {
  async createListing(listingData: CreateListing): Promise<Listing> {
    const editToken = nanoid();
    
    // Use raw SQL for insertion (bypassing TypeScript for now)
    const result = await db.execute(sql`
      INSERT INTO listings (
        title, 
        description, 
        items, 
        categories, 
        pickup_instructions, 
        payment_info, 
        address, 
        coordinates, 
        image_url, 
        edit_token
      ) VALUES (
        ${listingData.title},
        ${listingData.description || null},
        ${JSON.stringify(listingData.items)},
        ${JSON.stringify(listingData.categories || [])},
        ${listingData.pickupInstructions},
        ${listingData.paymentInfo || null},
        ${listingData.address || ''},
        ${listingData.coordinates ? JSON.stringify(listingData.coordinates) : null},
        ${listingData.imageUrl || null},
        ${editToken}
      )
      RETURNING *
    `);
    
    // Convert database row to camelCase for TypeScript Listing type
    const row = result.rows[0];
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      items: row.items,
      categories: row.categories,
      pickupInstructions: row.pickup_instructions,
      paymentInfo: row.payment_info,
      address: row.address,
      coordinates: row.coordinates,
      imageUrl: row.image_url,
      createdAt: row.created_at,
      editToken: row.edit_token
    } as Listing;
  }

  async getListing(id: number): Promise<Listing | undefined> {
    const result = await db.execute(sql`
      SELECT * FROM listings WHERE id = ${id}
    `);
    
    if (result.rows.length === 0) {
      return undefined;
    }
    
    // Convert row to camelCase for TypeScript Listing type
    const row = result.rows[0];
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      items: row.items,
      categories: row.categories,
      pickupInstructions: row.pickup_instructions,
      paymentInfo: row.payment_info,
      address: row.address,
      coordinates: row.coordinates,
      imageUrl: row.image_url,
      createdAt: row.created_at,
      editToken: row.edit_token
    } as Listing;
  }

  async getAllListings(): Promise<Listing[]> {
    const result = await db.execute(sql`
      SELECT * FROM listings
    `);
    
    // Convert rows to camelCase for TypeScript Listing type
    return result.rows.map(row => ({
      id: row.id,
      title: row.title,
      description: row.description,
      items: row.items,
      categories: row.categories,
      pickupInstructions: row.pickup_instructions,
      paymentInfo: row.payment_info,
      address: row.address,
      coordinates: row.coordinates,
      imageUrl: row.image_url,
      createdAt: row.created_at,
      editToken: row.edit_token
    })) as Listing[];
  }

  async getListingByEditToken(editToken: string): Promise<Listing | undefined> {
    const result = await db.execute(sql`
      SELECT * FROM listings WHERE edit_token = ${editToken}
    `);
    
    if (result.rows.length === 0) {
      return undefined;
    }
    
    // Convert row to camelCase for TypeScript Listing type
    const row = result.rows[0];
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      items: row.items,
      categories: row.categories,
      pickupInstructions: row.pickup_instructions,
      paymentInfo: row.payment_info,
      address: row.address,
      coordinates: row.coordinates,
      imageUrl: row.image_url,
      createdAt: row.created_at,
      editToken: row.edit_token
    } as Listing;
  }

  async updateListing(id: number, listingUpdate: Partial<InsertListing>): Promise<Listing | undefined> {
    const existingListing = await this.getListing(id);
    
    if (!existingListing) {
      return undefined;
    }
    
    // Build the update SQL based on what fields are being updated
    const updateFields: string[] = [];
    
    // Use separate SQL statements for each update scenario to avoid issues with dynamic SQL construction
    // This is simplified compared to the previous approach but still achieves the same result
    
    if (Object.keys(listingUpdate).length === 0) {
      return existingListing;
    }
    
    if (listingUpdate.title !== undefined) {
      const updateResult = await db.execute(sql`
        UPDATE listings
        SET title = ${listingUpdate.title}
        WHERE id = ${id}
        RETURNING *
      `);
      
      if (updateResult.rows.length === 0) {
        return undefined;
      }
    }
    
    if (listingUpdate.description !== undefined) {
      await db.execute(sql`
        UPDATE listings
        SET description = ${listingUpdate.description}
        WHERE id = ${id}
      `);
    }
    
    if (listingUpdate.items !== undefined) {
      await db.execute(sql`
        UPDATE listings
        SET items = ${JSON.stringify(listingUpdate.items)}
        WHERE id = ${id}
      `);
    }
    
    if (listingUpdate.categories !== undefined) {
      await db.execute(sql`
        UPDATE listings
        SET categories = ${JSON.stringify(listingUpdate.categories)}
        WHERE id = ${id}
      `);
    }
    
    if (listingUpdate.pickupInstructions !== undefined) {
      await db.execute(sql`
        UPDATE listings
        SET pickup_instructions = ${listingUpdate.pickupInstructions}
        WHERE id = ${id}
      `);
    }
    
    if (listingUpdate.paymentInfo !== undefined) {
      await db.execute(sql`
        UPDATE listings
        SET payment_info = ${listingUpdate.paymentInfo}
        WHERE id = ${id}
      `);
    }
    
    if (listingUpdate.address !== undefined) {
      await db.execute(sql`
        UPDATE listings
        SET address = ${listingUpdate.address}
        WHERE id = ${id}
      `);
    }
    
    if (listingUpdate.coordinates !== undefined) {
      await db.execute(sql`
        UPDATE listings
        SET coordinates = ${JSON.stringify(listingUpdate.coordinates)}
        WHERE id = ${id}
      `);
    }
    
    if (listingUpdate.imageUrl !== undefined) {
      await db.execute(sql`
        UPDATE listings
        SET image_url = ${listingUpdate.imageUrl}
        WHERE id = ${id}
      `);
    }
    
    // Get the updated listing
    const result = await db.execute(sql`
      SELECT * FROM listings WHERE id = ${id}
    `);
    
    if (result.rows.length === 0) {
      return undefined;
    }
    
    // Convert row to camelCase for TypeScript Listing type
    const row = result.rows[0];
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      items: row.items,
      categories: row.categories,
      pickupInstructions: row.pickup_instructions,
      paymentInfo: row.payment_info,
      address: row.address,
      coordinates: row.coordinates,
      imageUrl: row.image_url,
      createdAt: row.created_at,
      editToken: row.edit_token
    } as Listing;
  }

  async deleteListing(id: number): Promise<boolean> {
    const result = await db.execute(sql`
      DELETE FROM listings
      WHERE id = ${id}
      RETURNING id
    `);
    
    return result.rows.length > 0;
  }
}

// In-memory storage implementation
export class MemStorage implements IStorage {
  private listings: Map<number, Listing>;
  private currentId: number;

  constructor() {
    this.listings = new Map();
    this.currentId = 1;
  }

  async createListing(listingData: CreateListing): Promise<Listing> {
    const id = this.currentId++;
    const editToken = nanoid();
    const createdAt = new Date();
    
    const listing: Listing = {
      id,
      title: listingData.title,
      description: listingData.description || null,
      // Ensure items is properly typed
      items: listingData.items as Item[],
      categories: Array.isArray(listingData.categories) ? listingData.categories as string[] : [],
      pickupInstructions: listingData.pickupInstructions,
      paymentInfo: listingData.paymentInfo || null,
      address: listingData.address,
      coordinates: listingData.coordinates || null,
      imageUrl: listingData.imageUrl || null,
      createdAt,
      editToken
    };
    
    this.listings.set(id, listing);
    return listing;
  }

  async getListing(id: number): Promise<Listing | undefined> {
    return this.listings.get(id);
  }

  async getAllListings(): Promise<Listing[]> {
    return Array.from(this.listings.values());
  }

  async getListingByEditToken(editToken: string): Promise<Listing | undefined> {
    return Array.from(this.listings.values()).find(
      (listing) => listing.editToken === editToken
    );
  }

  async updateListing(id: number, listingUpdate: Partial<InsertListing>): Promise<Listing | undefined> {
    const listing = this.listings.get(id);
    
    if (!listing) {
      return undefined;
    }
    
    // Create a fresh updated listing with proper typing
    const updatedListing: Listing = {
      id: listing.id,
      title: listingUpdate.title ?? listing.title,
      description: listingUpdate.description ?? listing.description,
      items: (listingUpdate.items as Item[] | undefined) ?? listing.items,
      categories: Array.isArray(listingUpdate.categories) ? listingUpdate.categories as string[] : (listing.categories || []),
      pickupInstructions: listingUpdate.pickupInstructions ?? listing.pickupInstructions,
      paymentInfo: listingUpdate.paymentInfo ?? listing.paymentInfo,
      address: listingUpdate.address ?? listing.address,
      coordinates: listingUpdate.coordinates ?? listing.coordinates,
      imageUrl: listingUpdate.imageUrl ?? listing.imageUrl,
      createdAt: listing.createdAt,
      editToken: listing.editToken
    };
    
    this.listings.set(id, updatedListing);
    return updatedListing;
  }

  async deleteListing(id: number): Promise<boolean> {
    return this.listings.delete(id);
  }
}

// Use the database storage implementation
export const storage = new DbStorage();
