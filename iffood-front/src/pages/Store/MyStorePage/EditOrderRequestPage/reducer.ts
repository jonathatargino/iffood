import type { EditOrderAction, EditOrderItem } from "./types";

export function editOrderReducer(
  state: EditOrderItem[],
  action: EditOrderAction,
): EditOrderItem[] {
  const actionType = action.type;

  switch (actionType) {
    case "ADD_ITEM": {
      const { item } = action.payload;

      let newItems: EditOrderItem[];

      const thisProductOptionIndexInCart = state.findIndex(
        (i) => i.productOptionId === item.productOptionId,
      );
      if (thisProductOptionIndexInCart >= 0) {
        newItems = state.map((existing, index) => {
          if (index === thisProductOptionIndexInCart) {
            const newQuantity = Math.max(
              1,
              Math.min(item.quantity, existing.quantity),
            );

            return {
              ...existing,
              quantity: newQuantity,
            };
          }
          return existing;
        });

        return newItems;
      }

      newItems = [...state, item];
      return newItems;
    }
    case "REMOVE_ITEM": {
      const { productOptionId } = action.payload;

      const newItems = state.filter(
        (i) => i.productOptionId !== productOptionId,
      );

      if (newItems.length === state.length) {
        throw new Error(
          `Product option with id ${productOptionId} not found in cart`,
        );
      }

      return newItems;
    }
    case "UPDATE_QUANTITY": {
      const { productOptionId, quantity } = action.payload;

      let newItems: EditOrderItem[];

      const thisProductOptionIndexInCart = state.findIndex(
        (i) => i.productOptionId === productOptionId,
      );

      if (thisProductOptionIndexInCart >= 0) {
        newItems = state.map((existing, index) => {
          if (index === thisProductOptionIndexInCart) {
            const newQuantity = Math.max(
              1,
              Math.min(quantity, existing.quantity),
            );

            return {
              ...existing,
              quantity: newQuantity,
            };
          }
          return existing;
        });

        return newItems;
      }

      throw new Error(
        `Product option with id ${productOptionId} not found in cart`,
      );
    }
    case "CLEAR_CART": {
      return [];
    }
    case "INITIALIZE": {
      const { items } = action.payload;
      return items;
    }
    default:
      throw new Error(`Unhandled action type: ${actionType}`);
  }
}
