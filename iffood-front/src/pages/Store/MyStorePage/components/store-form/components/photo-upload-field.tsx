import { useState } from "react";
import { Upload, X } from "lucide-react";
import type { FieldError } from "react-hook-form";
import { toast } from "sonner";
import { MAX_FILE_SIZE, ALLOWED_TYPES } from "./utils";

type PhotoUploadFieldProps = {
  error?: FieldError;
  onPhotoSelect: (file: File) => void;
};

export function PhotoUploadField({
  error,
  onPhotoSelect,
}: PhotoUploadFieldProps) {
  const [photoPreview, setPhotoPreview] = useState("");

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error("Formato inválido. Use JPG, PNG ou WEBP");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      toast.error("Arquivo muito grande. Máximo: 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const preview = reader.result as string;
      setPhotoPreview(preview);
      onPhotoSelect(file);
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setPhotoPreview("");
  };
  return (
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
      {error && <p className="text-xs text-red-600 mt-2">{error.message}</p>}
      {!error && (
        <p className="text-xs text-gray-400 mt-2">
          Esta será a imagem de capa da sua loja
        </p>
      )}
    </div>
  );
}
