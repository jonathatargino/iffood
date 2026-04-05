export interface ReviewRequest {
  id: string;
  status: string;
  orderRequestId: string;
  createdAt: Date;
  storeId: string;
  storeName: string;
  storePhotoUrl: string;
}

export interface Review {
  id: string;
  rating: number;
  tags: string[];
  description?: string;
  reviewRequestId: string;
  createdAt: Date;
}
