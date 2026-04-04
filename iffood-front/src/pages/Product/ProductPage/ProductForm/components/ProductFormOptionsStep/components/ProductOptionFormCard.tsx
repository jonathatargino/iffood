import { Minus, Plus, Trash2 } from "lucide-react";

export function ProductOptionFormCard({
  index,
  canDelete,
  register,
  errors,
  quantity,
  onDecrease,
  onIncrease,
  onDelete,
}: {
  index: number;
  canDelete: boolean;
  register: any;
  errors: any;
  quantity: number;
  onDecrease: () => void;
  onIncrease: () => void;
  onDelete: () => void;
}) {
  const error = errors?.flavors?.[index];

  return (
    <div className="rounded-2xl border-2 border-gray-200 bg-gray-50 p-4">
      <div className="mb-3 flex items-start justify-between">
        <div className="mr-2 flex-1">
          <label className="mb-1.5 block text-xs tracking-wider text-gray-400 uppercase">
            Sabor
          </label>
          <input
            type="text"
            {...register(`flavors.${index}.name`)}
            placeholder="Ex: Chocolate, Morango..."
            className={`w-full rounded-xl border bg-white px-3 py-2 text-sm transition-colors outline-none focus:border-[#FF7622] ${
              error?.name ? "border-red-500" : "border-gray-300"
            }`}
          />
          {error?.name && (
            <p className="mt-1 text-xs text-red-500">{error.name.message}</p>
          )}
        </div>
        {canDelete && (
          <button
            type="button"
            onClick={onDelete}
            className="mt-6 flex size-8 shrink-0 items-center justify-center rounded-lg bg-red-50 transition-colors hover:bg-red-100"
          >
            <Trash2 className="h-4 w-4 text-red-600" />
          </button>
        )}
      </div>

      <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-3">
        <div>
          <div className="mb-1 text-xs tracking-wider text-gray-400 uppercase">
            Estoque
          </div>
          <div className="text-2xl text-[#2e2e2e]">{quantity}</div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onDecrease}
            disabled={quantity <= 0}
            className={`flex size-9 items-center justify-center rounded-lg transition-all ${
              quantity <= 0
                ? "cursor-not-allowed bg-gray-100 text-gray-300"
                : "bg-[#FF7622] text-white hover:bg-[#E6661A] active:scale-95"
            }`}
          >
            <Minus className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onIncrease}
            className="flex size-9 items-center justify-center rounded-lg bg-[#FF7622] text-white transition-all hover:bg-[#E6661A] active:scale-95"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
