import { FeaturesList } from "./components/FeaturesList";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/Button";

type NoStoreProps = {
  onBack: () => void;
  onCreateStore: () => void;
};

export function NoStore({ onCreateStore }: NoStoreProps) {
  return (
    <div className="min-h-screen bg-white">
      <PageHeader text="Minha loja" />

      <div className="flex flex-col items-center justify-center px-6 py-12">
        <div className="max-w-sm text-center">
          <h2 className="mb-4 font-bold text-[#2e2e2e]">
            Você ainda não tem uma loja
          </h2>
          <p className="mb-8 text-sm leading-relaxed text-gray-500">
            Crie sua loja agora e comece a vender seus produtos para os alunos
            da sua instituição e clientes em nossa plataforma.
          </p>

          <Button className="w-full" onClick={onCreateStore}>
            Criar Loja
          </Button>
          <FeaturesList />
        </div>
      </div>
    </div>
  );
}
