import { api } from "@/lib/api";

export interface ProductOption {
  id: string;
  name: string;
  quantity: number;
}

export interface Store {
  id: string;
  name: string;
  description: string;
  whatsapp: string;
  photoUrl: string;
  status: boolean;
  isAvailable: boolean;
}

export interface Product {
  id: string;
  value: number;
  name: string;
  description: string;
  category: string;
  photoUrl: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  productOptions?: ProductOption[];
  store?: Store;
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

export interface PaginatedProductsResponse {
  data: Product[];
  hasMore: boolean;
  total: number;
}

export interface BackendProductsResponse {
  products: Product[];
  count: number;
}

export const productService = {
  async getProductsByStore(
    storeId?: string,
    params?: {
      page?: number;
      pageSize?: number;
      name?: string;
      category?: string;
      weekday?: number;
      hours?: string;
    },
  ): Promise<PaginatedProductsResponse> {
    const response = await api.get<BackendProductsResponse>("/product", {
      params: { storeId, ...params },
    });
    const { products, count } = response.data;
    const pageSize = params?.pageSize || 20;
    const hasMore = products.length === pageSize;
    return {
      data: products,
      hasMore,
      total: count,
    };
  },

  async getProductsWithCountsByStore(
    storeId: string,
  ): Promise<FindAllProductsResponse> {
    const response = await api.get<FindAllProductsResponse>(
      "/product/dashboard",
      { params: { storeId } },
    );
    return response.data;
  },

  async getProductById(productId: string): Promise<Product> {
    const response = await api.get<Product>(`/product/${productId}`);
    return response.data;
  },

  async createProduct(data: {
    name: string;
    description: string;
    value: number;
    category: "sweet" | "savory";
    storeId: string;
    photo: File;
    productOptions: { name: string; quantity: number }[];
  }): Promise<Product> {
    const formData = new FormData();
    formData.append("name", data.name);
    formData.append("description", data.description);
    formData.append("value", data.value.toString());
    formData.append("category", data.category);
    formData.append("storeId", data.storeId);
    formData.append("photo", data.photo);
    formData.append("productOptions", JSON.stringify(data.productOptions));

    const response = await api.post<Product>("/product", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  async updateProduct(data: {
    id: string;
    name: string;
    description: string;
    value: number;
    category: "sweet" | "savory";
    photo?: File;
    productOptions: {
      updated: { id: string; name: string; quantity: number }[];
      deleted: { id: string; name: string; quantity: number }[];
      new: { name: string; quantity: number }[];
    };
  }): Promise<Product> {
    const formData = new FormData();
    formData.append("name", data.name);
    formData.append("description", data.description);
    formData.append("value", data.value.toString());
    formData.append("category", data.category);
    formData.append("productOptions", JSON.stringify(data.productOptions));

    if (data.photo) {
      formData.append("photo", data.photo);
    }

    const response = await api.put<Product>(`/product/${data.id}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  async deleteProduct(productId: string): Promise<void> {
    await api.delete(`/product/${productId}`);
  },
};
