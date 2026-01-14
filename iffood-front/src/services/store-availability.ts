import { api } from "@/lib/api";

export interface StoreAvailability {
  id: string;
  weekday: number;
  start: string;
  end: string;
}

export interface UpdateStoreAvailabilityUnit {
  weekday: number;
  start: string;
  end: string;
}

export interface UpdateStoreAvailabilityDto {
  storeId: string;
  availabilities: UpdateStoreAvailabilityUnit[];
}

export const storeAvailabilityService = {
  async getByStoreId(storeId: string): Promise<StoreAvailability[]> {
    const response = await api.get<StoreAvailability[]>(
      `/store/store-availability/${storeId}`
    );
    return response.data;
  },

  async updateAvailabilities(data: UpdateStoreAvailabilityDto): Promise<void> {
    await api.put("/store/store-availability/full", data);
  },
};
