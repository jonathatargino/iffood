import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  storeService,
  type UpdateStoreData,
  type Store,
} from "@/services/store";
import {
  storeAvailabilityService,
  type UpdateStoreAvailabilityUnit,
} from "@/services/store-availability";
import { useNavigate } from "react-router";

export const useUpdateStore = (storeId: string, onSuccess?: () => void) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateStoreData) =>
      storeService.updateStore(storeId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-store"] });
      toast.success("Loja atualizada", {
        description: "As informações da loja foram atualizadas com sucesso.",
      });
      onSuccess?.();
    },
    onError: () => {
      toast.error("Erro ao atualizar loja", {
        description:
          "Não foi possível atualizar as informações. Tente novamente.",
      });
    },
  });
};

export const useUpdateStorePhoto = (
  storeId: string,
  onSuccess?: () => void
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (photo: File) => storeService.updateStorePhoto(storeId, photo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-store"] });
      toast.success("Foto atualizada", {
        description: "A foto da loja foi atualizada com sucesso.",
      });
      onSuccess?.();
    },
    onError: () => {
      toast.error("Erro ao atualizar foto", {
        description: "Não foi possível atualizar a foto. Tente novamente.",
      });
    },
  });
};

export const useDeleteStore = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (storeId: string) => storeService.deleteStore(storeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-store"] });
      toast.success("Loja deletada", {
        description: "Sua loja foi deletada com sucesso.",
      });
      navigate("/");
    },
    onError: () => {
      toast.error("Erro ao deletar loja", {
        description: "Não foi possível deletar a loja. Tente novamente.",
      });
    },
  });
};

export const useUpdateStoreAvailabilities = (storeId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (availabilities: UpdateStoreAvailabilityUnit[]) =>
      storeAvailabilityService.updateAvailabilities({
        storeId,
        availabilities,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["store-availability", storeId],
      });
      toast.success("Disponibilidade atualizada!");
    },
    onError: () => {
      toast.error("Erro ao atualizar disponibilidade");
    },
  });
};

export const useUpdateStoreStatus = (storeId: string, store: Store) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (status: boolean) =>
      storeService.updateStore(storeId, {
        name: store.name,
        description: store.description,
        whatsapp: store.whatsapp,
        status,
      }),
    onMutate: async (newStatus) => {
      await queryClient.cancelQueries({ queryKey: ["my-store"] });

      const previousStores = queryClient.getQueryData<Store[]>(["my-store"]);

      if (previousStores) {
        queryClient.setQueryData<Store[]>(["my-store"], (old) =>
          old?.map((s) => (s.id === storeId ? { ...s, status: newStatus } : s))
        );
      }

      return { previousStores };
    },
    onError: (_error, _newStatus, context) => {
      if (context?.previousStores) {
        queryClient.setQueryData(["my-store"], context.previousStores);
      }
      toast.error("Erro ao atualizar status da loja");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["my-store"] });
    },
  });
};
