import type { HTMLInputTypeAttribute } from "react";
import { useFormContext } from "react-hook-form";

interface FormInputProps {
  label?: string;
  name: string;
  placeholder?: string;
  type?: HTMLInputTypeAttribute;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  value?: string;
}

export function FormInput({
  label,
  name,
  placeholder,
  type = "text",
  onChange,
  value,
}: FormInputProps) {
  const {
    register,
    formState: { errors },
  } = useFormContext();
  const hasError = !!errors[name];
  const errorMessage = errors[name]?.message as string | undefined;

  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label className="block text-xs tracking-wider text-gray-400 uppercase">
          {label}
        </label>
      )}
      <div>
        <input
          type={type}
          {...register(name)}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`w-full rounded-2xl border px-4 py-3 transition-colors outline-none focus:border-[#FF7622] ${
            hasError ? "border-red-500" : "border-gray-200"
          }`}
        />
        {hasError && (
          <p className="mt-1 text-xs text-red-500">{errorMessage}</p>
        )}
      </div>
    </div>
  );
}
