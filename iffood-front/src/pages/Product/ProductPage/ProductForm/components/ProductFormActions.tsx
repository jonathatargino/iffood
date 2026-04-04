import { useNavigate } from "react-router";

interface ProductFormActionsProps {
  isEditing: boolean;
  isDeleteLoading: boolean;
  isLoading: boolean;
  setShowDeleteModal: (show: boolean) => void;
}

export function ProductFormActions({
  isEditing,
  isDeleteLoading,
  isLoading,
  setShowDeleteModal,
}: ProductFormActionsProps) {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col gap-2 px-6">
      {isEditing && (
        <button
          type="button"
          onClick={() => setShowDeleteModal(true)}
          disabled={isDeleteLoading}
          className="w-full transform rounded-2xl bg-red-600 px-4 py-4 text-white transition hover:bg-red-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isDeleteLoading ? "Deletando..." : "Deletar"}
        </button>
      )}
      <div className="flex gap-3">
        <button
          type="button"
          disabled={isLoading}
          onClick={() => navigate("/loja/minha-loja")}
          className="flex-1 rounded-2xl border-2 border-gray-200 py-4 text-gray-700 transition-colors hover:bg-gray-50"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 rounded-2xl bg-gradient-to-br from-[#FF7622] to-[#E6661A] py-4 text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? "Salvando..." : "Salvar Produto"}
        </button>
      </div>
    </div>
  );
}
