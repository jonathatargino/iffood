import { createContext, useContext } from "react";
import type { CartContextValue } from "./types";

const EMPTY_CART_STATE = {
  storeId: null,
  storeName: null,
  storeWhatsapp: null,
  items: [],
  cartId: crypto.randomUUID(),
};

export const CartContext = createContext<CartContextValue>({
  state: EMPTY_CART_STATE,
  addItem: () => false,
  removeItem: () => {},
  updateQuantity: () => {},
  clearCart: () => {},
  itemCount: 0,
  total: 0,
  needsStoreSwitch: () => false,
  switchStoreAndAdd: () => {},
});

export function useCart() {
  return useContext(CartContext);
}
