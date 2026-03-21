import { X } from "lucide-react";

interface MobileModalHeaderProps {
  title: string;
  onClose: () => void;
}

export const MobileModalHeader = ({
  title,
  onClose,
}: MobileModalHeaderProps) => {
  return (
    <div className="mb-4 flex items-center justify-between">
      <h3 className="text-xl font-semibold text-[#2e2e2e]">{title}</h3>
      <button
        onClick={onClose}
        className="flex size-8 items-center justify-center rounded-full bg-gray-100 transition-colors hover:bg-gray-200"
      >
        <X className="h-4 w-4 text-gray-600" />
      </button>
    </div>
  );
};
