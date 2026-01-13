import { useState } from "react";
import { Edit2 } from "lucide-react";
import type { Store, UpdateStoreData } from "@/services/store";
import { formatWhatsApp } from "./utils";

type EditableStoreInfoProps = {
  store: Store;
  onSave: (data: UpdateStoreData) => void;
  isSaving: boolean;
};

export function EditableStoreInfo({
  store,
  onSave,
  isSaving,
}: EditableStoreInfoProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<UpdateStoreData>({
    name: store.name,
    description: store.description,
    whatsapp: store.whatsapp,
  });

  const [whatsappDisplay, setWhatsappDisplay] = useState(() => {
    const numbers = store.whatsapp;
    if (numbers.length === 11) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(
        7,
        11
      )}`;
    }
    return numbers;
  });

  const handleWhatsAppChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatWhatsApp(e.target.value);
    const numbers = e.target.value.replace(/\D/g, "");
    setWhatsappDisplay(formatted);
    setFormData({ ...formData, whatsapp: numbers });
  };

  const handleSave = () => {
    onSave(formData);
    setIsEditing(false);
  };

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[#2e2e2e]">Informações da Loja</h2>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="size-10 bg-gray-50 hover:bg-gray-100 rounded-full flex items-center justify-center transition-colors"
        >
          <Edit2 className="w-4 h-4 text-[#2e2e2e]" />
        </button>
      </div>

      {isEditing ? (
        <div className="space-y-4">
          <div>
            <label className="text-xs text-gray-400 mb-2 block uppercase tracking-wider">
              Nome da Loja
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full px-4 py-3 border border-gray-200 rounded-2xl outline-none focus:border-[#FF7622] transition-colors"
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-2 block uppercase tracking-wider">
              Descrição
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  description: e.target.value,
                })
              }
              rows={4}
              className="w-full px-4 py-3 border border-gray-200 rounded-2xl outline-none focus:border-[#FF7622] transition-colors resize-none"
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-2 block uppercase tracking-wider">
              WhatsApp
            </label>
            <input
              type="text"
              value={whatsappDisplay}
              onChange={handleWhatsAppChange}
              placeholder="(XX) XXXXX-XXXX"
              className="w-full px-4 py-3 border border-gray-200 rounded-2xl outline-none focus:border-[#FF7622] transition-colors"
            />
          </div>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full bg-gradient-to-r from-[#FF7622] to-[#E6661A] text-white py-3 rounded-full uppercase transition-all shadow-lg hover:shadow-xl active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? "Salvando..." : "Salvar"}
          </button>
        </div>
      ) : (
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
          <div>
            <div className="text-xs text-gray-400 mb-1 uppercase tracking-wider">
              WhatsApp
            </div>
            <div className="text-[#2e2e2e]">{whatsappDisplay}</div>
          </div>
        </div>
      )}
    </div>
  );
}
