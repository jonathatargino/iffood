import type { CartState } from "./types";

const STORAGE_KEY = "iffood-cart";

export function loadCartFromLocalStorage(): CartState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error(e);
  }

  return {
    store: null,
    items: [],
    cartId: crypto.randomUUID(),
  };
}

export function persistCartInLocalStorage(state: CartState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
