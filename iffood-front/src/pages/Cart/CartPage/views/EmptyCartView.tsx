import { ChevronLeft, ShoppingCart } from "lucide-react";
import { useNavigate } from "react-router";

export function EmptyCartView() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <div className="rounded-b-[32px] bg-gradient-to-br from-[#FF7622] to-[#E6661A] px-6 pt-14 pb-8 shadow-lg">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="flex size-11 items-center justify-center rounded-2xl bg-white/95 shadow-xl backdrop-blur-md transition-all hover:bg-white active:scale-95"
          >
            <ChevronLeft className="h-5 w-5 text-[#2e2e2e]" />
          </button>
          <h1 className="text-lg text-white">Carrinho</h1>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center px-6 pt-24">
        <div className="mb-6 flex size-24 items-center justify-center rounded-full bg-gray-100">
          <ShoppingCart className="h-12 w-12 text-gray-400" />
        </div>
        <h2 className="mb-2 text-lg text-[#2e2e2e]">Carrinho vazio</h2>
        <p className="mb-8 text-center text-sm text-gray-400">
          Adicione produtos ao carrinho para fazer um pedido
        </p>
        <button
          onClick={() => navigate("/")}
          className="rounded-full bg-gradient-to-r from-[#FF7622] to-[#E6661A] px-8 py-3 text-white shadow-lg transition-all hover:shadow-xl active:scale-95"
        >
          Ver produtos
        </button>
      </div>
    </div>
  );
}
