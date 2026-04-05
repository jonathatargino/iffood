import { LoadingButton } from "@/components/LoadingButton";

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
      <LoadingButton
        onClick={onSubmit}
        isLoading={isLoading}
        disabled={itemsCount === 0}
        className="w-full"
      >
        Alterar e Concluir
      </LoadingButton>
    </div>
  );
}
