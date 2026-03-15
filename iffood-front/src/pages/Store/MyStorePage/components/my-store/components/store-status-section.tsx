import { Check, X } from "lucide-react";
import type { Store } from "@/services/store";

type StoreStatusSectionProps = {
  store: Store;
  onToggleStatus: () => void;
};

export function StoreStatusSection({
  store,
  onToggleStatus,
}: StoreStatusSectionProps) {
  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h3 className="text-[#2e2e2e] mb-3">Status da Loja</h3>
          <div className="flex items-center gap-3">
            <div
              className={`relative size-12 rounded-2xl flex items-center justify-center transition-all ${
                store.status ? "bg-green-50" : "bg-gray-100"
              }`}
            >
              <div
                className={`size-6 rounded-full transition-all ${
                  store.status ? "bg-green-500" : "bg-gray-400"
                }`}
              >
                {store.status && (
                  <div className="size-6 rounded-full bg-green-500 animate-ping absolute"></div>
                )}
              </div>
            </div>
            <div>
              <div
                className={`text-sm ${
                  store.status ? "text-green-600" : "text-gray-500"
                }`}
              >
                {store.status ? "Aberta" : "Fechada"}
              </div>
              <div className="text-xs text-gray-400">
                {store.status ? "Aceitando pedidos" : "Não aceitando pedidos"}
              </div>
            </div>
          </div>
        </div>
        <button
          onClick={onToggleStatus}
          className={`relative w-16 h-9 rounded-full transition-all shadow-inner ${
            store.status ? "bg-green-500" : "bg-gray-300"
          }`}
        >
          <div
            className={`absolute top-1 w-7 h-7 bg-white rounded-full shadow-md transition-all duration-300 ${
              store.status ? "right-1" : "left-1"
            }`}
          >
            <div className="w-full h-full flex items-center justify-center">
              {store.status ? (
                <Check className="w-4 h-4 text-green-500" />
              ) : (
                <X className="w-4 h-4 text-gray-400" />
              )}
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}
