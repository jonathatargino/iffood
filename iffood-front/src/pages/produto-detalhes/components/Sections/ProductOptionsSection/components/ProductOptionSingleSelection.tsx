import type { ProductOption } from "@/services/product";

interface ProductOptionSingleSelectionProps {
  productOption: ProductOption;
  onOptionSelect: (option: ProductOption) => void;
  selectedProductOption: ProductOption;
}

export function ProductOptionSingleSelection({
  productOption,
  onOptionSelect,
  selectedProductOption,
}: ProductOptionSingleSelectionProps) {
  return (
    <label className="flex items-center justify-between py-5 cursor-pointer text-sm font-medium text-gray-800 px-4">
      {productOption.name}
      <input type="radio" name="carne" className="h-5 w-5 accent-[#FF7622]" />
    </label>
  );
}
