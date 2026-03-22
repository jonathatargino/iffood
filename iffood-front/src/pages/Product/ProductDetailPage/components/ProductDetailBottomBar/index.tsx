import { ProductDetailBottomBarQuantityController } from "./components/ProductDetailBottomBarQuantityController";
import { AddToCartButton } from "./components/AddToCartButton";

interface ProductDetailBottomBarProps {
  productValue: number;
}

export function ProductDetailBottomBar({
  productValue,
}: ProductDetailBottomBarProps) {
  return (
    <div className="fixed right-0 bottom-0 left-0 mt-auto border-t border-gray-100 bg-white p-6 shadow-2xl">
      <div className="mx-auto flex max-w-md justify-between gap-4">
        <ProductDetailBottomBarQuantityController />
        <AddToCartButton productValue={productValue} />
      </div>
    </div>
  );
}
