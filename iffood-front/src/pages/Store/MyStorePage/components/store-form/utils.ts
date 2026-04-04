import type { CreateStoreData } from "@/services/store";
import type { StoreFormData } from "./schema";

export function toCreateStoreData(formData: StoreFormData): CreateStoreData {
  const { name, description, whatsapp, photo } = formData;

  return {
    name,
    description,
    whatsapp: whatsapp.replace(/\D/g, ""),
    photo,
  };
}
