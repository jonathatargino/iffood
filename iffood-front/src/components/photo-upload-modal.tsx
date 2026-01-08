import { useState } from "react";
import { X, Upload } from "lucide-react";
import { toast } from "sonner";

interface PhotoUploadModalProps {
  isOpen: boolean;
  title: string;
  currentImage: string;
  onUpload: (file: File) => void;
  onClose: () => void;
  isLoading?: boolean;
}

export function PhotoUploadModal({
  isOpen,
  title,
  currentImage,
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

    // Validar tamanho do arquivo (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Arquivo muito grande", {
        description: "A imagem deve ter no máximo 5MB.",
      });
      return;
    }

    // Validar tipo de arquivo
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
      if (width < 800 || height < 600) {
        toast.error("Resolução muito baixa", {
          description: "A imagem deve ter no mínimo 800x600 pixels.",
        });
        URL.revokeObjectURL(imageUrl);
        return;
      }

      setPreview(imageUrl);
      setSelectedFile(file);
      toast.success("Imagem selecionada", {
        description: "Clique em salvar para atualizar a foto.",
      });
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

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-t-3xl w-full max-w-md p-6 animate-in slide-in-from-bottom duration-300 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-[#2e2e2e]">{title}</h3>
          <button
            onClick={handleClose}
            className="size-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        {/* Upload Area / Preview */}
        <div className="mb-6">
          <div className="relative aspect-square bg-gray-50 rounded-2xl overflow-hidden border-2 border-dashed border-gray-200 hover:border-[#FF7622] transition-colors">
            {selectedFile ? (
              <>
                <img
                  src={preview}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => {
                    setPreview("");
                    setSelectedFile(null);
                  }}
                  className="absolute top-3 right-3 size-8 bg-red-600 hover:bg-red-700 rounded-full flex items-center justify-center transition-colors shadow-lg"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </>
            ) : null}
            <label className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer">
              {!selectedFile && (
                <>
                  <div className="size-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                    <Upload className="w-8 h-8 text-gray-400" />
                  </div>
                  <span className="text-sm text-gray-500 mb-1">
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

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleClose}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-[#2e2e2e] py-3 rounded-full transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={!selectedFile || isLoading}
            className="flex-1 bg-gradient-to-r from-[#FF7622] to-[#E6661A] text-white py-3 rounded-full transition-all shadow-lg hover:shadow-xl active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="size-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
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
