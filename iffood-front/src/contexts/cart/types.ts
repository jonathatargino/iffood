export interface CartItem {
  productId: string;
  productOptionId: string;
  productName: string;
  productValue: number;
  optionName: string;
  quantity: number;
  maxQuantity: number;
  photoUrl: string;
}

export interface CartState {
  storeId: string | null;
  storeName: string | null;
  storeWhatsapp: string | null;
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
