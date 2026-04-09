import { api } from "@/lib/api";
import type { Product } from "./product";
import type { Review } from "@/models/review";

export interface Store {
  id: string;
  name: string;
  description: string;
  whatsapp: string;
  photoUrl: string;
  status: boolean;
  createdAt: string;
  updatedAt: string;
  isAvailable: boolean;
  rating: number;
  products?: Product[];
  reviews?: Review[];
  reviewResume?: string;
}

export interface CreateStoreData {
  name: string;
  description: string;
  whatsapp: string;
  photo: File | null | undefined;
}

export interface UpdateStoreData {
  name: string;
  description: string;
  whatsapp: string;
  status?: boolean;
}

export interface PaginatedStoresResponse {
  data: Store[];
  hasMore: boolean;
  total: number;
}

export interface BackendStoresResponse {
  stores: Store[];
  count: number;
}

export const storeService = {
  async getById(storeId: string): Promise<Store> {
    const response = await api.get<Store>(`/store/${storeId}`);
    return response.data;
  },

  async getMyStore(): Promise<Store[]> {
    const response = await api.get<Store[]>("/store/me");
    return response.data;
  },

  async getAllStores(params?: {
    name?: string;
    pageSize?: number;
    page?: number;
    weekday?: number;
    hours?: string;
  }): Promise<PaginatedStoresResponse> {
    const response = await api.get<BackendStoresResponse>("/store", { params });
    const { stores, count } = response.data;
    const pageSize = params?.pageSize || 20;
    const hasMore = stores.length === pageSize;
    return {
      data: stores,
      hasMore,
      total: count,
    };
  },

  async createStore(data: CreateStoreData): Promise<Store> {
    const formData = new FormData();
    formData.append("name", data.name);
    formData.append("description", data.description);
    formData.append("whatsapp", data.whatsapp);

    if (data.photo) {
      formData.append("photo", data.photo);
    }

    const response = await api.post<Store>("/store", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return response.data;
  },

  async updateStore(storeId: string, data: UpdateStoreData): Promise<Store> {
    const response = await api.put<Store>(`/store/${storeId}`, data);
    return response.data;
  },

  async updateStorePhoto(storeId: string, photo: File): Promise<void> {
    const formData = new FormData();
    formData.append("photo", photo);

    await api.patch(`/store/${storeId}/photo`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  async deleteStore(storeId: string): Promise<void> {
    await api.delete(`/store/${storeId}`);
  },
};
