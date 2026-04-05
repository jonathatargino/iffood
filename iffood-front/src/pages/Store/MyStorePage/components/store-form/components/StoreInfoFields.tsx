import { useFormContext } from "react-hook-form";
import type { StoreFormData } from "../schema";
import { FormInput, FormTextarea } from "@/components/Form";
import { formatWhatsApp } from "../../my-store/components/utils";

export function StoreInfoFields() {
  const { control } = useFormContext<StoreFormData>();
  return (
    <div className="flex flex-col gap-4">
      <FormInput
        control={control}
        name="name"
        label="Nome da Loja *"
        placeholder="Ex: Pizzaria Bella Napoli"
      />

      <FormTextarea
        control={control}
        name="description"
        label={`Descrição`}
        placeholder="Descreva sua loja para os clientes..."
      />

      <FormInput
        control={control}
        name="whatsapp"
        label="WhatsApp *"
        placeholder="(XX) XXXXX-XXXX"
        transformValue={formatWhatsApp}
      />
    </div>
  );
}
