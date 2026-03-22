import type { ReactNode } from "react";
import { MobileModalHeader } from "./components/MobileModalHeader";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title: string;
}

export function MobileModal({ isOpen, onClose, children, title }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="animate-in fade-in fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm">
      <div className="animate-in slide-in-from-bottom w-full max-w-md rounded-t-3xl bg-white p-6 duration-300">
        <MobileModalHeader title={title} onClose={onClose} />
        {children}
      </div>
    </div>
  );
}
