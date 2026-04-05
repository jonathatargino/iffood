import type { HTMLInputTypeAttribute } from "react";
import { Controller, type Control } from "react-hook-form";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

interface FormSelectOption {
  label: string;
  value: any;
}

interface FormSelectProps {
  label?: string;
  name: string;
  placeholder?: string;
  type?: HTMLInputTypeAttribute;
  control: Control<any>;
  options: ReadonlyArray<FormSelectOption>;
}

export function FormSelect({ label, name, control, options }: FormSelectProps) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <div className="flex flex-col gap-2">
          {label && (
            <label className="block text-xs tracking-wider text-gray-400 uppercase">
              {label}
            </label>
          )}
          <div className="relative">
            <select
              {...field}
              className={cn(
                "h-12 w-full appearance-none rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm transition-colors outline-none focus:border-[#FF7622]",
                {
                  "border-red-500": error,
                },
              )}
            >
              {options.map((option) => (
                <option key={option.label} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-gray-500">
              <ChevronDown size={16} />
            </div>
            {error && (
              <p className="mt-1 text-xs text-red-500">{error.message}</p>
            )}
          </div>
        </div>
      )}
    />
  );
}
