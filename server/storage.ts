import { nanoid } from "nanoid";
import {
  listings,
  type Listing,
  type InsertListing,
  type CreateListing, 
  type Item,
  type Coordinates
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
      id,
      title: listingData.title,
      description: listingData.description || null,
      // Ensure items is properly typed
      items: listingData.items as Item[],
      pickupInstructions: listingData.pickupInstructions,
      paymentInfo: listingData.paymentInfo || null,
      address: listingData.address,
      coordinates: listingData.coordinates || null,
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
      pickupInstructions: listingUpdate.pickupInstructions ?? listing.pickupInstructions,
      paymentInfo: listingUpdate.paymentInfo ?? listing.paymentInfo,
      address: listingUpdate.address ?? listing.address,
      coordinates: listingUpdate.coordinates ?? listing.coordinates,
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

export const storage = new MemStorage();
