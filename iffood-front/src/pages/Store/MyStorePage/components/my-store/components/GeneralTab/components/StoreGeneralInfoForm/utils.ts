import type { UpdateStoreData } from "@/services/store";
import type { StoreInfoFormData } from "./schema";

export function toStoreUpdateData(data: StoreInfoFormData): UpdateStoreData {
  return {
    name: data.name,
    description: data.description,
    whatsapp: data.whatsapp.replace(/\D/g, ""),
  };
}
