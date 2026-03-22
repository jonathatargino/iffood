interface EditOrderRequestBottomMenuProps {
  isLoading: boolean;
  itemsCount: number;
  onSubmit: () => void;
}

export function EditOrderRequestBottomMenu({
  isLoading,
  itemsCount,
  onSubmit,
}: EditOrderRequestBottomMenuProps) {
  return (
    <div className="fixed right-0 bottom-0 left-0 border-t border-gray-100 bg-white px-6 py-4">
      <button
        onClick={onSubmit}
        disabled={itemsCount === 0 || isLoading}
        className="w-full rounded-full bg-linear-to-r from-[#FF7622] to-[#E6661A] py-3.5 text-sm font-semibold text-white shadow-lg transition-all active:scale-[0.98] disabled:opacity-50"
      >
        {isLoading ? "Processando..." : "Alterar e Concluir"}
      </button>
    </div>
  );
}
