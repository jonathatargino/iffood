import { ProductDetailBottomBarQuantityController } from "./components/ProductDetailBottomBarQuantityController";
import { AddToCartButton } from "./components/AddToCartButton";

interface ProductDetailBottomBarProps {
  productValue: number;
}

export function ProductDetailBottomBar({
  productValue,
}: ProductDetailBottomBarProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-6 shadow-2xl">
      <div className="max-w-md mx-auto flex justify-between gap-4">
        <ProductDetailBottomBarQuantityController productMaxQuantity={99} />
        <AddToCartButton productValue={productValue} />
      </div>
    </div>
  );
}
