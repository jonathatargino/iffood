import { createContext, useContext } from "react";
import type { OrderContextValue } from "./types";

export const OrderContext = createContext<OrderContextValue>({
  createOrder: async () => {},
  isOrderCreating: false,
});

export function useOrder() {
  return useContext(OrderContext);
}
