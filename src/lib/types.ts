

export type Product = {
  id: string;
  name: string;
  artisan: Artisan;
  price: number;
  image: {
    url: string;
    hint: string;
  };
  additionalImageUrls?: string[];
  category: string;
  description: string;
  story?: string;
  likes: number;
  sales: number;
  createdAt?: string; // Add this line
  reviews?: {
      rating: number;
      count: number;
  },
  materials?: string;
  dimensions?: string;
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
    

    