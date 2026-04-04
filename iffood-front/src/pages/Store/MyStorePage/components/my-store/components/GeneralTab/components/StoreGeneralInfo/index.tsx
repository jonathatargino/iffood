import type { Store } from "@/services/store";
import { formatWhatsApp } from "../../../utils";

interface StoreGeneralInfoProps {
  store: Store;
}

export function StoreGeneralInfo({ store }: StoreGeneralInfoProps) {
  return (
    <>
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
      <div>
        <div className="mb-1 text-xs tracking-wider text-gray-400 uppercase">
          WhatsApp
        </div>
        <div className="text-[#2e2e2e]">{formatWhatsApp(store.whatsapp)}</div>
      </div>
    </>
  );
}
