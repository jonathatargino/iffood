import type { Product, ProductOption } from "@/services/product";
import type { Store } from "@/services/store";

export interface CartItem {
  product: Product;
  productOption: ProductOption;
  quantity: number;
}

export interface CartState {
  store: Store | null;
  items: CartItem[];
  cartId: string;
}
export interface CartContextValue {
  state: CartState;
  addItem: (item: CartItem, store: Store) => boolean;
  removeItem: (productOptionId: string) => void;
  updateQuantity: (productOptionId: string, quantity: number) => void;
  clearCart: () => void;
  itemCount: number;
  total: number;
}

export interface CartAddItemAction {
  type: "ADD_ITEM";
  payload: {
    item: CartItem;
    store: Store;
  };
}

export interface CartRemoveItemAction {
  type: "REMOVE_ITEM";
  payload: {
    productOptionId: string;
  };
}

export interface CartUpdateQuantityAction {
  type: "UPDATE_QUANTITY";
  payload: {
    productOptionId: string;
    quantity: number;
  };
}

export interface CartClearAction {
  type: "CLEAR_CART";
}

export type CartAction =
  | CartAddItemAction
  | CartRemoveItemAction
  | CartUpdateQuantityAction
  | CartClearAction;
