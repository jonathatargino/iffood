import { useFormContext } from "react-hook-form";
import type { ProductFormData } from "../../../schema";
import { PRODUCT_CATEGORIES } from "../../../utils";
import { formatPriceInput } from "@/utils/currency";

export function ProductFormInfoStep() {
  const {
    register,
    setValue,
    formState: { errors },
  } = useFormContext<ProductFormData>();

  return (
    <div className="flex flex-col gap-4">
      <div>
        <label className="mb-2 block text-xs tracking-wider text-gray-400 uppercase">
          Nome do Produto*
        </label>
        <input
          type="text"
          {...register("name")}
          placeholder="Ex: Pizza Margherita"
          className={`w-full rounded-2xl border px-4 py-3 transition-colors outline-none focus:border-[#FF7622] ${
            errors.name ? "border-red-500" : "border-gray-200"
          }`}
        />
        {errors.name && (
          <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>
        )}
      </div>

      <div>
        <label className="mb-2 block text-xs tracking-wider text-gray-400 uppercase">
          Descrição*
        </label>
        <textarea
          {...register("description")}
          placeholder="Descreva seu produto..."
          rows={3}
          className={`w-full resize-none rounded-2xl border px-4 py-3 transition-colors outline-none focus:border-[#FF7622] ${
            errors.description ? "border-red-500" : "border-gray-200"
          }`}
        />
        {errors.description && (
          <p className="mt-1 text-xs text-red-500">
            {errors.description.message}
          </p>
        )}
      </div>

      <div>
        <label className="mb-2 block text-xs tracking-wider text-gray-400 uppercase">
          Preço (R$)*
        </label>
        <input
          type="text"
          {...register("price")}
          onChange={(e) => {
            const rawValue = e.target.value;
            const formattedValue = formatPriceInput(rawValue);
            setValue("price", formattedValue);
          }}
          placeholder="0,00"
          className={`w-full rounded-2xl border px-4 py-3 transition-colors outline-none focus:border-[#FF7622] ${
            errors.price ? "border-red-500" : "border-gray-200"
          }`}
        />
        {errors.price && (
          <p className="mt-1 text-xs text-red-500">{errors.price.message}</p>
        )}
      </div>

      <div>
        <label className="mb-2 block text-xs tracking-wider text-gray-400 uppercase">
          Categoria*
        </label>
        <select
          {...register("category")}
          className={`w-full rounded-2xl border bg-white px-4 py-3 transition-colors outline-none focus:border-[#FF7622] ${
            errors.category ? "border-red-500" : "border-gray-200"
          }`}
        >
          {PRODUCT_CATEGORIES.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
        {errors.category && (
          <p className="mt-1 text-xs text-red-500">{errors.category.message}</p>
        )}
      </div>
    </div>
  );
}
