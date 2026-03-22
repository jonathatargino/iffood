import type { Product } from "@/services/product";

// !TODO: improve this, currently O(n*m)
export function getProductOptionMaxQuantitiesById(products: Product[]) {
  const map = new Map<string, number>();

  for (const product of products) {
    const productOptions = product.productOptions || [];

    for (const option of productOptions) {
      map.set(option.id, option.quantity);
    }
  }

  return map;
}
