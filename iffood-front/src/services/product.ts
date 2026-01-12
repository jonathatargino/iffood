import { api } from "@/lib/api";

export interface ProductOption {
  id: string;
  name: string;
  quantity: number;
}

export interface Product {
  id: string;
  value: number;
  name: string;
  description: string;
  photoUrl: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  productOptions?: ProductOption[];
}

export interface ProductWithCounts {
  id: string;
  value: number;
  name: string;
  description: string;
  photoUrl: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  productOptionsCount: number;
  accumulativeProductOptionsCount: number;
}

export interface FindAllProductsResponse {
  total: number;
  products: ProductWithCounts[];
}

export const productService = {
  async getProductsByStore(
    storeId?: string,
    params?: { page?: number; pageSize?: number; name?: string }
  ): Promise<Product[]> {
    const response = await api.get<Product[]>("/product", {
      params: { storeId, ...params },
    });
    return response.data;
  },

  async getProductsWithCountsByStore(
    storeId: string
  ): Promise<FindAllProductsResponse> {
    const response = await api.get<FindAllProductsResponse>(
      "/product/dashboard",
      { params: { storeId } }
    );
    return response.data;
  },
};
