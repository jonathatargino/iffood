import type { Store } from "@/services/store";

type GeneralInfoSectionProps = {
  store: Store;
};

export function GeneralInfoSection({ store }: GeneralInfoSectionProps) {
  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[#2e2e2e]">Informações da Loja</h2>
      </div>

      <div>
        <div className="mb-3">
          <div className="text-xs text-gray-400 mb-1 uppercase tracking-wider">
            Nome da Loja
          </div>
          <div className="text-[#2e2e2e]">{store.name}</div>
        </div>
        <div className="mb-3">
          <div className="text-xs text-gray-400 mb-1 uppercase tracking-wider">
            Descrição
          </div>
          <p className="text-sm text-gray-500 leading-relaxed">
            {store.description}
          </p>
        </div>
        <div className="mb-3">
          <div className="text-xs text-gray-400 mb-1 uppercase tracking-wider">
            WhatsApp
          </div>
          <div className="text-[#2e2e2e]">
            {store.whatsapp.length === 11
              ? `(${store.whatsapp.slice(0, 2)}) ${store.whatsapp.slice(
                  2,
                  7
                )}-${store.whatsapp.slice(7, 11)}`
              : store.whatsapp}
          </div>
        </div>
      </div>
    </div>
  );
}
