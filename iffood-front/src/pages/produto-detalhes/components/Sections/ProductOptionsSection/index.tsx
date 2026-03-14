import type { ProductOption } from "@/services/product";
import { ProductOptionSingleSelection } from "./components/ProductOptionSingleSelection";
import React from "react";

interface ProductOptionsSectionProps {
  onOptionSelect: (option: ProductOption) => void;
  productOptions: ProductOption[];
  selectedProductOption: ProductOption;
}

export function ProductOptionsSection({
  onOptionSelect,
  productOptions,
  selectedProductOption,
}: ProductOptionsSectionProps) {
  return (
    <div>
      <div className="p-4 bg-neutral-100">
        <h3 className="text-gray-600 font-bold">Escolha o sabor</h3>
        <p className="text-xs text-gray-500">Escolha 1 opção</p>
      </div>
      <div className="space-y-2">
        {productOptions.map((option, index) => (
          <React.Fragment key={option.id}>
            {index > 0 && <hr className="border-gray-200 w-[90%] mx-auto" />}
            <ProductOptionSingleSelection
              key={option.id}
              productOption={option}
              onOptionSelect={onOptionSelect}
              selectedProductOption={selectedProductOption}
            />
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
