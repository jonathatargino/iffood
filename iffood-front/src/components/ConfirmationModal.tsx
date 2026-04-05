import { X } from "lucide-react";
import { Button } from "./Button";
import { LoadingButton } from "./LoadingButton";

type ConfirmationModalProps = {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: "danger" | "default";
  isLoading?: boolean;
};

export function ConfirmationModal({
  isOpen,
  title,
  message,
  confirmText,
  cancelText,
  onConfirm,
  onCancel,
  variant = "default",
  isLoading = false,
}: ConfirmationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="animate-in fade-in fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm">
      <div className="animate-in slide-in-from-bottom w-full max-w-md rounded-t-3xl bg-white p-6 duration-300">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-[#2e2e2e]">{title}</h3>
          <Button
            size={"icon"}
            onClick={onCancel}
            className="bg-gray-100 hover:bg-gray-200"
          >
            <X className="text-gray-600" />
          </Button>
        </div>

        <p className="mb-3 text-sm leading-relaxed text-gray-600">{message}</p>

        <div className="flex gap-3">
          <Button
            onClick={onCancel}
            disabled={isLoading}
            variant={"secondary"}
            className="flex-1"
          >
            {cancelText}
          </Button>
          <LoadingButton
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            variant={variant === "danger" ? "destructive" : "default"}
            isLoading={isLoading}
            className="flex-1"
          >
            {confirmText}
          </LoadingButton>
        </div>
      </div>
    </div>
  );
}
