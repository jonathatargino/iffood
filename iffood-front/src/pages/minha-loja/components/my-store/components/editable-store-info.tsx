import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Edit2 } from "lucide-react";
import type { Store, UpdateStoreData } from "@/services/store";

const storeInfoSchema = z.object({
  name: z.string().min(1, "Nome da loja é obrigatório"),
  description: z.string().min(1, "Descrição é obrigatória"),
  whatsapp: z
    .string()
    .regex(/^\d{11}$/, "WhatsApp deve ter 11 dígitos (DDD + número)"),
});

type StoreInfoFormData = z.infer<typeof storeInfoSchema>;

type EditableStoreInfoProps = {
  store: Store;
  onSave: (data: UpdateStoreData) => void;
  isLoading: boolean;
  isEditing: boolean;
  setIsEditing: (isEditing: boolean) => void;
};

export function EditableStoreInfo({
  store,
  onSave,
  isLoading,
  isEditing,
  setIsEditing,
}: EditableStoreInfoProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<StoreInfoFormData>({
    resolver: zodResolver(storeInfoSchema),
    defaultValues: {
      name: store.name,
      description: store.description,
      whatsapp: store.whatsapp,
    },
  });

  const whatsappValue = watch("whatsapp");
  const whatsappDisplay =
    whatsappValue?.length === 11
      ? `(${whatsappValue.slice(0, 2)}) ${whatsappValue.slice(
          2,
          7
        )}-${whatsappValue.slice(7, 11)}`
      : whatsappValue || "";

  const handleWhatsAppChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const numbers = e.target.value.replace(/\D/g, "");
    setValue("whatsapp", numbers);
  };

  const onSubmit = async (data: StoreInfoFormData) => {
    onSave(data);
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
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="text-xs text-gray-400 mb-2 block uppercase tracking-wider">
              Nome da Loja
            </label>
            <input
              type="text"
              {...register("name")}
              className={`w-full px-4 py-3 border rounded-2xl outline-none focus:border-[#FF7622] transition-colors ${
                errors.name ? "border-red-500" : "border-gray-200"
              }`}
            />
            {errors.name && (
              <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>
            )}
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-2 block uppercase tracking-wider">
              Descrição
            </label>
            <textarea
              {...register("description")}
              rows={4}
              className={`w-full px-4 py-3 border rounded-2xl outline-none focus:border-[#FF7622] transition-colors resize-none ${
                errors.description ? "border-red-500" : "border-gray-200"
              }`}
            />
            {errors.description && (
              <p className="text-xs text-red-500 mt-1">
                {errors.description.message}
              </p>
            )}
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
              className={`w-full px-4 py-3 border rounded-2xl outline-none focus:border-[#FF7622] transition-colors ${
                errors.whatsapp ? "border-red-500" : "border-gray-200"
              }`}
            />
            {errors.whatsapp && (
              <p className="text-xs text-red-500 mt-1">
                {errors.whatsapp.message}
              </p>
            )}
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-[#FF7622] to-[#E6661A] text-white py-3 rounded-full uppercase transition-all shadow-lg hover:shadow-xl active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Salvando..." : "Salvar"}
          </button>
        </form>
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
