import { Button } from "@/components/ui/button";
import { ChefHat } from "lucide-react";
import { useNavigate } from "react-router";

export function NotFoundPage() {
  const navigate = useNavigate();

  const onBack = () => {
    navigate("/");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4">
      <div className="w-full max-w-md text-center">
        <div className="relative mb-8 inline-block">
          <div className="relative rounded-full bg-gradient-to-br from-[#FF7622] to-[#FF8C42] p-8 shadow-lg">
            <ChefHat className="h-10 w-10 text-white" strokeWidth={1.5} />
          </div>
        </div>

        <div className="mb-8 space-y-3">
          <h2 className="text-lg font-semibold text-[#FF7622]">
            Ops! Página não encontrada
          </h2>
          <p className="text-sm text-gray-600">
            Parece que essa página não existe. Que tal dar uma olhadinha nas
            ofertas disponíveis?
          </p>
        </div>

        <Button onClick={onBack} className="h-12 w-full bg-[#FF7622]">
          Voltar para o início
        </Button>
      </div>
    </div>
  );
}
