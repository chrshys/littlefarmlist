export interface Item {
  name: string;
  price: number;
}

export interface Listing {
  id: number;
  title: string;
  description?: string;
  items: Item[];
  pickupInstructions: string;
  paymentInfo?: string;
  createdAt: Date;
  editToken: string;
}

export interface CreateListingForm {
  title: string;
  description?: string;
  items: Item[];
  pickupInstructions: string;
  paymentInfo?: string;
}
