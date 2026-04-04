import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router";

interface ProductFormActionsProps {
  isLoading: boolean;
}

export function ProductFormActions({ isLoading }: ProductFormActionsProps) {
  const navigate = useNavigate();

  return (
    <div className="flex justify-end gap-3 px-6">
      <Button
        type="button"
        variant={"secondary"}
        disabled={isLoading}
        onClick={() => navigate("/loja/minha-loja")}
      >
        Cancelar
      </Button>
      <Button type="submit" disabled={isLoading}>
        {isLoading ? "Salvando..." : "Salvar Produto"}
      </Button>
    </div>
  );
}
