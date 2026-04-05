import { X } from "lucide-react";
import { Button } from "../../../../../../../components/Button";
import { LoadingButton } from "../../../../../../../components/LoadingButton";
import { ImageDropzoneInput } from "@/pages/Product/ProductPage/ProductForm/components/ImageDropzoneInput";
import { useForm } from "react-hook-form";
import { uploadPhotoSchema, type UploadPhotoData } from "./schema";
import { zodResolver } from "@hookform/resolvers/zod";

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
  const {
    control,
    handleSubmit,
    formState: { isValid },
    reset,
  } = useForm<UploadPhotoData>({
    resolver: zodResolver(uploadPhotoSchema),
  });

  const handleClose = () => {
    reset();
    onClose();
  };

  const onSubmit = (data: UploadPhotoData) => {
    onUpload(data.image);
  };

  if (!isOpen) return null;

  return (
    <div className="animate-in fade-in fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="animate-in slide-in-from-bottom max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-white p-6 duration-300"
      >
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
          <ImageDropzoneInput control={control} name="image" />
        </div>

        <div className="flex gap-3">
          <Button
            onClick={handleClose}
            className="flex-1"
            variant={"secondary"}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <LoadingButton
            type="submit"
            disabled={!isValid || isLoading}
            className="flex-1"
            isLoading={isLoading}
          >
            Salvar
          </LoadingButton>
        </div>
      </form>
    </div>
  );
}
