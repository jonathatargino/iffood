import { Store } from "lucide-react";
import {
  EmptyStateIcon,
  FeaturesList,
  CreateStoreButton,
} from "./components/empty-state-content";

type NoStoreProps = {
  onBack: () => void;
  onCreateStore: () => void;
};

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="size-11 bg-white rounded-2xl shadow-md flex items-center justify-center active:scale-95 transition-transform"
    >
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24">
        <path
          d="M15 18l-6-6 6-6"
          stroke="#2e2e2e"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
        />
      </svg>
    </button>
  );
}

export function NoStore({ onBack, onCreateStore }: NoStoreProps) {
  return (
    <div className="bg-[#fafafa] min-h-screen">
      <div className="bg-linear-to-br from-[#FF7622] to-[#E6661A] px-6 pt-14 pb-8 rounded-b-4xl shadow-lg">
        <div className="flex items-center gap-4">
          <BackButton onClick={onBack} />
          <h1 className="text-white text-lg font-semibold">Minha Loja</h1>
        </div>
      </div>

      <div className="px-6 py-12 flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="text-center max-w-sm">
          <EmptyStateIcon
            icon={<Store className="w-16 h-16 text-[#FF7622]" />}
          />

          <h2 className="text-2xl font-bold text-[#2e2e2e] mb-4">
            Você ainda não tem uma loja
          </h2>
          <p className="text-gray-500 leading-relaxed mb-8">
            Crie sua loja agora e comece a vender seus produtos para os alunos
            da sua instituição e clientes em nossa plataforma.
          </p>

          <CreateStoreButton onClick={onCreateStore} />
          <FeaturesList />
        </div>
      </div>
    </div>
  );
}
