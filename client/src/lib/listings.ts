import { Listing, CreateListingForm } from "@/types/listing";
import { apiRequest } from "@/lib/queryClient";

// LocalStorage keys
const LISTINGS_STORAGE_KEY = "small-things-listings";
const MY_LISTINGS_KEY = "small-things-my-listings";

// Function to save a listing's edit token to localStorage
export function saveListingToken(listingId: number, editToken: string): void {
  // Get current listings or initialize empty object
  const myListings = getMyListings();
  
  // Save this listing in my listings
  myListings[listingId] = editToken;
  
  // Update storage
  localStorage.setItem(MY_LISTINGS_KEY, JSON.stringify(myListings));
}

// Function to get edit token for a listing
export function getListingToken(listingId: number): string | null {
  const myListings = getMyListings();
  return myListings[listingId] || null;
}

// Function to get all my listings
export function getMyListings(): Record<number, string> {
  try {
    const listingsData = localStorage.getItem(MY_LISTINGS_KEY);
    if (!listingsData) return {};
    return JSON.parse(listingsData);
  } catch (error) {
    console.error("Error parsing my listings from localStorage", error);
    return {};
  }
}

// Delete a listing token
export function deleteListingToken(listingId: number): void {
  const myListings = getMyListings();
  
  if (myListings[listingId]) {
    delete myListings[listingId];
    localStorage.setItem(MY_LISTINGS_KEY, JSON.stringify(myListings));
  }
}

// Create a new listing
export async function createListing(listing: CreateListingForm): Promise<Listing> {
  const response = await apiRequest("POST", "/api/listings", listing);
  const newListing = await response.json();
  
  // Save edit token to localStorage
  saveListingToken(newListing.id, newListing.editToken);
  
  return newListing;
}

// Update a listing
export async function updateListing(
  listingId: number, 
  editToken: string, 
  updates: Partial<CreateListingForm>
): Promise<Listing> {
  const response = await apiRequest(
    "PATCH", 
    `/api/listings/${listingId}?editToken=${editToken}`, 
    updates
  );
  return await response.json();
}

// Delete a listing
export async function deleteListing(listingId: number, editToken: string): Promise<boolean> {
  await apiRequest(
    "DELETE", 
    `/api/listings/${listingId}?editToken=${editToken}`
  );
  
  // Remove from localStorage
  deleteListingToken(listingId);
  return true;
}

// Format currency
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

// Format date
export function formatDate(date: Date | string): string {
  if (typeof date === 'string') {
    date = new Date(date);
  }
  
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}
