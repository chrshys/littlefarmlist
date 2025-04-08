export interface Item {
  name: string;
  price: number;
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface Listing {
  id: number;
  title: string;
  description?: string;
  items: Item[];
  categories?: string[];
  pickupInstructions: string;
  paymentInfo?: string;
  address?: string;
  coordinates?: Coordinates;
  imageUrl?: string;
  createdAt: Date;
  userId: number; // This is now required
}

export interface CreateListingForm {
  title: string;
  description?: string;
  items: Item[];
  categories?: string[];
  pickupInstructions: string;
  paymentInfo?: string;
  address?: string;
  coordinates?: Coordinates;
  imageUrl?: string;
}
