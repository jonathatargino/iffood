import { formatCentsToReais } from "@/utils/currency";
import { ShoppingCart } from "lucide-react";
import { ProductDetailBottomBarQuantityController } from "./components/ProductDetailBottomBarQuantityController";
import { AddToCartButton } from "./components/AddToCartButton";

interface ProductDetailBottomBarProps {
  totalPrice: number;
  selectedFlavors: any[];
  canOrder: boolean;
  handleAddToCart: () => void;
}

export function ProductDetailBottomBar({
  canOrder,
  totalPrice,
  selectedFlavors,
  handleAddToCart,
}: ProductDetailBottomBarProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-6 shadow-2xl">
      <div className="max-w-md mx-auto flex justify-between gap-4">
        <ProductDetailBottomBarQuantityController
          onQuantityChange={() => {}}
          productMaxQuantity={99}
          quantity={1}
        />
        <AddToCartButton
          canOrder={canOrder}
          totalPrice={totalPrice}
          selectedFlavors={selectedFlavors}
          handleAddToCart={handleAddToCart}
        />
      </div>
    </div>
  );
}
