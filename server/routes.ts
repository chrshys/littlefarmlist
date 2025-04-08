import express, { type Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { createListingSchema, createCategorySchema, insertUserSchema, loginUserSchema, toggleFavoriteSchema } from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import passport from "./auth";
import { isAuthenticated } from "./auth";

export async function registerRoutes(app: Express): Promise<Server> {
  const router = express.Router();

  // Create a new listing
  router.post("/listings", async (req, res) => {
    try {
      const listingData = createListingSchema.parse(req.body);
      const listing = await storage.createListing(listingData);
      res.status(201).json(listing);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        res.status(400).json({ message: validationError.message });
      } else {
        res.status(500).json({ message: "Failed to create listing" });
      }
    }
  });

  // Get all listings
  router.get("/listings", async (req, res) => {
    try {
      const listings = await storage.getAllListings();
      res.json(listings);
    } catch (error) {
      console.error("Error fetching all listings:", error);
      res.status(500).json({ message: "Failed to fetch listings" });
    }
  });

  // Get a listing by ID
  router.get("/listings/:id", async (req, res) => {
    const id = parseInt(req.params.id, 10);
    
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid listing ID" });
    }
    
    const listing = await storage.getListing(id);
    
    if (!listing) {
      return res.status(404).json({ message: "Listing not found" });
    }
    
    res.json(listing);
  });

  // Update a listing
  router.patch("/listings/:id", async (req, res) => {
    const id = parseInt(req.params.id, 10);
    const editToken = req.query.editToken as string;
    
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid listing ID" });
    }
    
    if (!editToken) {
      return res.status(401).json({ message: "Edit token is required" });
    }
    
    // First try to get the listing directly
    const listing = await storage.getListing(id);
    
    if (!listing) {
      return res.status(404).json({ message: "Listing not found" });
    }
    
    // Log tokens for debugging
    console.log(`Comparing tokens: Listing token=${listing.editToken}, Request token=${editToken}`);
    
    if (listing.editToken !== editToken) {
      // Double-check by using getListingByEditToken method
      const listingByToken = await storage.getListingByEditToken(editToken);
      
      if (!listingByToken || listingByToken.id !== id) {
        return res.status(403).json({ message: "Invalid edit token" });
      }
    }
    
    try {
      // Only validate the fields that are being updated
      const updateSchema = createListingSchema.partial();
      const validatedUpdate = updateSchema.parse(req.body);
      
      const updatedListing = await storage.updateListing(id, validatedUpdate);
      res.json(updatedListing);
    } catch (error) {
      console.error("Error updating listing:", error);
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        res.status(400).json({ message: validationError.message });
      } else {
        res.status(500).json({ message: "Failed to update listing" });
      }
    }
  });

  // Delete a listing
  router.delete("/listings/:id", async (req, res) => {
    const id = parseInt(req.params.id, 10);
    const editToken = req.query.editToken as string;
    
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid listing ID" });
    }
    
    if (!editToken) {
      return res.status(401).json({ message: "Edit token is required" });
    }
    
    // First try to get the listing directly
    const listing = await storage.getListing(id);
    
    if (!listing) {
      return res.status(404).json({ message: "Listing not found" });
    }
    
    // Log tokens for debugging
    console.log(`Comparing tokens for delete: Listing token=${listing.editToken}, Request token=${editToken}`);
    
    if (listing.editToken !== editToken) {
      // Double-check by using getListingByEditToken method
      const listingByToken = await storage.getListingByEditToken(editToken);
      
      if (!listingByToken || listingByToken.id !== id) {
        return res.status(403).json({ message: "Invalid edit token" });
      }
    }
    
    const success = await storage.deleteListing(id);
    
    if (success) {
      res.status(204).end();
    } else {
      res.status(500).json({ message: "Failed to delete listing" });
    }
  });

  // CATEGORY ENDPOINTS
  
  // Create a new category - protected by authentication
  router.post("/categories", isAuthenticated, async (req, res) => {
    try {
      const categoryData = createCategorySchema.parse(req.body);
      
      // Check if a category with the same name already exists
      const existingCategory = await storage.getCategoryByName(categoryData.name);
      if (existingCategory) {
        return res.status(409).json({ message: "A category with this name already exists" });
      }
      
      const category = await storage.createCategory(categoryData);
      res.status(201).json(category);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        res.status(400).json({ message: validationError.message });
      } else {
        console.error("Error creating category:", error);
        res.status(500).json({ message: "Failed to create category" });
      }
    }
  });

  // Get all categories
  router.get("/categories", async (req, res) => {
    try {
      const categories = await storage.getAllCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching all categories:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  // Get a category by ID
  router.get("/categories/:id", async (req, res) => {
    const id = parseInt(req.params.id, 10);
    
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid category ID" });
    }
    
    const category = await storage.getCategory(id);
    
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }
    
    res.json(category);
  });

  // Update a category - protected by authentication
  router.patch("/categories/:id", isAuthenticated, async (req, res) => {
    const id = parseInt(req.params.id, 10);
    
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid category ID" });
    }
    
    const category = await storage.getCategory(id);
    
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }
    
    try {
      // Only validate the fields that are being updated
      const updateSchema = createCategorySchema.partial();
      const validatedUpdate = updateSchema.parse(req.body);
      
      // If name is being updated, check for uniqueness
      if (validatedUpdate.name && validatedUpdate.name !== category.name) {
        const existingCategory = await storage.getCategoryByName(validatedUpdate.name);
        if (existingCategory) {
          return res.status(409).json({ message: "A category with this name already exists" });
        }
      }
      
      const updatedCategory = await storage.updateCategory(id, validatedUpdate);
      res.json(updatedCategory);
    } catch (error) {
      console.error("Error updating category:", error);
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        res.status(400).json({ message: validationError.message });
      } else {
        res.status(500).json({ message: "Failed to update category" });
      }
    }
  });

  // Delete a category - protected by authentication
  router.delete("/categories/:id", isAuthenticated, async (req, res) => {
    const id = parseInt(req.params.id, 10);
    
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid category ID" });
    }
    
    const category = await storage.getCategory(id);
    
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }
    
    const success = await storage.deleteCategory(id);
    
    if (success) {
      res.status(204).end();
    } else {
      res.status(500).json({ message: "Failed to delete category" });
    }
  });

  // Get all listings for a category
  router.get("/categories/:id/listings", async (req, res) => {
    const id = parseInt(req.params.id, 10);
    
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid category ID" });
    }
    
    const category = await storage.getCategory(id);
    
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }
    
    try {
      const listings = await storage.getCategoryListings(id);
      res.json(listings);
    } catch (error) {
      console.error("Error fetching category listings:", error);
      res.status(500).json({ message: "Failed to fetch listings for category" });
    }
  });

  // AUTHENTICATION ENDPOINTS

  // Register a new user
  router.post("/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user with this email already exists
      const existingUserByEmail = await storage.getUserByEmail(userData.email);
      if (existingUserByEmail) {
        return res.status(409).json({ message: "User with this email already exists" });
      }
      
      // Check if user with this username already exists
      const existingUserByUsername = await storage.getUserByUsername(userData.username);
      if (existingUserByUsername) {
        return res.status(409).json({ message: "User with this username already exists" });
      }
      
      // Create new user
      const user = await storage.createUser(userData);
      
      // Remove sensitive data before sending response
      const { passwordHash, ...userWithoutPassword } = user;
      
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        res.status(400).json({ message: validationError.message });
      } else {
        console.error("Error registering user:", error);
        res.status(500).json({ message: "Failed to register user" });
      }
    }
  });
  
  // Login
  router.post("/auth/login", (req, res, next) => {
    try {
      // Validate request body
      const loginData = loginUserSchema.parse(req.body);
      
      // Use passport for authentication
      passport.authenticate("local", (err: any, user: any, info: any) => {
        if (err) {
          return next(err);
        }
        
        if (!user) {
          return res.status(401).json({ message: info?.message || "Invalid credentials" });
        }
        
        // Log in the user
        req.logIn(user, (loginErr) => {
          if (loginErr) {
            return next(loginErr);
          }
          
          // Remove sensitive data before sending response
          const { passwordHash, ...userWithoutPassword } = user;
          return res.json({
            message: "Login successful",
            user: userWithoutPassword
          });
        });
      })(req, res, next);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        res.status(400).json({ message: validationError.message });
      } else {
        next(error);
      }
    }
  });
  
  // Logout
  router.post("/auth/logout", (req, res) => {
    req.logout(function(err) {
      if (err) { 
        return res.status(500).json({ message: "Error logging out" }); 
      }
      res.json({ message: "Logged out successfully" });
    });
  });
  
  // Get current logged-in user
  router.get("/auth/user", isAuthenticated, (req, res) => {
    // Remove sensitive data before sending response
    const { passwordHash, ...userWithoutPassword } = req.user as any;
    res.json(userWithoutPassword);
  });

  // LISTING-CATEGORY RELATIONSHIP ENDPOINTS
  
  // Get all categories for a listing
  router.get("/listings/:id/categories", async (req, res) => {
    const id = parseInt(req.params.id, 10);
    
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid listing ID" });
    }
    
    const listing = await storage.getListing(id);
    
    if (!listing) {
      return res.status(404).json({ message: "Listing not found" });
    }
    
    try {
      const categories = await storage.getListingCategories(id);
      res.json(categories);
    } catch (error) {
      console.error("Error fetching listing categories:", error);
      res.status(500).json({ message: "Failed to fetch categories for listing" });
    }
  });

  // Add a category to a listing
  router.post("/listings/:listingId/categories/:categoryId", async (req, res) => {
    const listingId = parseInt(req.params.listingId, 10);
    const categoryId = parseInt(req.params.categoryId, 10);
    const editToken = req.query.editToken as string;
    
    if (isNaN(listingId) || isNaN(categoryId)) {
      return res.status(400).json({ message: "Invalid ID parameters" });
    }
    
    if (!editToken) {
      return res.status(401).json({ message: "Edit token is required" });
    }
    
    const listing = await storage.getListing(listingId);
    
    if (!listing) {
      return res.status(404).json({ message: "Listing not found" });
    }
    
    if (listing.editToken !== editToken) {
      return res.status(403).json({ message: "Invalid edit token" });
    }
    
    const category = await storage.getCategory(categoryId);
    
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }
    
    try {
      await storage.addCategoryToListing(listingId, categoryId);
      res.status(204).end();
    } catch (error) {
      console.error("Error adding category to listing:", error);
      res.status(500).json({ message: "Failed to add category to listing" });
    }
  });

  // Remove a category from a listing
  router.delete("/listings/:listingId/categories/:categoryId", async (req, res) => {
    const listingId = parseInt(req.params.listingId, 10);
    const categoryId = parseInt(req.params.categoryId, 10);
    const editToken = req.query.editToken as string;
    
    if (isNaN(listingId) || isNaN(categoryId)) {
      return res.status(400).json({ message: "Invalid ID parameters" });
    }
    
    if (!editToken) {
      return res.status(401).json({ message: "Edit token is required" });
    }
    
    const listing = await storage.getListing(listingId);
    
    if (!listing) {
      return res.status(404).json({ message: "Listing not found" });
    }
    
    if (listing.editToken !== editToken) {
      return res.status(403).json({ message: "Invalid edit token" });
    }
    
    const category = await storage.getCategory(categoryId);
    
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }
    
    try {
      await storage.removeCategoryFromListing(listingId, categoryId);
      res.status(204).end();
    } catch (error) {
      console.error("Error removing category from listing:", error);
      res.status(500).json({ message: "Failed to remove category from listing" });
    }
  });

  // FAVORITES ENDPOINTS
  
  // Get user favorites
  router.get("/favorites", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      const favorites = await storage.getUserFavorites(userId);
      res.json(favorites);
    } catch (error) {
      console.error("Error fetching user favorites:", error);
      res.status(500).json({ message: "Failed to fetch favorites" });
    }
  });
  
  // Add a favorite
  router.post("/favorites", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      const { listingId } = toggleFavoriteSchema.parse(req.body);
      
      // Check if listing exists
      const listing = await storage.getListing(listingId);
      if (!listing) {
        return res.status(404).json({ message: "Listing not found" });
      }
      
      const favorite = await storage.addFavorite(userId, listingId);
      res.status(201).json(favorite);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        res.status(400).json({ message: validationError.message });
      } else {
        console.error("Error adding favorite:", error);
        res.status(500).json({ message: "Failed to add favorite" });
      }
    }
  });
  
  // Remove a favorite
  router.delete("/favorites/:listingId", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const listingId = parseInt(req.params.listingId, 10);
      
      if (isNaN(listingId)) {
        return res.status(400).json({ message: "Invalid listing ID" });
      }
      
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      const success = await storage.removeFavorite(userId, listingId);
      
      if (success) {
        res.status(204).end();
      } else {
        res.status(404).json({ message: "Favorite not found" });
      }
    } catch (error) {
      console.error("Error removing favorite:", error);
      res.status(500).json({ message: "Failed to remove favorite" });
    }
  });
  
  // Check if a listing is favorited by the current user
  router.get("/favorites/:listingId", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const listingId = parseInt(req.params.listingId, 10);
      
      if (isNaN(listingId)) {
        return res.status(400).json({ message: "Invalid listing ID" });
      }
      
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      const isFavorite = await storage.isFavorite(userId, listingId);
      res.json({ isFavorite });
    } catch (error) {
      console.error("Error checking favorite status:", error);
      res.status(500).json({ message: "Failed to check favorite status" });
    }
  });

  // Register API routes
  app.use("/api", router);

  const httpServer = createServer(app);
  return httpServer;
}
