import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Edit2 } from "lucide-react";
import type { Store, UpdateStoreData } from "@/services/store";
import { SectionHeader } from "@/components/SectionHeader";

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
          7,
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
    <div>
      {isEditing ? (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="mb-2 block text-xs tracking-wider text-gray-400 uppercase">
              Nome da Loja
            </label>
            <input
              type="text"
              {...register("name")}
              className={`w-full rounded-2xl border px-4 py-3 transition-colors outline-none focus:border-[#FF7622] ${
                errors.name ? "border-red-500" : "border-gray-200"
              }`}
            />
            {errors.name && (
              <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>
            )}
          </div>
          <div>
            <label className="mb-2 block text-xs tracking-wider text-gray-400 uppercase">
              Descrição
            </label>
            <textarea
              {...register("description")}
              rows={4}
              className={`w-full resize-none rounded-2xl border px-4 py-3 transition-colors outline-none focus:border-[#FF7622] ${
                errors.description ? "border-red-500" : "border-gray-200"
              }`}
            />
            {errors.description && (
              <p className="mt-1 text-xs text-red-500">
                {errors.description.message}
              </p>
            )}
          </div>
          <div>
            <label className="mb-2 block text-xs tracking-wider text-gray-400 uppercase">
              WhatsApp
            </label>
            <input
              type="text"
              value={whatsappDisplay}
              onChange={handleWhatsAppChange}
              placeholder="(XX) XXXXX-XXXX"
              className={`w-full rounded-2xl border px-4 py-3 transition-colors outline-none focus:border-[#FF7622] ${
                errors.whatsapp ? "border-red-500" : "border-gray-200"
              }`}
            />
            {errors.whatsapp && (
              <p className="mt-1 text-xs text-red-500">
                {errors.whatsapp.message}
              </p>
            )}
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-full bg-gradient-to-r from-[#FF7622] to-[#E6661A] py-3 text-white uppercase shadow-lg transition-all hover:shadow-xl active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? "Salvando..." : "Salvar"}
          </button>
        </form>
      ) : (
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
          <div>
            <div className="mb-1 text-xs tracking-wider text-gray-400 uppercase">
              WhatsApp
            </div>
            <div className="text-[#2e2e2e]">{whatsappDisplay}</div>
          </div>
        </div>
      )}
    </div>
  );
}
