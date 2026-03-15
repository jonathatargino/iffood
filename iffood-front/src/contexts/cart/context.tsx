import { createContext, useContext } from "react";
import type { CartContextValue } from "./types";

const INITIAL_CART_STATE: CartContextValue["state"] = {
  store: null,
  items: [],
  cartId: crypto.randomUUID(),
};

export const CartContext = createContext<CartContextValue>({
  state: INITIAL_CART_STATE,
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
