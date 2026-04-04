import { useFieldArray, useFormContext } from "react-hook-form";
import type { ProductFormData } from "../../../schema";
import { MAX_FLAVORS } from "../../../utils";
import { Plus } from "lucide-react";
import { ProductOptionFormCard } from "./components/ProductOptionFormCard";
import { SectionHeader } from "@/components/SectionHeader";
import { Button } from "@/components/Button";

export function ProductFormOptionsStep() {
  const {
    control,
    watch,
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

  const handleQuantityChange = (index: number, newQuantity: number) => {
    if (newQuantity < 0) return;
    updateFlavorQuantity(index, newQuantity);
  };

  return (
    <>
      <SectionHeader
        title="Sabores"
        description={`Total de unidades disponíveis: ${totalStock}`}
        actions={
          flavorsData.length < 10 && (
            <Button type="button" onClick={addFlavor} size={"icon"}>
              <Plus className="size-4" />
            </Button>
          )
        }
      />
      <div className="px-6">
        <div className="space-y-3">
          {flavorsData.map((flavor, index) => (
            <>
              {flavor.status !== "deleted" && (
                <ProductOptionFormCard
                  key={flavor.id}
                  index={index}
                  quantity={flavor.quantity}
                  onDelete={() => deleteFlavor(index)}
                  onQuantityChange={(newQuantity) =>
                    handleQuantityChange(index, newQuantity)
                  }
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
