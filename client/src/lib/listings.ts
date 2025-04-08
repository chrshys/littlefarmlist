import { Listing, CreateListingForm, Coordinates } from "@/types/listing";
import { apiRequest, queryClient } from "@/lib/queryClient";

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
  const newListing = await apiRequest({
    method: "POST", 
    url: "/api/listings", 
    body: listing
  });
  
  // Save edit token to localStorage
  saveListingToken(newListing.id, newListing.editToken);
  
  // Invalidate the listings query to ensure updated data on dashboard
  queryClient.invalidateQueries({ queryKey: ['/api/listings'] });
  
  return newListing;
}

// Update a listing
export async function updateListing(
  listingId: number, 
  editToken: string, 
  updates: Partial<CreateListingForm>
): Promise<Listing> {
  const updatedListing = await apiRequest({
    method: "PATCH", 
    url: `/api/listings/${listingId}?editToken=${editToken}`, 
    body: updates
  });
  
  // Invalidate both the specific listing and the listings collection
  queryClient.invalidateQueries({ queryKey: [`/api/listings/${listingId}`] });
  queryClient.invalidateQueries({ queryKey: ['/api/listings'] });
  
  return updatedListing;
}

// Delete a listing
export async function deleteListing(listingId: number, editToken: string): Promise<boolean> {
  await apiRequest({
    method: "DELETE", 
    url: `/api/listings/${listingId}?editToken=${editToken}`
  });
  
  // Remove from localStorage
  deleteListingToken(listingId);
  
  // Invalidate the listings query to ensure dashboard updates
  queryClient.invalidateQueries({ queryKey: ['/api/listings'] });
  
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

// Niagara region sample addresses and coordinates
export const niagaraAddresses = [
  {
    address: "1055 Line 2 Rd, Niagara-on-the-Lake, ON",
    coordinates: { lat: 43.2418, lng: -79.1543 }
  },
  {
    address: "2487 Four Mile Creek Rd, Niagara-on-the-Lake, ON",
    coordinates: { lat: 43.1704, lng: -79.1525 }
  },
  {
    address: "3502 Sann Rd, Niagara Falls, ON",
    coordinates: { lat: 43.0895, lng: -79.0849 }
  },
  {
    address: "567 Niagara Stone Road, Niagara-on-the-Lake, ON",
    coordinates: { lat: 43.2509, lng: -79.0865 }
  },
  {
    address: "1339 Niagara Stone Rd, Niagara-on-the-Lake, ON",
    coordinates: { lat: 43.2287, lng: -79.1098 }
  },
  {
    address: "469 Queenston Rd, Niagara-on-the-Lake, ON",
    coordinates: { lat: 43.1853, lng: -79.0862 }
  },
  {
    address: "15618 Niagara Pkwy, Niagara-on-the-Lake, ON",
    coordinates: { lat: 43.1601, lng: -79.0535 }
  },
  {
    address: "3620 Seventh St, Jordan Station, ON",
    coordinates: { lat: 43.1505, lng: -79.3698 }
  }
];

// Get a random Niagara region address suggestion
export function getRandomNiagaraAddress(): { address: string, coordinates: Coordinates } {
  const randomIndex = Math.floor(Math.random() * niagaraAddresses.length);
  return niagaraAddresses[randomIndex];
}

// Convert an image file to base64 string
export function imageToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
}
