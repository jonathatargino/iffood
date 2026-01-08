import { Store } from "lucide-react";

interface NoStoreProps {
  onBack: () => void;
  onCreateStore: () => void;
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="size-11 bg-white rounded-2xl shadow-md flex items-center justify-center active:scale-95 transition-transform"
    >
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24">
        <path
          d="M15 18l-6-6 6-6"
          stroke="#2e2e2e"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
        />
      </svg>
    </button>
  );
}

export function NoStore({ onBack, onCreateStore }: NoStoreProps) {
  return (
    <div className="bg-[#fafafa] min-h-screen">
      {/* Header */}
      <div className="bg-linear-to-br from-[#FF7622] to-[#E6661A] px-6 pt-14 pb-8 rounded-b-4xl shadow-lg">
        <div className="flex items-center gap-4">
          <BackButton onClick={onBack} />
          <h1 className="text-white text-lg font-semibold">Minha Loja</h1>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-12 flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="text-center max-w-sm">
          {/* Icon */}
          <div className="size-32 bg-linear-to-br from-[#FF7622]/10 to-[#E6661A]/10 rounded-full mx-auto mb-8 flex items-center justify-center">
            <div className="size-24 bg-linear-to-br from-[#FF7622]/20 to-[#E6661A]/20 rounded-full flex items-center justify-center">
              <Store className="w-16 h-16 text-[#FF7622]" />
            </div>
          </div>

          {/* Text */}
          <h2 className="text-2xl font-bold text-[#2e2e2e] mb-4">
            Você ainda não tem uma loja
          </h2>
          <p className="text-gray-500 leading-relaxed mb-8">
            Crie sua loja agora e comece a vender seus produtos para milhares de
            clientes em nossa plataforma.
          </p>

          {/* CTA Button */}
          <button
            onClick={onCreateStore}
            className="w-full bg-linear-to-r from-[#FF7622] to-[#E6661A] text-white py-4 px-6 rounded-full shadow-lg hover:shadow-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <Store className="w-5 h-5" />
            Criar Minha Loja
          </button>

          {/* Secondary info */}
          <div className="mt-8 pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-400 mb-4">
              Com sua loja você poderá:
            </p>
            <div className="space-y-3 text-left">
              <div className="flex items-start gap-3">
                <div className="size-6 bg-green-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                  <svg
                    className="w-3.5 h-3.5 text-green-600"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <path
                      d="M5 13l4 4L19 7"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                    />
                  </svg>
                </div>
                <p className="text-sm text-gray-600">
                  Adicionar produtos ilimitados
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="size-6 bg-green-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                  <svg
                    className="w-3.5 h-3.5 text-green-600"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <path
                      d="M5 13l4 4L19 7"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                    />
                  </svg>
                </div>
                <p className="text-sm text-gray-600">
                  Gerenciar estoque e sabores
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="size-6 bg-green-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                  <svg
                    className="w-3.5 h-3.5 text-green-600"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <path
                      d="M5 13l4 4L19 7"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                    />
                  </svg>
                </div>
                <p className="text-sm text-gray-600">
                  Receber pedidos via WhatsApp
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
