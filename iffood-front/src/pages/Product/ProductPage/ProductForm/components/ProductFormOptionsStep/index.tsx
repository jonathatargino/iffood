import { useFieldArray, useFormContext } from "react-hook-form";
import type { ProductFormData } from "../../../schema";
import { MAX_FLAVORS } from "../../../utils";
import { Plus } from "lucide-react";
import { ProductOptionFormCard } from "./components/ProductOptionFormCard";
import { SectionHeader } from "@/components/SectionHeader";

export function ProductFormOptionsStep() {
  const {
    control,
    watch,
    register,
    formState: { errors },
  } = useFormContext<ProductFormData>();

  const { fields, append, remove, update } = useFieldArray({
    control,
    name: "flavors",
  });

  const flavorsData = watch("flavors");
  const totalStock = flavorsData
    .filter((f) => f.status !== "deleted")
    .reduce((sum, flavor) => sum + flavor.quantity, 0);
  const activeFlavors = fields.filter(
    (_, index) => flavorsData[index]?.status !== "deleted",
  );
  const canAddFlavor = activeFlavors.length < MAX_FLAVORS;
  const canDeleteFlavor = activeFlavors.length > 1;

  const addFlavor = () => {
    if (canAddFlavor) {
      append({ name: "", quantity: 0, status: "new" });
    }
  };

  const updateFlavorQuantity = (index: number, newQuantity: number) => {
    const currentFlavor = flavorsData[index];
    update(index, {
      ...currentFlavor,
      quantity: newQuantity,
      status: currentFlavor.id ? "updated" : "new",
    });
  };

  const deleteFlavor = (index: number) => {
    if (!canDeleteFlavor) return;

    const currentFlavor = flavorsData[index];
    if (currentFlavor.id) {
      update(index, { ...currentFlavor, status: "deleted" });
    } else {
      remove(index);
    }
  };

  return (
    <>
      <SectionHeader
        title="Estoque total"
        description={`Total de unidades disponíveis: ${totalStock}`}
      />
      <div className="px-6">
        <div className="mb-4 flex items-center justify-between">
          <label className="text-xs tracking-wider text-gray-400 uppercase">
            Sabores
          </label>
          {flavorsData.length < 10 && (
            <button
              type="button"
              onClick={addFlavor}
              className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm text-[#FF7622] transition-colors hover:bg-orange-50"
            >
              <Plus className="h-4 w-4" />
              Adicionar
            </button>
          )}
        </div>

        <div className="space-y-3">
          {flavorsData.map((flavor, index) => (
            <>
              {flavor.status !== "deleted" && (
                <ProductOptionFormCard
                  key={flavor.id}
                  index={index}
                  canDelete={flavorsData.length > 1}
                  register={register}
                  errors={errors}
                  quantity={flavor.quantity}
                  onDecrease={() =>
                    updateFlavorQuantity(index, flavor.quantity - 1)
                  }
                  onIncrease={() =>
                    updateFlavorQuantity(index, flavor.quantity + 1)
                  }
                  onDelete={() => deleteFlavor(index)}
                />
              )}
            </>
          ))}
        </div>
        {errors.flavors && (
          <p className="mt-2 text-xs text-red-500">{errors.flavors.message}</p>
        )}
      </div>
    </>
  );
}
