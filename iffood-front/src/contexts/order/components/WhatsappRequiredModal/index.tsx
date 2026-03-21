import { MobileModal } from "@/components/Modal/modal";
import { WhatsappForm } from "./WhatsappForm";

interface WhatsappRequiredModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WhatsappRequiredModal({
  isOpen,
  onClose,
}: WhatsappRequiredModalProps) {
  if (!isOpen) return null;

  return (
    <MobileModal isOpen={isOpen} onClose={onClose} title="Whatsapp necessário">
      <div className="flex flex-col gap-4">
        <p className="text-sm">
          Para fins de ajudar o vendedor na identificação do cliente, é
          necessário que o número de whatsapp esteja cadastrado.
        </p>
        <WhatsappForm onCancel={onClose} />
      </div>
    </MobileModal>
  );
}
