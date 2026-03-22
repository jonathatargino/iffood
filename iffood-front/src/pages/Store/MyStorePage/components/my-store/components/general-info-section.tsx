import type { Store } from "@/services/store";

type GeneralInfoSectionProps = {
  store: Store;
};

export function GeneralInfoSection({ store }: GeneralInfoSectionProps) {
  return (
    <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-[#2e2e2e]">Informações da Loja</h2>
      </div>

      <div>
        <div className="mb-3">
          <div className="mb-1 text-xs tracking-wider text-gray-400 uppercase">
            Nome da Loja
          </div>
          <div className="text-[#2e2e2e]">{store.name}</div>
        </div>
        <div className="mb-3">
          <div className="mb-1 text-xs tracking-wider text-gray-400 uppercase">
            Descrição
          </div>
          <p className="text-sm leading-relaxed text-gray-500">
            {store.description}
          </p>
        </div>
        <div className="mb-3">
          <div className="mb-1 text-xs tracking-wider text-gray-400 uppercase">
            WhatsApp
          </div>
          <div className="text-[#2e2e2e]">
            {store.whatsapp.length === 11
              ? `(${store.whatsapp.slice(0, 2)}) ${store.whatsapp.slice(
                  2,
                  7,
                )}-${store.whatsapp.slice(7, 11)}`
              : store.whatsapp}
          </div>
        </div>
      </div>
    </div>
  );
}
