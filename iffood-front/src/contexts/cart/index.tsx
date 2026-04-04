import {
  useState,
  useCallback,
  useMemo,
  type ReactNode,
  useReducer,
  useEffect,
} from "react";
import { CartContext } from "./context";
import type { CartItem } from "./types";
import { ConfirmationModal } from "@/components/ConfirmationModal";
import { loadCartFromLocalStorage, persistCartInLocalStorage } from "./utils";
import { cartReducer } from "./reducer";
import type { Store } from "@/services/store";

export function CartProvider({ children }: { children: ReactNode }) {
  const [cartState, dispatch] = useReducer(
    cartReducer,
    loadCartFromLocalStorage(),
  );
  const [isStoreSwitchModalOpen, setIsStoreSwitchModalOpen] = useState(false);

  useEffect(() => {
    persistCartInLocalStorage(cartState);
  }, [cartState]);

  const needsStoreSwitch = useCallback(
    (storeId: string) => {
      const currentStoreId = cartState.store?.id;
      if (!currentStoreId) return false;

      return currentStoreId !== storeId;
    },
    [cartState.store, cartState.items],
  );

  const addItem = useCallback(
    (item: CartItem, store: Store) => {
      if (needsStoreSwitch(store.id)) {
        setIsStoreSwitchModalOpen(true);
        return false;
      }

      dispatch({
        type: "ADD_ITEM",
        payload: {
          item,
          store,
        },
      });

      return true;
    },
    [needsStoreSwitch, dispatch],
  );

  const removeItem = useCallback(
    (productOptionId: string) => {
      dispatch({
        type: "REMOVE_ITEM",
        payload: {
          productOptionId,
        },
      });
    },
    [dispatch],
  );

  const updateQuantity = useCallback(
    (productOptionId: string, quantity: number) => {
      dispatch({
        type: "UPDATE_QUANTITY",
        payload: {
          productOptionId,
          quantity,
        },
      });
    },
    [dispatch],
  );

  const clearCart = useCallback(() => {
    dispatch({ type: "CLEAR_CART" });
  }, [dispatch]);

  function handleClearCartModalConfirmation() {
    clearCart();
    setIsStoreSwitchModalOpen(false);
  }

  const itemCount = useMemo(
    () => cartState.items.reduce((sum, i) => sum + i.quantity, 0),
    [cartState.items],
  );

  const total = useMemo(
    () =>
      cartState.items.reduce((sum, i) => sum + i.product.value * i.quantity, 0),
    [cartState.items],
  );

  const value = useMemo(
    () => ({
      state: cartState,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      itemCount,
      total,
    }),
    [
      cartState,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      itemCount,
      total,
    ],
  );

  return (
    <CartContext.Provider value={value}>
      {children}{" "}
      <ConfirmationModal
        isOpen={isStoreSwitchModalOpen}
        title="Esvaziar carrinho?"
        message="Você só pode adicionar itens de uma loja por vez. Deseja esvaziar o carrinho?"
        confirmText="Esvaziar"
        cancelText="Cancelar"
        onConfirm={handleClearCartModalConfirmation}
        onCancel={() => setIsStoreSwitchModalOpen(false)}
      />
    </CartContext.Provider>
  );
}
