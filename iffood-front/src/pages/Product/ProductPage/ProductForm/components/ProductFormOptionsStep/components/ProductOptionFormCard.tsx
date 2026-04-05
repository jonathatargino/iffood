import { FormInput } from "@/components/Form";
import { QuantityController } from "@/pages/Store/MyStorePage/EditOrderRequestPage/components/QuantityController";
import { useFormContext } from "react-hook-form";

export function ProductOptionFormCard({
  index,
  quantity,
  onDelete,
  onQuantityChange,
}: {
  index: number;
  quantity: number;
  onDelete: () => void;
  onQuantityChange: (newQuantity: number) => void;
}) {
  const { control } = useFormContext();

  return (
    <div className="">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex-1">
          <FormInput
            control={control}
            name={`flavors.${index}.name`}
            placeholder="Ex: Chocolate, Morango..."
            label="Sabor"
          />
        </div>
        <div className="mt-6">
          <QuantityController
            maxQuantity={100}
            quantity={quantity}
            updateQuantity={onQuantityChange}
            allowRemove={true}
            onRemove={onDelete}
            minimumQuantity={0}
          />
        </div>
      </div>
    </div>
  );
}
