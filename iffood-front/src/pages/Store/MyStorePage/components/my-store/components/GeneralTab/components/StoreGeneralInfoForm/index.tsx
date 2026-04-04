import { useForm } from "react-hook-form";
import { storeInfoSchema, type StoreInfoFormData } from "./schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { formatWhatsApp } from "../../../utils";
import type { Store, UpdateStoreData } from "@/services/store";
import { FormInput } from "@/components/ui/Form/FormInput";
import { FormTextarea } from "@/components/ui/Form/FormTextarea";
import { Button } from "@/components/ui/button";
import { useUpdateStore } from "@/pages/Store/MyStorePage/hooks/use-store-mutations";
import { toStoreUpdateData } from "./utils";

interface StoreGeneralInfoFormProps {
  store: Store;
  onSuccess?: () => void;
}

export function StoreGeneralInfoForm({
  store,
  onSuccess,
}: StoreGeneralInfoFormProps) {
  const { handleSubmit, control } = useForm<StoreInfoFormData>({
    resolver: zodResolver(storeInfoSchema),
    defaultValues: {
      name: store.name,
      description: store.description,
      whatsapp: formatWhatsApp(store.whatsapp),
    },
  });

  const updateStoreMutation = useUpdateStore(store.id, onSuccess);
  const onSubmit = (data: UpdateStoreData) => {
    console.log({ data });
    console.log({ updateData: toStoreUpdateData(data) });
    updateStoreMutation.mutate(toStoreUpdateData(data));
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <FormInput name="name" label="Nome da Loja" control={control} />
      <FormTextarea name="description" label="Descrição" control={control} />
      <FormInput
        name="whatsapp"
        label="WhatsApp"
        control={control}
        transformValue={formatWhatsApp}
      />
      <Button
        size={"sm"}
        type="submit"
        disabled={updateStoreMutation.isPending}
        className="w-full"
      >
        {updateStoreMutation.isPending ? "Salvando..." : "Salvar"}
      </Button>
    </form>
  );
}
