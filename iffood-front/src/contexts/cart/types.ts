import type { Product, ProductOption } from "@/services/product";
import type { Store } from "@/services/store";

export interface CartItem {
  product: Product;
  productOption: ProductOption;
  quantity: number;
}

export interface CartState {
  store: Pick<Store, "id" | "name" | "whatsapp"> | null;
  items: CartItem[];
  cartId: string;
}

export interface CartContextValue {
  state: CartState;
  addItem: (
    item: CartItem,
    store: { id: string; name: string; whatsapp: string },
  ) => boolean;
  removeItem: (productOptionId: string) => void;
  updateQuantity: (productOptionId: string, quantity: number) => void;
  clearCart: () => void;
  itemCount: number;
  total: number;
  needsStoreSwitch: (storeId: string) => boolean;
  switchStoreAndAdd: (
    item: CartItem,
    store: { id: string; name: string; whatsapp: string },
  ) => void;
}
