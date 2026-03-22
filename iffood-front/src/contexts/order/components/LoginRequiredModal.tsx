import { GoogleLoginButton } from "@/components/GoogleLoginButton";
import { MobileModal } from "@/components/Modal/modal";

interface LoginRequiredModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LoginRequiredModal({
  isOpen,
  onClose,
}: LoginRequiredModalProps) {
  if (!isOpen) return null;

  return (
    <MobileModal isOpen={isOpen} onClose={onClose} title="Login necessário">
      <div className="flex flex-col gap-4">
        <p className="text-sm">
          Para fazer pedidos no IF Food, é necessário estar logado.{" "}
        </p>
        <GoogleLoginButton />
      </div>
    </MobileModal>
  );
}
