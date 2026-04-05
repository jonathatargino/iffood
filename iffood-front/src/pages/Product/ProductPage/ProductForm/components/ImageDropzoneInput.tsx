import {
  MAX_FILE_SIZE,
  MAX_HEIGHT,
  MAX_WIDTH,
  MIN_HEIGHT,
  MIN_WIDTH,
} from "@/components/utils";
import { Upload, X } from "lucide-react";
import { useCallback, useState } from "react";
import { Controller, type Control } from "react-hook-form";
import { toast } from "sonner";

interface ImageDropzoneInputProps {
  name: string;
  control: Control<any>;
  label?: string;
  previewUrl?: string;
}

export function ImageDropzoneInput({
  name,
  control,
  label,
  previewUrl,
}: ImageDropzoneInputProps) {
  const [preview, setPreview] = useState<string | undefined>(previewUrl);

  const handleFileChange = useCallback(
    (
      e: React.ChangeEvent<HTMLInputElement>,
      onChange: (file: File | undefined) => void,
    ) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (file.size > MAX_FILE_SIZE) {
        toast.error("Arquivo muito grande", {
          description: "A imagem deve ter no máximo 5MB.",
        });
        return;
      }

      if (!file.type.startsWith("image/")) {
        toast.error("Arquivo inválido", {
          description: "Apenas imagens são permitidas.",
        });
        return;
      }

      const img = new Image();
      const imageUrl = URL.createObjectURL(file);
      img.src = imageUrl;

      img.onload = async () => {
        const { width, height } = img;
        if (width < MIN_WIDTH || height < MIN_HEIGHT) {
          toast.error("Resolução muito baixa", {
            description: "A imagem deve ter no mínimo 800x600 pixels.",
          });
          URL.revokeObjectURL(imageUrl);
          return;
        }

        if (width > MAX_WIDTH || height > MAX_HEIGHT) {
          toast.error("Resolução muito alta", {
            description: "A imagem deve ter no máximo 5000x5000 pixels.",
          });
          URL.revokeObjectURL(imageUrl);
          return;
        }

        onChange(file);
      };

      img.onerror = () => {
        toast.error("Erro ao carregar imagem", {
          description: "O arquivo selecionado não é uma imagem válida.",
        });
        URL.revokeObjectURL(imageUrl);
      };
    },
    [],
  );

  return (
    <Controller
      name={name}
      control={control}
      render={({ field: { value, onChange } }) => (
        <div>
          {label && (
            <label className="mb-3 block text-xs tracking-wider text-gray-400 uppercase">
              {label}
            </label>
          )}
          <div className="relative aspect-square overflow-hidden rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 transition-colors hover:border-[#FF7622]">
            {value || preview ? (
              <>
                <img
                  src={value ? URL.createObjectURL(value) : preview}
                  alt={label}
                  className="h-full w-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => {
                    onChange(undefined);
                    setPreview(undefined);
                  }}
                  className="absolute top-3 right-3 flex size-8 items-center justify-center rounded-full bg-red-600 transition-colors hover:bg-red-700"
                >
                  <X className="h-4 w-4 text-white" />
                </button>
              </>
            ) : (
              <label className="flex h-full cursor-pointer flex-col items-center justify-center">
                <Upload className="mb-2 h-10 w-10 text-gray-300" />
                <span className="text-sm text-gray-400">
                  Clique para fazer upload
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, onChange)}
                  className="hidden"
                />
              </label>
            )}
          </div>
        </div>
      )}
    />
  );
}
