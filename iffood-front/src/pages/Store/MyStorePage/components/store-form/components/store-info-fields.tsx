import { useState } from "react";
import type {
  UseFormRegister,
  FieldErrors,
  UseFormSetValue,
} from "react-hook-form";
import type { StoreFormData } from "../schema";
import { formatWhatsApp } from "./utils";

type StoreInfoFieldsProps = {
  register: UseFormRegister<StoreFormData>;
  setValue: UseFormSetValue<StoreFormData>;
  errors: FieldErrors<StoreFormData>;
  descriptionLength: number;
};

export function StoreInfoFields({
  register,
  setValue,
  errors,
  descriptionLength,
}: StoreInfoFieldsProps) {
  const [whatsappDisplay, setWhatsappDisplay] = useState("");

  const handleWhatsAppChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatWhatsApp(e.target.value);
    const numbers = e.target.value.replace(/\D/g, "");
    setWhatsappDisplay(formatted);
    setValue("whatsapp", numbers);
  };
  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-5">
      <div>
        <label className="text-xs text-gray-400 mb-2 block uppercase tracking-wider">
          Nome da Loja *
        </label>
        <input
          type="text"
          {...register("name")}
          placeholder="Ex: Pizzaria Bella Napoli"
          className="w-full px-4 py-3 border border-gray-200 rounded-2xl outline-none focus:border-[#FF7622] transition-colors"
        />
        {errors.name && (
          <p className="text-xs text-red-600 mt-2">{errors.name.message}</p>
        )}
        {!errors.name && (
          <p className="text-xs text-gray-400 mt-2">
            Nome que aparecerá para os clientes
          </p>
        )}
      </div>

      <div>
        <label className="text-xs text-gray-400 mb-2 block uppercase tracking-wider">
          Descrição *
        </label>
        <textarea
          {...register("description")}
          placeholder="Descreva sua loja, os tipos de produtos que vende, diferenciais..."
          rows={4}
          className="w-full px-4 py-3 border border-gray-200 rounded-2xl outline-none focus:border-[#FF7622] transition-colors resize-none"
        />
        <div className="flex items-center justify-between mt-2">
          {errors.description ? (
            <p className="text-xs text-red-600">{errors.description.message}</p>
          ) : (
            <p className="text-xs text-gray-400">
              Conte aos clientes sobre sua loja
            </p>
          )}
          <span className="text-xs text-gray-400">{descriptionLength}/500</span>
        </div>
      </div>

      <div>
        <label className="text-xs text-gray-400 mb-2 block uppercase tracking-wider">
          WhatsApp *
        </label>
        <input
          type="text"
          value={whatsappDisplay}
          onChange={handleWhatsAppChange}
          placeholder="(XX) XXXXX-XXXX"
          className="w-full px-4 py-3 border border-gray-200 rounded-2xl outline-none focus:border-[#FF7622] transition-colors"
        />
        {errors.whatsapp && (
          <p className="text-xs text-red-600 mt-2">{errors.whatsapp.message}</p>
        )}
        {!errors.whatsapp && (
          <p className="text-xs text-gray-400 mt-2">
            Número de WhatsApp para contato
          </p>
        )}
      </div>
    </div>
  );
}
