import { Store } from "lucide-react";

type EmptyStateIconProps = {
  icon: React.ReactNode;
};

export function EmptyStateIcon({ icon }: EmptyStateIconProps) {
  return (
    <div className="size-32 bg-linear-to-br from-[#FF7622]/10 to-[#E6661A]/10 rounded-full mx-auto mb-8 flex items-center justify-center">
      <div className="size-24 bg-linear-to-br from-[#FF7622]/20 to-[#E6661A]/20 rounded-full flex items-center justify-center">
        {icon}
      </div>
    </div>
  );
}

type FeatureListItemProps = {
  text: string;
};

function FeatureListItem({ text }: FeatureListItemProps) {
  return (
    <div className="flex items-start gap-3">
      <div className="size-6 bg-green-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
        <svg
          className="w-3.5 h-3.5 text-green-600"
          fill="none"
          viewBox="0 0 24 24"
        >
          <path
            d="M5 13l4 4L19 7"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
          />
        </svg>
      </div>
      <p className="text-sm text-gray-600">{text}</p>
    </div>
  );
}

export function FeaturesList() {
  return (
    <div className="mt-8 pt-8 border-t border-gray-200">
      <p className="text-sm text-gray-400 mb-4">Com sua loja você poderá:</p>
      <div className="space-y-3 text-left">
        <FeatureListItem text="Adicionar produtos ilimitados" />
        <FeatureListItem text="Gerenciar estoque e sabores" />
        <FeatureListItem text="Receber pedidos via WhatsApp" />
      </div>
    </div>
  );
}

type CreateStoreButtonProps = {
  onClick: () => void;
};

export function CreateStoreButton({ onClick }: CreateStoreButtonProps) {
  return (
    <button
      onClick={onClick}
      className="w-full bg-linear-to-r from-[#FF7622] to-[#E6661A] text-white py-4 px-6 rounded-full shadow-lg hover:shadow-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2"
    >
      <Store className="w-5 h-5" />
      Criar Minha Loja
    </button>
  );
}
