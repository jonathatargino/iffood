import { parsePriceInputToCents } from "@/utils/currency";
import type { ProductFormData } from "./schema";

export const PRODUCT_CATEGORIES = [
  { value: "savory", label: "Salgado" },
  { value: "sweet", label: "Doce" },
] as const;

export const MAX_FLAVORS = 10;

export function toUpdateProductData(productId: string, data: ProductFormData) {
  const updatedFlavors = data.flavors
    .filter((f) => f.status === "updated" && f.id)
    .map((f) => ({
      id: f.id!,
      name: f.name,
      quantity: f.quantity,
    }));

  const deletedFlavors = data.flavors
    .filter((f) => f.status === "deleted" && f.id)
    .map((f) => ({
      id: f.id!,
      name: f.name,
      quantity: f.quantity,
    }));

  const newFlavors = data.flavors
    .filter((f) => f.status === "new")
    .map((f) => ({
      name: f.name,
      quantity: f.quantity,
    }));

  return {
    id: productId!,
    name: data.name,
    description: data.description,
    value: parsePriceInputToCents(data.price),
    category: data.category,
    photo: data.image || undefined,
    productOptions: {
      updated: updatedFlavors,
      deleted: deletedFlavors,
      new: newFlavors,
    },
  };
}

export function toCreateProductData(storeId: string, data: ProductFormData) {
  const activeFlavors = data.flavors.filter((f) => f.status !== "deleted");

  return {
    name: data.name,
    description: data.description,
    value: parsePriceInputToCents(data.price),
    category: data.category,
    storeId,
    photo: data.image!,
    productOptions: activeFlavors.map((f) => ({
      name: f.name,
      quantity: f.quantity,
    })),
  };
}
