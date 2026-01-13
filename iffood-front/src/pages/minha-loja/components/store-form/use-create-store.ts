import { useMutation } from "@tanstack/react-query";
import { storeService } from "@/services/store";

export const useCreateStore = (onSuccess: () => void, onError: () => void) => {
  return useMutation({
    mutationFn: storeService.createStore,
    onSuccess,
    onError,
  });
};
