export interface Address {
  id: string;
  userId: string | null;
  fullName: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  postalCode: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  productType: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl: string | null;
  createdAt: Date;
}

export interface Order {
  id: string;
  userId: string | null;
  addressId: string | null;
  status: string;
  subtotal: number;
  deliveryFee: number;
  total: number;
  items: OrderItem[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateOrderInput {
  addressId: string;
}
