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
  pickupInstructions: string;
  paymentInfo?: string;
  address?: string;
  coordinates?: Coordinates;
  createdAt: Date;
  editToken: string;
}

export interface CreateListingForm {
  title: string;
  description?: string;
  items: Item[];
  pickupInstructions: string;
  paymentInfo?: string;
  address?: string;
  coordinates?: Coordinates;
}
