import { X } from "lucide-react";

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: "danger" | "default";
}

export function ConfirmationModal({
  isOpen,
  title,
  message,
  confirmText,
  cancelText,
  onConfirm,
  onCancel,
  variant = "default",
}: ConfirmationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-t-3xl w-full max-w-md p-6 animate-in slide-in-from-bottom duration-300">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-[#2e2e2e]">{title}</h3>
          <button
            onClick={onCancel}
            className="size-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        <p className="text-gray-600 mb-6 leading-relaxed">{message}</p>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-[#2e2e2e] py-3 rounded-full transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 text-white py-3 rounded-full transition-all shadow-lg hover:shadow-xl active:scale-[0.98] ${
              variant === "danger"
                ? "bg-red-600 hover:bg-red-700"
                : "bg-gradient-to-r from-[#FF7622] to-[#E6661A]"
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
