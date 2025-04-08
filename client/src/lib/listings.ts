import { Listing, CreateListingForm, Coordinates } from "@/types/listing";
import { apiRequest, queryClient } from "@/lib/queryClient";

// Function to get user's listings from the API (replaces the localStorage version)
export async function getMyListings(): Promise<Listing[]> {
  return apiRequest({
    method: "GET",
    url: "/api/user/listings"
  });
}

// Create a new listing
export async function createListing(listing: CreateListingForm): Promise<Listing> {
  const newListing = await apiRequest({
    method: "POST", 
    url: "/api/listings", 
    body: listing
  });
  
  // Invalidate the listings query to ensure updated data on dashboard
  queryClient.invalidateQueries({ queryKey: ['/api/listings'] });
  // Also invalidate user listings
  queryClient.invalidateQueries({ queryKey: ['/api/user/listings'] });
  
  return newListing;
}

// Update a listing - now requires authentication instead of edit token
export async function updateListing(
  listingId: number, 
  updates: Partial<CreateListingForm>
): Promise<Listing> {
  const updatedListing = await apiRequest({
    method: "PATCH", 
    url: `/api/listings/${listingId}`, 
    body: updates
  });
  
  // Invalidate queries
  queryClient.invalidateQueries({ queryKey: [`/api/listings/${listingId}`] });
  queryClient.invalidateQueries({ queryKey: ['/api/listings'] });
  queryClient.invalidateQueries({ queryKey: ['/api/user/listings'] });
  
  return updatedListing;
}

// Delete a listing
export async function deleteListing(listingId: number): Promise<boolean> {
  await apiRequest({
    method: "DELETE", 
    url: `/api/listings/${listingId}`
  });
  
  // Invalidate the queries to ensure dashboard updates
  queryClient.invalidateQueries({ queryKey: ['/api/listings'] });
  queryClient.invalidateQueries({ queryKey: ['/api/user/listings'] });
  
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
