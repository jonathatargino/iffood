export interface EditOrderItem {
  productOptionId: string;
  productName: string;
  productOptionName: string;
  productValue: number;
  quantity: number;
}

export interface EditOrderAddItemAction {
  type: "ADD_ITEM";
  payload: {
    item: EditOrderItem;
  };
}

export interface EditOrderRemoveItemAction {
  type: "REMOVE_ITEM";
  payload: {
    productOptionId: string;
  };
}

export interface EditOrderUpdateQuantityAction {
  type: "UPDATE_QUANTITY";
  payload: {
    productOptionId: string;
    quantity: number;
  };
}

export interface EditOrderClearAction {
  type: "CLEAR_CART";
}

export interface EditOrderInitializeAction {
  type: "INITIALIZE";
  payload: {
    items: EditOrderItem[];
  };
}

export type EditOrderAction =
  | EditOrderAddItemAction
  | EditOrderRemoveItemAction
  | EditOrderUpdateQuantityAction
  | EditOrderClearAction
  | EditOrderInitializeAction;
