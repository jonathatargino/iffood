import { FormInput } from "@/components/Form";
import { FormProvider, useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { userProfileService } from "@/services/user-profile";
import { toast } from "sonner";
import { formatWhatsApp } from "@/pages/Store/MyStorePage/components/my-store/components/utils";

interface WhatsappFormProps {
  onCancel: () => void;
}

export function WhatsappForm({ onCancel }: WhatsappFormProps) {
  const form = useForm<{ whatsapp: string }>();
  const queryClient = useQueryClient();

  const updateWhatsappMutation = useMutation({
    mutationFn: userProfileService.updateWhatsapp,
    onSuccess: () => {
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["user-profile-me"] });
      toast.success("WhatsApp atualizado com sucesso!");
      onCancel();
    },
    onError: (error: any) => {
      toast.error("Erro ao atualizar WhatsApp", {
        description: "Tente novamente mais tarde.",
      });
      console.error(error);
    },
  });

  const onSubmit = form.handleSubmit((data) => {
    updateWhatsappMutation.mutate(data.whatsapp);
  });

  return (
    <FormProvider {...form}>
      <form className="flex flex-col gap-4">
        <FormInput
          name="whatsapp"
          label="WhatsApp"
          placeholder="(85) 99999-9999"
          control={form.control}
          transformValue={formatWhatsApp}
        />
        <div className="flex w-full items-center justify-between gap-4">
          <button
            onClick={onCancel}
            disabled={updateWhatsappMutation.isPending}
            className="flex-1 rounded-full bg-gray-100 py-3 text-[#2e2e2e] transition-colors hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={onSubmit}
            disabled={updateWhatsappMutation.isPending}
            className={`flex-1 rounded-full py-3 text-white shadow-lg transition-all hover:shadow-xl active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 ${
              updateWhatsappMutation.isPending
                ? "bg-gray-300"
                : "bg-gradient-to-r from-[#FF7622] to-[#E6661A]"
            }`}
          >
            Salvar
          </button>
        </div>
      </form>
    </FormProvider>
  );
}
