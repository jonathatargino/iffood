import type { CartAction, CartItem, CartState } from "./types";

export function cartReducer(state: CartState, action: CartAction): CartState {
  const actionType = action.type;

  switch (actionType) {
    case "ADD_ITEM": {
      const { item, store } = action.payload;

      let newItems: CartItem[];

      const thisProductOptionIndexInCart = state.items.findIndex(
        (i) => i.productOption.id === item.productOption.id,
      );
      if (thisProductOptionIndexInCart >= 0) {
        newItems = state.items.map((existing, index) => {
          if (index === thisProductOptionIndexInCart) {
            const newQuantity = Math.max(
              1,
              Math.min(item.quantity, existing.productOption.quantity),
            );

            return {
              ...existing,
              quantity: newQuantity,
            };
          }
          return existing;
        });

        return {
          ...state,
          store,
          items: newItems,
          cartId: crypto.randomUUID(),
        };
      }

      newItems = [...state.items, item];
      return {
        ...state,
        store,
        cartId: crypto.randomUUID(),
        items: newItems,
      };
    }
    case "REMOVE_ITEM": {
      const { productOptionId } = action.payload;

      const newItems = state.items.filter(
        (i) => i.productOption.id !== productOptionId,
      );

      if (newItems.length === state.items.length) {
        throw new Error(
          `Product option with id ${productOptionId} not found in cart`,
        );
      }

      if (newItems.length === 0) {
        return {
          store: null,
          items: [],
          cartId: crypto.randomUUID(),
        };
      }

      return { ...state, cartId: crypto.randomUUID(), items: newItems };
    }
    case "UPDATE_QUANTITY": {
      const { productOptionId, quantity } = action.payload;

      let newItems: CartItem[];

      const thisProductOptionIndexInCart = state.items.findIndex(
        (i) => i.productOption.id === productOptionId,
      );
      if (thisProductOptionIndexInCart >= 0) {
        newItems = state.items.map((existing, index) => {
          if (index === thisProductOptionIndexInCart) {
            const newQuantity = Math.max(
              1,
              Math.min(quantity, existing.productOption.quantity),
            );

            return {
              ...existing,
              quantity: newQuantity,
            };
          }
          return existing;
        });

        return {
          ...state,
          items: newItems,
          cartId: crypto.randomUUID(),
        };
      }

      throw new Error(
        `Product option with id ${productOptionId} not found in cart`,
      );
    }
    case "CLEAR_CART": {
      return {
        store: null,
        items: [],
        cartId: crypto.randomUUID(),
      };
    }
    default:
      throw new Error(`Unhandled action type: ${actionType}`);
  }
}
