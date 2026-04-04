import { useState } from "react";
import { X, Upload } from "lucide-react";
import { toast } from "sonner";
import {
  MAX_FILE_SIZE,
  MIN_WIDTH,
  MIN_HEIGHT,
  MAX_WIDTH,
  MAX_HEIGHT,
} from "./utils";

type PhotoUploadModalProps = {
  isOpen: boolean;
  title: string;
  onUpload: (file: File) => void;
  onClose: () => void;
  isLoading?: boolean;
};

export function PhotoUploadModal({
  isOpen,
  title,
  onUpload,
  onClose,
  isLoading = false,
}: PhotoUploadModalProps) {
  const [preview, setPreview] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

    img.onload = () => {
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

      setPreview(imageUrl);
      setSelectedFile(file);
    };

    img.onerror = () => {
      toast.error("Erro ao carregar imagem", {
        description: "O arquivo selecionado não é uma imagem válida.",
      });
      URL.revokeObjectURL(imageUrl);
    };
  };

  const handleSave = () => {
    if (selectedFile) {
      onUpload(selectedFile);
    }
  };

  const handleClose = () => {
    setPreview("");
    setSelectedFile(null);
    onClose();
  };

  const handleRemovePreview = () => {
    if (preview) {
      URL.revokeObjectURL(preview);
    }
    setPreview("");
    setSelectedFile(null);
  };

  return (
    <div className="animate-in fade-in fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm">
      <div className="animate-in slide-in-from-bottom max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-white p-6 duration-300">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-xl font-semibold text-[#2e2e2e]">{title}</h3>
          <button
            onClick={handleClose}
            className="flex size-8 items-center justify-center rounded-full bg-gray-100 transition-colors hover:bg-gray-200"
          >
            <X className="h-4 w-4 text-gray-600" />
          </button>
        </div>

        <div className="mb-6">
          <div className="relative aspect-square overflow-hidden rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 transition-colors hover:border-[#FF7622]">
            {selectedFile ? (
              <>
                <img
                  src={preview}
                  alt="Preview"
                  className="h-full w-full object-cover"
                />
                <button
                  type="button"
                  onClick={handleRemovePreview}
                  className="absolute top-3 right-3 flex size-8 items-center justify-center rounded-full bg-red-600 shadow-lg transition-colors hover:bg-red-700"
                >
                  <X className="h-4 w-4 text-white" />
                </button>
              </>
            ) : null}
            <label className="absolute inset-0 flex cursor-pointer flex-col items-center justify-center">
              {!selectedFile && (
                <>
                  <div className="mb-3 flex size-16 items-center justify-center rounded-full bg-gray-100">
                    <Upload className="h-8 w-8 text-gray-400" />
                  </div>
                  <span className="mb-1 text-sm text-gray-500">
                    Clique para selecionar uma foto
                  </span>
                  <span className="text-xs text-gray-400">
                    JPG, PNG ou WEBP (máx. 5MB)
                  </span>
                </>
              )}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </label>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleClose}
            className="flex-1 rounded-full bg-gray-100 py-3 text-[#2e2e2e] transition-colors hover:bg-gray-200"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={!selectedFile || isLoading}
            className="flex flex-1 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#FF7622] to-[#E6661A] py-3 text-white shadow-lg transition-all hover:shadow-xl active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <div className="size-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Salvando...
              </>
            ) : (
              "Salvar"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
