

export type Product = {
  id: string;
  name: string;
  artisan: any; // Can be a reference
  price: number;
  mainImageUrl: string;
  image: {
    url: string;
    hint: string;
  };
  category: string;
  description: string;
  story?: string;
  likes?: number;
  sales?: number;
  createdAt?: any; // Can be a server timestamp
  reviews?: {
      rating: number;
      count: number;
  },
  availableQuantity?: number;
};

export type Artisan = {
  id: string;
  name: string;
  avatar: {
    url:string;
    hint: string;
  };
  crafts?: string[];
  phone?: string;
  categories?: string[];
};

export type Category = {
  id: string;
  name: string;
  icon: React.ElementType;
};

export type Language = {
  code: string;
  name: string;
  nativeName: string;
};

export type SponsorRequest = {
    id: string;
    name: string;
    avatarUrl: string;
    monthlyContribution: number;
    sharePercentage: number;
    message: string;
}

export type SavedCollection = {
    id: string;
    name: string;
    productIds: string[];
}

export type SavedAdvertisement = {
  id: string;
  videoUrl: string;
  description: string;
  createdAt: string;
};
    
export type CustomizationRequest = {
  id?: string;
  buyerId: string;
  buyerName: string;
  buyerShippingAddress: string;
  referenceImageUrl?: string;
  generatedImageUrl: string;
  description: string;
  category: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: any; // for serverTimestamp
  artisanId?: string;
  artisanName?: string;
  price?: number;
};

export type Order = {
  id?: string;
  artisan: any; // DocumentReference
  buyer: any; // DocumentReference
  product: any; // DocumentReference
  productName: string;
  productImageUrl: string;
  buyerName: string;
  artisanName: string;
  quantity: number;
  totalAmount: number;
  status: 'Processing' | 'Shipped' | 'Delivered';
  shippingAddress: string;
  paymentId: string;
  customizationDetails?: string;
  orderDate: any; // serverTimestamp
  createdAt: any; // serverTimestamp
  updatedAt: any; // serverTimestamp
};

export type Notification = {
  id: string;
  title: string;
  message: string;
  type: 'customization_request' | 'new_order' | 'sponsor_request' | 'milestone';
  link: string;
  createdAt: any; // For serverTimestamp
  requestId?: string;
};

