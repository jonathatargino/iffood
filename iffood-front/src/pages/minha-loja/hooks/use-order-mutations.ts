import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  orderRequestService,
  type ChangeAndConcludeItem,
} from "@/services/order-request";

export const useConcludeOrder = (storeId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderId: string) => orderRequestService.conclude(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["store-orders", storeId] });
      toast.success("Pedido concluído!");
    },
    onError: () => {
      toast.error("Erro ao concluir pedido");
    },
  });
};

export const useRejectOrder = (storeId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderId: string) => orderRequestService.reject(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["store-orders", storeId] });
      toast.success("Pedido rejeitado");
    },
    onError: () => {
      toast.error("Erro ao rejeitar pedido");
    },
  });
};

export const useChangeAndConcludeOrder = (storeId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      orderId,
      items,
    }: {
      orderId: string;
      items: ChangeAndConcludeItem[];
    }) => orderRequestService.changeAndConclude(orderId, items),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["store-orders", storeId] });
      toast.success("Pedido alterado e concluído!");
    },
    onError: () => {
      toast.error("Erro ao alterar pedido");
    },
  });
};
