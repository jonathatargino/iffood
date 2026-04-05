import { Button } from "@/components/Button";
import { LoadingButton } from "@/components/LoadingButton";
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
        className="flex-1"
      >
        Cancelar
      </Button>
      <LoadingButton type="submit" isLoading={isLoading} className="flex-1">
        Salvar Produto
      </LoadingButton>
    </div>
  );
}
