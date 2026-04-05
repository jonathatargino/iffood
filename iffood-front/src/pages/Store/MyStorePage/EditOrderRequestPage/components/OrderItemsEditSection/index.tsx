import { formatCentsToReaisWithSymbol } from "@/utils/currency";
import type { EditOrderItem } from "../../types";
import { useCallback, useEffect, useMemo } from "react";
import type { Product } from "@/services/product";
import { QuantityController } from "../QuantityController";
import { FormSelect } from "@/components/Form";
import { useForm } from "react-hook-form";
import {
  orderItemsEditSectionSchema,
  type OrderItemsEditSectionFormData,
} from "./schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { BouncingDots } from "@/components/BoucingDots";
import { Button } from "@/components/Button";

interface OrderEditSectionProps {
  products: Product[];
  isLoadingProducts: boolean;
  onAddItem: (item: EditOrderItem) => void;
}

export function OrderItemsEditSection({
  products,
  isLoadingProducts,
  onAddItem,
}: OrderEditSectionProps) {
  const { control, watch, reset, setValue, handleSubmit } =
    useForm<OrderItemsEditSectionFormData>({
      resolver: zodResolver(orderItemsEditSectionSchema),
      defaultValues: {
        quantity: 1,
      },
    });

  function onSubmit(data: OrderItemsEditSectionFormData) {
    if (!selectedProduct || !selectedOption) return;

    onAddItem({
      productName: selectedProduct.name,
      productOptionName: selectedOption.name,
      productOptionId: selectedOption.id,
      quantity: data.quantity,
      productValue: selectedProduct.value,
    });

    resetForm();
  }

  const selectedProductId = watch("productId");
  const selectedOptionId = watch("productOptionId");
  const quantity = watch("quantity");

  const selectedProduct = useMemo(() => {
    return products.find((p) => p.id === selectedProductId);
  }, [selectedProductId, products]);

  const selectedOption = useMemo(() => {
    if (!selectedProduct || !selectedProduct.productOptions) return null;

    return selectedProduct.productOptions.find(
      (o) => o.id === selectedOptionId,
    );
  }, [selectedOptionId, selectedProduct]);

  const productList = products.map((p) => ({
    label: `${p.name} - ${formatCentsToReaisWithSymbol(p.value)}`,
    value: p.id,
  }));

  const productOptionList = useMemo(() => {
    if (!selectedProduct || !selectedProduct.productOptions) return [];

    return selectedProduct.productOptions.map((o) => ({
      label: o.name,
      value: o.id,
    }));
  }, [selectedProduct]);

  const resetForm = useCallback(() => {
    reset();
    if (!isLoadingProducts && products.length > 0) {
      const firstProduct = products[0];
      setValue("productId", firstProduct.id);

      const firstOption = firstProduct.productOptions?.[0];
      if (firstOption) {
        setValue("productOptionId", firstOption.id);
      }
    }
  }, [reset, isLoadingProducts, products, setValue]);

  useEffect(() => {
    resetForm();
  }, [resetForm]);

  if (isLoadingProducts) {
    return (
      <div className="flex min-h-20 justify-center">
        <BouncingDots />
      </div>
    );
  }

  if (!products.length) return null;

  return (
    <div className="space-y-6 px-6 py-6">
      <form id="order-items-form" onSubmit={handleSubmit(onSubmit)}>
        <h2 className="mb-3 text-sm font-semibold text-[#2e2e2e]">
          Adicionar item
        </h2>
        <div className="space-y-4 bg-white">
          <FormSelect
            control={control}
            name="productId"
            options={productList}
            label="Produto"
          />

          {selectedProduct && (
            <FormSelect
              control={control}
              name="productOptionId"
              options={productOptionList}
              label="Sabor"
            />
          )}
          <div className="flex items-center gap-2">
            {selectedOption && (
              <QuantityController
                quantity={quantity}
                maxQuantity={selectedOption.quantity}
                updateQuantity={(newQuantity) =>
                  setValue("quantity", newQuantity)
                }
              />
            )}
            <Button
              type="submit"
              form="order-items-form"
              disabled={!selectedProduct || !selectedOption}
              className="flex-1"
            >
              Adicionar
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
