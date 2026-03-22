import type { ProductOption } from "@/services/product";
import { ProductOptionSingleSelection } from "./components/ProductOptionSingleSelection";
import React from "react";
import { SectionHeader } from "@/components/SectionHeader";

interface ProductOptionsSectionProps {
  productOptions: ProductOption[];
}

export function ProductOptionsSection({
  productOptions,
}: ProductOptionsSectionProps) {
  return (
    <div>
      <SectionHeader title="Escolha o sabor" description="Escolha 1 opção" />
      <div className="space-y-2">
        {productOptions.map((option, index) => (
          <React.Fragment key={option.id}>
            {index > 0 && <hr className="mx-auto w-[90%] border-gray-200" />}
            <ProductOptionSingleSelection
              key={option.id}
              productOption={option}
            />
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
