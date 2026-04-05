import { useFormContext } from "react-hook-form";
import type { ProductFormData } from "../../../schema";
import { PRODUCT_CATEGORIES } from "../../../utils";
import { formatPriceInput } from "@/utils/currency";
import { FormInput, FormSelect, FormTextarea } from "@/components/Form";

export function ProductFormInfoStep() {
  const { control } = useFormContext<ProductFormData>();
  return (
    <div className="flex flex-col gap-4">
      <FormInput
        control={control}
        name="name"
        label="Nome do Produto"
        placeholder="Pizza Margherita"
      />
      <FormTextarea
        control={control}
        name="description"
        label="Descrição"
        placeholder="Descreva seu produto..."
      />
      <div className="grid grid-cols-2 gap-4">
        <FormInput
          control={control}
          name="price"
          label="Preço (R$)*"
          placeholder="0,00"
          transformValue={formatPriceInput}
        />
        <FormSelect
          control={control}
          name="category"
          label="Categoria*"
          options={PRODUCT_CATEGORIES}
        />
      </div>
    </div>
  );
}
