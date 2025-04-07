import { nanoid } from "nanoid";
import {
  listings,
  type Listing,
  type InsertListing,
  type CreateListing
} from "@shared/schema";

// Storage interface
export interface IStorage {
  createListing(listing: CreateListing): Promise<Listing>;
  getListing(id: number): Promise<Listing | undefined>;
  getAllListings(): Promise<Listing[]>;
  getListingByEditToken(editToken: string): Promise<Listing | undefined>;
  updateListing(id: number, listing: Partial<InsertListing>): Promise<Listing | undefined>;
  deleteListing(id: number): Promise<boolean>;
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
      ...listingData,
      id,
      editToken,
      createdAt,
      description: listingData.description || null,
      paymentInfo: listingData.paymentInfo || null,
      address: listingData.address || null,
      coordinates: listingData.coordinates || null
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
    
    // Handle null/undefined conversions
    const processedUpdate = {
      ...listingUpdate,
      description: listingUpdate.description ?? listing.description,
      paymentInfo: listingUpdate.paymentInfo ?? listing.paymentInfo,
      address: listingUpdate.address ?? listing.address,
      coordinates: listingUpdate.coordinates ?? listing.coordinates
    };
    
    const updatedListing: Listing = {
      ...listing,
      ...processedUpdate,
    };
    
    this.listings.set(id, updatedListing);
    return updatedListing;
  }

  async deleteListing(id: number): Promise<boolean> {
    return this.listings.delete(id);
  }
}

export const storage = new MemStorage();
