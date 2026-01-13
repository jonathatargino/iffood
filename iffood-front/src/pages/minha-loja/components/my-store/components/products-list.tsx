import { Package } from "lucide-react";
import { ProductCard } from "./product-card";
import type { ProductWithCounts } from "@/services/product";

type ProductsListProps = {
  products: ProductWithCounts[];
  totalProducts: number;
  isLoading: boolean;
  onEditProduct: (productId: string) => void;
  onCreateProduct: () => void;
};

export function ProductsList({
  products,
  totalProducts,
  isLoading,
  onEditProduct,
  onCreateProduct,
}: ProductsListProps) {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100 flex items-center justify-between">
        <div>
          <h3 className="text-[#2e2e2e] mb-1">Total de Produtos</h3>
          <p className="text-3xl text-[#FF7622]">{totalProducts}</p>
        </div>
        <Package className="w-12 h-12 text-gray-200" />
      </div>

      <button
        onClick={onCreateProduct}
        className="w-full bg-gradient-to-r from-[#FF7622] to-[#E6661A] text-white py-4 rounded-full flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all active:scale-[0.98]"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4v16m8-8H4"
          />
        </svg>
        Adicionar Produto
      </button>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-3xl h-[220px] animate-pulse"
            />
          ))}
        </div>
      ) : totalProducts === 0 ? (
        <div className="text-center py-16">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-400">Nenhum produto cadastrado</p>
          <p className="text-gray-300 text-sm mt-2">
            Adicione seu primeiro produto
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onEdit={() => onEditProduct(product.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
