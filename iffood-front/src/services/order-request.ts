import { api } from "@/lib/api";

export interface CreateOrderItemData {
  productId: string;
  productOptionId: string;
  quantity: number;
}

export interface CreateOrderData {
  cartId: string;
  storeId: string;
  items: CreateOrderItemData[];
}

export interface CreateOrderResponse {
  orderRequestId: string;
  whatsappUrl: string;
}

export interface OrderRequestItemResponse {
  id: string;
  quantity: number;
  productName: string;
  productOptionName: string;
  productValue: number;
  productId: string;
  productOptionId: string;
}

export interface OrderRequestResponse {
  id: string;
  status: string;
  cartId: string;
  createdAt: string;
  storeId: string;
  storeName: string;
  buyerUserId: string;
  buyerName: string;
  items: OrderRequestItemResponse[];
  total: number;
}

export interface ChangeAndConcludeItem {
  productOptionId: string;
  quantity: number;
}

export const orderRequestService = {
  async createOrder(data: CreateOrderData): Promise<CreateOrderResponse> {
    const response = await api.post<CreateOrderResponse>(
      "/order-request",
      data,
    );
    return response.data;
  },

  async getByStoreId(storeId: string): Promise<OrderRequestResponse[]> {
    const response = await api.get<OrderRequestResponse[]>("/order-request", {
      params: { storeId },
    });
    return response.data;
  },

  async getById(id: string): Promise<OrderRequestResponse> {
    const response = await api.get<OrderRequestResponse>(
      `/order-request/${id}`,
    );
    return response.data;
  },

  async conclude(id: string): Promise<void> {
    await api.patch(`/order-request/${id}/conclude`);
  },

  async reject(id: string): Promise<void> {
    await api.patch(`/order-request/${id}/reject`);
  },

  async changeAndConclude(
    id: string,
    items: ChangeAndConcludeItem[],
  ): Promise<void> {
    await api.patch(`/order-request/${id}/change-and-conclude`, { items });
  },
};
