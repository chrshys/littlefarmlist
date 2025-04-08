import { nanoid } from "nanoid";
import { eq, sql, and, inArray } from "drizzle-orm";
import { compare, hash } from "bcryptjs";
import {
  listings,
  categories,
  listingCategories,
  users,
  favorites,
  type Listing,
  type InsertListing,
  type CreateListing, 
  type Item,
  type Coordinates,
  type Category,
  type InsertCategory,
  type CreateCategory,
  type ListingCategory,
  type InsertUser,
  type User,
  type LoginUser,
  type Favorite
} from "@shared/schema";
import { db } from "./db";

// Storage interface
export interface IStorage {
  // Listing methods
  createListing(listing: CreateListing): Promise<Listing>;
  getListing(id: number): Promise<Listing | undefined>;
  getAllListings(): Promise<Listing[]>;
  getUserListings(userId: number): Promise<Listing[]>;
  updateListing(id: number, listing: Partial<InsertListing>): Promise<Listing | undefined>;
  deleteListing(id: number): Promise<boolean>;
  
  // Category methods
  createCategory(category: CreateCategory): Promise<Category>;
  getCategory(id: number): Promise<Category | undefined>;
  getCategoryByName(name: string): Promise<Category | undefined>;
  getAllCategories(): Promise<Category[]>;
  updateCategory(id: number, category: Partial<InsertCategory>): Promise<Category | undefined>;
  deleteCategory(id: number): Promise<boolean>;
  
  // Listing-Category relationship methods
  addCategoryToListing(listingId: number, categoryId: number): Promise<void>;
  removeCategoryFromListing(listingId: number, categoryId: number): Promise<void>;
  getListingCategories(listingId: number): Promise<Category[]>;
  getCategoryListings(categoryId: number): Promise<Listing[]>;
  
  // User methods
  createUser(userData: InsertUser): Promise<User>;
  getUserById(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined>;
  verifyUser(email: string): Promise<boolean>;
  validatePassword(email: string, password: string): Promise<User | null>;
  
  // Favorites methods
  addFavorite(userId: number, listingId: number): Promise<Favorite>;
  removeFavorite(userId: number, listingId: number): Promise<boolean>;
  getUserFavorites(userId: number): Promise<Listing[]>;
  isFavorite(userId: number, listingId: number): Promise<boolean>;
}

// PostgreSQL database storage implementation
export class DbStorage implements IStorage {
  async createListing(listingData: CreateListing): Promise<Listing> {
    // Check if we have a userId - all listings must be associated with a user now
    if (!listingData.userId) {
      throw new Error("User ID is required to create a listing");
    }
    
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
        user_id
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
        ${listingData.userId}
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
      
      userId: row.user_id
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
      
      userId: row.user_id
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
      
      userId: row.user_id
    })) as Listing[];
  }
  
  async getUserListings(userId: number): Promise<Listing[]> {
    const result = await db.execute(sql`
      SELECT * FROM listings WHERE user_id = ${userId}
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
      
      userId: row.user_id
    })) as Listing[];
  }

  // Edit token functionality removed as all users have accounts now

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
    
    if (listingUpdate.userId !== undefined) {
      await db.execute(sql`
        UPDATE listings
        SET user_id = ${listingUpdate.userId}
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
      
      userId: row.user_id
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
  
  // Category methods
  async createCategory(categoryData: CreateCategory): Promise<Category> {
    const result = await db.execute(sql`
      INSERT INTO categories (
        name,
        description
      ) VALUES (
        ${categoryData.name},
        ${categoryData.description || null}
      )
      RETURNING *
    `);
    
    const row = result.rows[0];
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      createdAt: row.created_at
    } as Category;
  }
  
  async getCategory(id: number): Promise<Category | undefined> {
    const result = await db.execute(sql`
      SELECT * FROM categories WHERE id = ${id}
    `);
    
    if (result.rows.length === 0) {
      return undefined;
    }
    
    const row = result.rows[0];
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      createdAt: row.created_at
    } as Category;
  }
  
  async getCategoryByName(name: string): Promise<Category | undefined> {
    const result = await db.execute(sql`
      SELECT * FROM categories WHERE name = ${name}
    `);
    
    if (result.rows.length === 0) {
      return undefined;
    }
    
    const row = result.rows[0];
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      createdAt: row.created_at
    } as Category;
  }
  
  async getAllCategories(): Promise<Category[]> {
    const result = await db.execute(sql`
      SELECT * FROM categories ORDER BY name ASC
    `);
    
    return result.rows.map(row => ({
      id: row.id,
      name: row.name,
      description: row.description,
      createdAt: row.created_at
    })) as Category[];
  }
  
  async updateCategory(id: number, categoryUpdate: Partial<InsertCategory>): Promise<Category | undefined> {
    const existingCategory = await this.getCategory(id);
    
    if (!existingCategory) {
      return undefined;
    }
    
    if (Object.keys(categoryUpdate).length === 0) {
      return existingCategory;
    }
    
    if (categoryUpdate.name !== undefined) {
      await db.execute(sql`
        UPDATE categories
        SET name = ${categoryUpdate.name}
        WHERE id = ${id}
      `);
    }
    
    if (categoryUpdate.description !== undefined) {
      await db.execute(sql`
        UPDATE categories
        SET description = ${categoryUpdate.description}
        WHERE id = ${id}
      `);
    }
    
    // Get the updated category
    const result = await db.execute(sql`
      SELECT * FROM categories WHERE id = ${id}
    `);
    
    if (result.rows.length === 0) {
      return undefined;
    }
    
    const row = result.rows[0];
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      createdAt: row.created_at
    } as Category;
  }
  
  async deleteCategory(id: number): Promise<boolean> {
    const result = await db.execute(sql`
      DELETE FROM categories
      WHERE id = ${id}
      RETURNING id
    `);
    
    return result.rows.length > 0;
  }
  
  // Listing-Category relationship methods
  async addCategoryToListing(listingId: number, categoryId: number): Promise<void> {
    // First check if the relationship already exists
    const existingResult = await db.execute(sql`
      SELECT * FROM listing_categories
      WHERE listing_id = ${listingId} AND category_id = ${categoryId}
    `);
    
    if (existingResult.rows.length === 0) {
      // Relationship doesn't exist, so create it
      await db.execute(sql`
        INSERT INTO listing_categories (listing_id, category_id)
        VALUES (${listingId}, ${categoryId})
      `);
    }
  }
  
  async removeCategoryFromListing(listingId: number, categoryId: number): Promise<void> {
    await db.execute(sql`
      DELETE FROM listing_categories
      WHERE listing_id = ${listingId} AND category_id = ${categoryId}
    `);
  }
  
  async getListingCategories(listingId: number): Promise<Category[]> {
    const result = await db.execute(sql`
      SELECT c.* FROM categories c
      JOIN listing_categories lc ON c.id = lc.category_id
      WHERE lc.listing_id = ${listingId}
      ORDER BY c.name ASC
    `);
    
    return result.rows.map(row => ({
      id: row.id,
      name: row.name,
      description: row.description,
      createdAt: row.created_at
    })) as Category[];
  }
  
  async getCategoryListings(categoryId: number): Promise<Listing[]> {
    const result = await db.execute(sql`
      SELECT l.* FROM listings l
      JOIN listing_categories lc ON l.id = lc.listing_id
      WHERE lc.category_id = ${categoryId}
      ORDER BY l.created_at DESC
    `);
    
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
      
      userId: row.user_id
    })) as Listing[];
  }

  // User methods implementation
  async createUser(userData: InsertUser): Promise<User> {
    // Hash the password before storing
    const passwordHash = await hash(userData.password, 10);
    
    const result = await db.execute(sql`
      INSERT INTO users (
        email,
        username,
        password_hash,
        first_name,
        last_name,
        is_verified
      ) VALUES (
        ${userData.email},
        ${userData.username},
        ${passwordHash},
        ${userData.firstName || null},
        ${userData.lastName || null},
        false
      )
      RETURNING *
    `);
    
    const row = result.rows[0];
    return {
      id: row.id,
      email: row.email,
      username: row.username,
      passwordHash: row.password_hash,
      firstName: row.first_name,
      lastName: row.last_name,
      isVerified: row.is_verified,
      createdAt: row.created_at
    } as User;
  }
  
  async getUserById(id: number): Promise<User | undefined> {
    const result = await db.execute(sql`
      SELECT * FROM users WHERE id = ${id}
    `);
    
    if (result.rows.length === 0) {
      return undefined;
    }
    
    const row = result.rows[0];
    return {
      id: row.id,
      email: row.email,
      username: row.username,
      passwordHash: row.password_hash,
      firstName: row.first_name,
      lastName: row.last_name,
      isVerified: row.is_verified,
      createdAt: row.created_at
    } as User;
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.execute(sql`
      SELECT * FROM users WHERE email = ${email}
    `);
    
    if (result.rows.length === 0) {
      return undefined;
    }
    
    const row = result.rows[0];
    return {
      id: row.id,
      email: row.email,
      username: row.username,
      passwordHash: row.password_hash,
      firstName: row.first_name,
      lastName: row.last_name,
      isVerified: row.is_verified,
      createdAt: row.created_at
    } as User;
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.execute(sql`
      SELECT * FROM users WHERE username = ${username}
    `);
    
    if (result.rows.length === 0) {
      return undefined;
    }
    
    const row = result.rows[0];
    return {
      id: row.id,
      email: row.email,
      username: row.username,
      passwordHash: row.password_hash,
      firstName: row.first_name,
      lastName: row.last_name,
      isVerified: row.is_verified,
      createdAt: row.created_at
    } as User;
  }
  
  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    const existingUser = await this.getUserById(id);
    
    if (!existingUser) {
      return undefined;
    }
    
    if (Object.keys(userData).length === 0) {
      return existingUser;
    }
    
    if (userData.email !== undefined) {
      await db.execute(sql`
        UPDATE users
        SET email = ${userData.email}
        WHERE id = ${id}
      `);
    }
    
    if (userData.username !== undefined) {
      await db.execute(sql`
        UPDATE users
        SET username = ${userData.username}
        WHERE id = ${id}
      `);
    }
    
    if (userData.password !== undefined) {
      const passwordHash = await hash(userData.password, 10);
      await db.execute(sql`
        UPDATE users
        SET password_hash = ${passwordHash}
        WHERE id = ${id}
      `);
    }
    
    if (userData.firstName !== undefined) {
      await db.execute(sql`
        UPDATE users
        SET first_name = ${userData.firstName}
        WHERE id = ${id}
      `);
    }
    
    if (userData.lastName !== undefined) {
      await db.execute(sql`
        UPDATE users
        SET last_name = ${userData.lastName}
        WHERE id = ${id}
      `);
    }
    
    // Get the updated user
    return await this.getUserById(id);
  }
  
  async verifyUser(email: string): Promise<boolean> {
    const result = await db.execute(sql`
      UPDATE users
      SET is_verified = true
      WHERE email = ${email}
      RETURNING id
    `);
    
    return result.rows.length > 0;
  }
  
  async validatePassword(email: string, password: string): Promise<User | null> {
    const user = await this.getUserByEmail(email);
    
    if (!user) {
      return null;
    }
    
    const isValid = await compare(password, user.passwordHash);
    
    if (!isValid) {
      return null;
    }
    
    return user;
  }
  
  // Favorites methods
  async addFavorite(userId: number, listingId: number): Promise<Favorite> {
    // Check if the favorite already exists
    const existingResult = await db.execute(sql`
      SELECT * FROM favorites
      WHERE user_id = ${userId} AND listing_id = ${listingId}
    `);
    
    if (existingResult.rows.length > 0) {
      const row = existingResult.rows[0];
      return {
        id: row.id,
        userId: row.user_id,
        listingId: row.listing_id,
        createdAt: row.created_at
      } as Favorite;
    }
    
    // If not, create new favorite
    const result = await db.execute(sql`
      INSERT INTO favorites (user_id, listing_id)
      VALUES (${userId}, ${listingId})
      RETURNING *
    `);
    
    const row = result.rows[0];
    return {
      id: row.id,
      userId: row.user_id,
      listingId: row.listing_id,
      createdAt: row.created_at
    } as Favorite;
  }
  
  async removeFavorite(userId: number, listingId: number): Promise<boolean> {
    const result = await db.execute(sql`
      DELETE FROM favorites
      WHERE user_id = ${userId} AND listing_id = ${listingId}
      RETURNING id
    `);
    
    return result.rows.length > 0;
  }
  
  async getUserFavorites(userId: number): Promise<Listing[]> {
    const result = await db.execute(sql`
      SELECT l.* FROM listings l
      JOIN favorites f ON l.id = f.listing_id
      WHERE f.user_id = ${userId}
      ORDER BY f.created_at DESC
    `);
    
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
      
      userId: row.user_id
    })) as Listing[];
  }
  
  async isFavorite(userId: number, listingId: number): Promise<boolean> {
    const result = await db.execute(sql`
      SELECT * FROM favorites
      WHERE user_id = ${userId} AND listing_id = ${listingId}
    `);
    
    return result.rows.length > 0;
  }
}

// In-memory storage implementation
export class MemStorage implements IStorage {
  private listings: Record<number, Listing>;
  private categories: Record<number, Category>;
  private users: Record<number, User>;
  private favorites: Record<number, Favorite>;
  private listingCategories: Record<string, { listingId: number, categoryId: number }>;
  private listingCurrentId: number;
  private categoryCurrentId: number;
  private userCurrentId: number;
  private favoriteCurrentId: number;

  constructor() {
    this.listings = {};
    this.categories = {};
    this.users = {};
    this.favorites = {};
    this.listingCategories = {};
    this.listingCurrentId = 1;
    this.categoryCurrentId = 1;
    this.userCurrentId = 1;
    this.favoriteCurrentId = 1;
  }

  async createListing(listingData: CreateListing): Promise<Listing> {
    // Check if we have a userId - all listings must be associated with a user now
    if (!listingData.userId) {
      throw new Error("User ID is required to create a listing");
    }
    
    const id = this.listingCurrentId++;
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
      userId: listingData.userId
    };
    
    this.listings[id] = listing;
    return listing;
  }
  
  async getUserListings(userId: number): Promise<Listing[]> {
    return Object.values(this.listings).filter(listing => listing.userId === userId);
  }

  async getListing(id: number): Promise<Listing | undefined> {
    return this.listings[id];
  }

  async getAllListings(): Promise<Listing[]> {
    return Object.values(this.listings);
  }

  async updateListing(id: number, listingUpdate: Partial<InsertListing>): Promise<Listing | undefined> {
    const listing = this.listings[id];
    
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
      userId: listingUpdate.userId ?? listing.userId
    };
    
    this.listings[id] = updatedListing;
    return updatedListing;
  }

  async deleteListing(id: number): Promise<boolean> {
    if (this.listings[id]) {
      delete this.listings[id];
      return true;
    }
    return false;
  }
  
  // Category methods
  async createCategory(categoryData: CreateCategory): Promise<Category> {
    const id = this.categoryCurrentId++;
    const createdAt = new Date();
    
    const category: Category = {
      id,
      name: categoryData.name,
      description: categoryData.description || null,
      createdAt
    };
    
    this.categories[id] = category;
    return category;
  }
  
  async getCategory(id: number): Promise<Category | undefined> {
    return this.categories[id];
  }
  
  async getCategoryByName(name: string): Promise<Category | undefined> {
    return Object.values(this.categories).find(
      (category) => category.name === name
    );
  }
  
  async getAllCategories(): Promise<Category[]> {
    return Object.values(this.categories).sort((a, b) => 
      a.name.localeCompare(b.name)
    );
  }
  
  async updateCategory(id: number, categoryUpdate: Partial<InsertCategory>): Promise<Category | undefined> {
    const category = this.categories[id];
    
    if (!category) {
      return undefined;
    }
    
    const updatedCategory: Category = {
      id: category.id,
      name: categoryUpdate.name ?? category.name,
      description: categoryUpdate.description ?? category.description,
      createdAt: category.createdAt
    };
    
    this.categories[id] = updatedCategory;
    return updatedCategory;
  }
  
  async deleteCategory(id: number): Promise<boolean> {
    // Also remove all relationships with this category
    if (this.categories[id]) {
      delete this.categories[id];
      
      // Filter out relationships with this category
      Object.keys(this.listingCategories).forEach(key => {
        const value = this.listingCategories[key];
        if (value.categoryId === id) {
          delete this.listingCategories[key];
        }
      });
      
      return true;
    }
    
    return false;
  }
  
  // Listing-Category relationship methods
  async addCategoryToListing(listingId: number, categoryId: number): Promise<void> {
    const relationshipKey = `${listingId}-${categoryId}`;
    
    // Only add if both the listing and category exist
    if (this.listings[listingId] && this.categories[categoryId]) {
      this.listingCategories[relationshipKey] = { listingId, categoryId };
    }
  }
  
  async removeCategoryFromListing(listingId: number, categoryId: number): Promise<void> {
    const relationshipKey = `${listingId}-${categoryId}`;
    delete this.listingCategories[relationshipKey];
  }
  
  async getListingCategories(listingId: number): Promise<Category[]> {
    const categoryIds = new Set<number>();
    
    // Find all category IDs related to this listing
    Object.values(this.listingCategories).forEach(value => {
      if (value.listingId === listingId) {
        categoryIds.add(value.categoryId);
      }
    });
    
    // Get the actual category objects
    const categories: Category[] = [];
    Array.from(categoryIds).forEach(categoryId => {
      const category = this.categories[categoryId];
      if (category) {
        categories.push(category);
      }
    });
    
    // Sort by name
    return categories.sort((a, b) => a.name.localeCompare(b.name));
  }
  
  async getCategoryListings(categoryId: number): Promise<Listing[]> {
    const listingIds = new Set<number>();
    
    // Find all listing IDs related to this category
    Object.values(this.listingCategories).forEach(value => {
      if (value.categoryId === categoryId) {
        listingIds.add(value.listingId);
      }
    });
    
    // Get the actual listing objects
    const listings: Listing[] = [];
    Array.from(listingIds).forEach(listingId => {
      const listing = this.listings[listingId];
      if (listing) {
        listings.push(listing);
      }
    });
    
    // Sort by creation date, newest first
    return listings.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  // User methods implementation
  async createUser(userData: InsertUser): Promise<User> {
    const id = this.userCurrentId++;
    // Hash the password with bcryptjs
    const passwordHash = await hash(userData.password, 10);
    const createdAt = new Date();
    
    const user: User = {
      id,
      email: userData.email,
      username: userData.username,
      passwordHash,
      firstName: userData.firstName || null,
      lastName: userData.lastName || null,
      isVerified: false,
      createdAt
    };
    
    this.users[id] = user;
    return user;
  }
  
  async getUserById(id: number): Promise<User | undefined> {
    return this.users[id];
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Object.values(this.users).find(
      (user) => user.email === email
    );
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    return Object.values(this.users).find(
      (user) => user.username === username
    );
  }
  
  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    const user = this.users[id];
    
    if (!user) {
      return undefined;
    }
    
    // Create a fresh updated user
    const updatedUser: User = {
      ...user,
      email: userData.email ?? user.email,
      username: userData.username ?? user.username,
      firstName: userData.firstName ?? user.firstName,
      lastName: userData.lastName ?? user.lastName
    };
    
    // Update password if provided
    if (userData.password) {
      updatedUser.passwordHash = await hash(userData.password, 10);
    }
    
    this.users[id] = updatedUser;
    return updatedUser;
  }
  
  async verifyUser(email: string): Promise<boolean> {
    const user = await this.getUserByEmail(email);
    
    if (!user) {
      return false;
    }
    
    user.isVerified = true;
    return true;
  }
  
  async validatePassword(email: string, password: string): Promise<User | null> {
    const user = await this.getUserByEmail(email);
    
    if (!user) {
      return null;
    }
    
    const isValid = await compare(password, user.passwordHash);
    
    if (!isValid) {
      return null;
    }
    
    return user;
  }
  
  // Favorites methods
  async addFavorite(userId: number, listingId: number): Promise<Favorite> {
    // Check if the user and listing exist
    if (!this.users[userId] || !this.listings[listingId]) {
      throw new Error("User or listing not found");
    }
    
    // Check if favorite already exists
    const existing = Object.values(this.favorites).find(
      fav => fav.userId === userId && fav.listingId === listingId
    );
    
    if (existing) {
      return existing;
    }
    
    // Create a new favorite
    const id = this.favoriteCurrentId++;
    const createdAt = new Date();
    
    const favorite: Favorite = {
      id,
      userId,
      listingId,
      createdAt
    };
    
    this.favorites[id] = favorite;
    return favorite;
  }
  
  async removeFavorite(userId: number, listingId: number): Promise<boolean> {
    const favoriteId = Object.values(this.favorites).find(
      fav => fav.userId === userId && fav.listingId === listingId
    )?.id;
    
    if (favoriteId !== undefined) {
      delete this.favorites[favoriteId];
      return true;
    }
    
    return false;
  }
  
  async getUserFavorites(userId: number): Promise<Listing[]> {
    // Find all favorites for this user
    const favoritedListingIds = Object.values(this.favorites)
      .filter(fav => fav.userId === userId)
      .map(fav => fav.listingId);
    
    // Get the actual listing objects
    const listings: Listing[] = [];
    favoritedListingIds.forEach(listingId => {
      const listing = this.listings[listingId];
      if (listing) {
        listings.push(listing);
      }
    });
    
    // Sort by creation date, newest first
    return listings.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  
  async isFavorite(userId: number, listingId: number): Promise<boolean> {
    return Object.values(this.favorites).some(
      fav => fav.userId === userId && fav.listingId === listingId
    );
  }
}

// Use the database storage implementation
export const storage = new DbStorage();
