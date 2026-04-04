import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useCreateStore } from "./useCreateStore";
import { storeFormSchema, type StoreFormData } from "./schema";
import { StoreInfoFields } from "./components/StoreInfoFields";
import { PageHeader } from "@/components/PageHeader";
import { ImageDropzoneInput } from "@/pages/Product/ProductPage/ProductForm/components/ImageDropzoneInput";
import { Button } from "@/components/Button";
import { toCreateStoreData } from "./utils";

type StoreFormProps = {
  onSave: () => void;
};

export function StoreForm({ onSave }: StoreFormProps) {
  const form = useForm<StoreFormData>({
    resolver: zodResolver(storeFormSchema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: {
      name: "",
      description: "",
      whatsapp: "",
      photo: undefined,
    },
  });

  const createStoreMutation = useCreateStore(
    () => {
      onSave();
    },
    () => {
      toast.error("Erro ao criar loja", {
        description: "Não foi possível criar a loja. Tente novamente.",
      });
    },
  );

  const onSubmit = (data: StoreFormData) => {
    createStoreMutation.mutate(toCreateStoreData(data));
  };

  return (
    <div className="min-h-screen bg-white pb-8">
      <PageHeader text="Criar Loja" />

      <FormProvider {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-6 px-6 py-6"
        >
          <ImageDropzoneInput
            control={form.control}
            label="Imagem da Loja"
            name="photo"
          />
          <StoreInfoFields />
          <Button className="w-full">Criar Loja</Button>
        </form>
      </FormProvider>
    </div>
  );
}
