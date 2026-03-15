import { useState, useCallback, useMemo, type ReactNode } from "react";
import { CartContext } from "./context";
import type { CartItem, CartState } from "./types";

const STORAGE_KEY = "iffood-cart";

function loadCart(): CartState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {
    storeId: null,
    storeName: null,
    storeWhatsapp: null,
    items: [],
    cartId: crypto.randomUUID(),
  };
}

function saveCart(state: CartState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<CartState>(loadCart);

  const updateState = useCallback((updater: (prev: CartState) => CartState) => {
    setState((prev) => {
      const next = { ...updater(prev), cartId: crypto.randomUUID() };
      saveCart(next);
      return next;
    });
  }, []);

  const needsStoreSwitch = useCallback(
    (storeId: string) => {
      return (
        state.storeId !== null &&
        state.storeId !== storeId &&
        state.items.length > 0
      );
    },
    [state.storeId, state.items.length],
  );

  const addItem = useCallback(
    (
      item: CartItem,
      store: { id: string; name: string; whatsapp: string },
    ): boolean => {
      if (needsStoreSwitch(store.id)) {
        return false;
      }

      updateState((prev) => {
        const existingIndex = prev.items.findIndex(
          (i) => i.productOption.id === item.productOption.id,
        );

        let newItems: CartItem[];
        if (existingIndex >= 0) {
          newItems = prev.items.map((existing, idx) =>
            idx === existingIndex
              ? { ...existing, quantity: existing.quantity + item.quantity }
              : existing,
          );
        } else {
          newItems = [...prev.items, item];
        }

        return {
          ...prev,
          storeId: store.id,
          storeName: store.name,
          storeWhatsapp: store.whatsapp,
          items: newItems,
        };
      });

      return true;
    },
    [needsStoreSwitch, updateState],
  );

  const switchStoreAndAdd = useCallback(
    (item: CartItem, store: { id: string; name: string; whatsapp: string }) => {
      updateState(() => ({
        storeId: store.id,
        storeName: store.name,
        storeWhatsapp: store.whatsapp,
        items: [item],
        cartId: crypto.randomUUID(),
      }));
    },
    [updateState],
  );

  const removeItem = useCallback(
    (productOptionId: string) => {
      updateState((prev) => {
        const newItems = prev.items.filter(
          (i) => i.productOption.id !== productOptionId,
        );
        if (newItems.length === 0) {
          return {
            storeId: null,
            storeName: null,
            storeWhatsapp: null,
            items: [],
            cartId: crypto.randomUUID(),
          };
        }
        return { ...prev, items: newItems };
      });
    },
    [updateState],
  );

  const updateQuantity = useCallback(
    (productOptionId: string, quantity: number) => {
      updateState((prev) => ({
        ...prev,
        items: prev.items.map((item) =>
          item.productOption.id === productOptionId
            ? {
                ...item,
                quantity: Math.max(
                  1,
                  Math.min(quantity, item.productOption.quantity),
                ),
              }
            : item,
        ),
      }));
    },
    [updateState],
  );

  const clearCart = useCallback(() => {
    updateState(() => ({
      storeId: null,
      storeName: null,
      storeWhatsapp: null,
      items: [],
      cartId: crypto.randomUUID(),
    }));
  }, [updateState]);

  const itemCount = useMemo(
    () => state.items.reduce((sum, i) => sum + i.quantity, 0),
    [state.items],
  );

  const total = useMemo(
    () => state.items.reduce((sum, i) => sum + i.product.value * i.quantity, 0),
    [state.items],
  );

  const value = useMemo(
    () => ({
      state,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      itemCount,
      total,
      needsStoreSwitch,
      switchStoreAndAdd,
    }),
    [
      state,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      itemCount,
      total,
      needsStoreSwitch,
      switchStoreAndAdd,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
