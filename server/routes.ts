import express, { type Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { createListingSchema } from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";

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
    
    const listing = await storage.getListing(id);
    
    if (!listing) {
      return res.status(404).json({ message: "Listing not found" });
    }
    
    if (listing.editToken !== editToken) {
      return res.status(403).json({ message: "Invalid edit token" });
    }
    
    try {
      // Only validate the fields that are being updated
      const updateSchema = createListingSchema.partial();
      const validatedUpdate = updateSchema.parse(req.body);
      
      const updatedListing = await storage.updateListing(id, validatedUpdate);
      res.json(updatedListing);
    } catch (error) {
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
    
    const listing = await storage.getListing(id);
    
    if (!listing) {
      return res.status(404).json({ message: "Listing not found" });
    }
    
    if (listing.editToken !== editToken) {
      return res.status(403).json({ message: "Invalid edit token" });
    }
    
    const success = await storage.deleteListing(id);
    
    if (success) {
      res.status(204).end();
    } else {
      res.status(500).json({ message: "Failed to delete listing" });
    }
  });

  // Register API routes
  app.use("/api", router);

  const httpServer = createServer(app);
  return httpServer;
}
