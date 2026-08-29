export type ProductType = "food";

export interface CartItem {
  id: string;
  cartId: string;
  productId: string;
  productType: ProductType;
  name: string;
  price: number;
  quantity: number;
  imageUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Cart {
  id: string;
  userId: string | null;
  guestId: string | null;
  items: CartItem[];
  createdAt: Date;
  updatedAt: Date;
}

export interface AddToCartInput {
  productId: string;
  productType: ProductType;
  quantity?: number;
}
