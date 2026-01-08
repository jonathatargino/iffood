import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Upload, X, Store } from "lucide-react";
import { storeService } from "@/services/store";

const storeFormSchema = z.object({
  name: z.string().min(3, "O nome deve ter pelo menos 3 caracteres"),
  description: z
    .string()
    .min(10, "A descrição deve ter pelo menos 10 caracteres")
    .max(500, "A descrição deve ter no máximo 500 caracteres"),
  whatsapp: z.string().regex(/^\d{11}$/, "WhatsApp deve ter 11 dígitos"),
  photo: z
    .instanceof(File)
    .optional()
    .refine((val) => val !== undefined, "A foto é obrigatória"),
});

type StoreFormData = z.infer<typeof storeFormSchema>;

interface StoreFormProps {
  onBack: () => void;
  onSave: () => void;
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="size-11 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl flex items-center justify-center hover:bg-white transition-all active:scale-95"
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

export function StoreForm({ onBack, onSave }: StoreFormProps) {
  const [photoPreview, setPhotoPreview] = useState<string>("");
  const [whatsappDisplay, setWhatsappDisplay] = useState("");

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isValid },
  } = useForm<StoreFormData>({
    resolver: zodResolver(storeFormSchema),
    mode: "onChange",
    defaultValues: {
      name: "",
      description: "",
      whatsapp: "",
      photo: undefined,
    },
  });

  const createStoreMutation = useMutation({
    mutationFn: storeService.createStore,
    onSuccess: () => {
      onSave();
    },
    onError: (error) => {
      console.error("Erro ao criar loja:", error);
      alert("Erro ao criar loja. Tente novamente.");
    },
  });

  const description = watch("description");

  const formatWhatsApp = (value: string) => {
    const numbers = value.replace(/\D/g, "");

    if (numbers.length <= 2) {
      return numbers;
    } else if (numbers.length <= 7) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    } else if (numbers.length <= 11) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(
        7,
        11
      )}`;
    }
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(
      7,
      11
    )}`;
  };

  const handleWhatsAppChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatWhatsApp(e.target.value);
    const numbers = e.target.value.replace(/\D/g, "");
    setWhatsappDisplay(formatted);
    setValue("whatsapp", numbers, { shouldValidate: true });
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      console.log("Arquivo muito grande");
      return;
    }

    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = () => {
      const { width, height } = img;
      console.log({ width, height });
      if (width < 800 || height < 600) {
        console.log("Resolução muito baixa");
        return;
      } else {
        setValue("photo", file, { shouldValidate: true });
        const reader = new FileReader();
        reader.onloadend = () => {
          setPhotoPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    };
  };

  const handleRemovePhoto = () => {
    setValue("photo", undefined, { shouldValidate: true });
    setPhotoPreview("");
  };

  const onSubmit = (data: StoreFormData) => {
    createStoreMutation.mutate({
      name: data.name,
      description: data.description,
      whatsapp: data.whatsapp,
      photo: data.photo,
    });
  };

  return (
    <div className="bg-[#fafafa] min-h-screen pb-8">
      {/* Header */}
      <div className="bg-linear-to-br from-[#FF7622] to-[#E6661A] px-6 pt-14 pb-8 rounded-b-4xl shadow-lg">
        <div className="flex items-center gap-4">
          <BackButton onClick={onBack} />
          <div>
            <h1 className="text-white text-lg font-semibold">Criar Loja</h1>
            <p className="text-white/80 text-sm">
              Preencha os dados da sua loja
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-6 space-y-6">
        {/* Store Image */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <label className="text-xs text-gray-400 mb-3 block uppercase tracking-wider">
            Foto da Loja *
          </label>
          <div className="relative aspect-square bg-gray-50 rounded-2xl overflow-hidden border-2 border-dashed border-gray-200 hover:border-[#FF7622] transition-colors">
            {photoPreview ? (
              <>
                <img
                  src={photoPreview}
                  alt="Store"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="absolute top-3 right-3 size-8 bg-red-600 hover:bg-red-700 rounded-full flex items-center justify-center transition-colors shadow-lg"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </>
            ) : (
              <label className="flex flex-col items-center justify-center h-full cursor-pointer">
                <div className="size-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                  <Upload className="w-8 h-8 text-gray-400" />
                </div>
                <span className="text-sm text-gray-500 mb-1">
                  Clique para fazer upload
                </span>
                <span className="text-xs text-gray-400">JPG, PNG ou WEBP</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoChange}
                />
              </label>
            )}
          </div>
          {errors.photo && (
            <p className="text-xs text-red-600 mt-2">{errors.photo.message}</p>
          )}
          {!errors.photo && (
            <p className="text-xs text-gray-400 mt-2">
              Esta será a imagem de capa da sua loja
            </p>
          )}
        </div>

        {/* Store Info */}
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
                <p className="text-xs text-red-600">
                  {errors.description.message}
                </p>
              ) : (
                <p className="text-xs text-gray-400">
                  Conte aos clientes sobre sua loja
                </p>
              )}
              <span className="text-xs text-gray-400">
                {description?.length || 0}/500
              </span>
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
              <p className="text-xs text-red-600 mt-2">
                {errors.whatsapp.message}
              </p>
            )}
            {!errors.whatsapp && (
              <p className="text-xs text-gray-400 mt-2">
                Número de WhatsApp para contato
              </p>
            )}
          </div>
        </div>

        {/* Info Card */}
        <div className="bg-blue-50 border border-blue-100 rounded-3xl p-5">
          <div className="flex items-start gap-3">
            <div className="size-10 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
              <Store className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-medium text-blue-900 mb-1">
                Próximos passos
              </h4>
              <p className="text-xs text-blue-700 leading-relaxed">
                Após criar sua loja, você poderá configurar horários de
                funcionamento, adicionar produtos e começar a receber pedidos.
              </p>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <button
          type="submit"
          disabled={!isValid || createStoreMutation.isPending}
          className="w-full bg-linear-to-r from-[#FF7622] to-[#E6661A] text-white py-4 rounded-full uppercase transition-all shadow-lg hover:shadow-xl active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {createStoreMutation.isPending ? (
            <>
              <div className="size-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Criando...
            </>
          ) : (
            <>
              <Store className="w-5 h-5" />
              Criar Loja
            </>
          )}
        </button>

        {!isValid && (
          <p className="text-center text-sm text-gray-400">
            Preencha todos os campos obrigatórios (*)
          </p>
        )}
      </form>
    </div>
  );
}
