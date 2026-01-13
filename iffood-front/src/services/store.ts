import { api } from "@/lib/api";

export interface Store {
  id: string;
  name: string;
  description: string;
  whatsapp: string;
  photoUrl: string;
  status: boolean;
  createdAt: string;
  updatedAt: string;
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

export const storeService = {
  async getMyStore(): Promise<Store[]> {
    const response = await api.get<Store[]>("/store/me");
    return response.data;
  },

  async getAllStores(params?: {
    name?: string;
    pageSize?: number;
    page?: number;
  }): Promise<Store[]> {
    const response = await api.get<Store[]>("/store", { params });
    return response.data;
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
