import type { HTMLInputTypeAttribute } from "react";
import { Controller, type Control } from "react-hook-form";
import { Input } from "../Input";
import { cn } from "@/lib/utils";

interface FormInputProps {
  label?: string;
  name: string;
  placeholder?: string;
  type?: HTMLInputTypeAttribute;
  control: Control<any>;
  transformValue?: (value: any) => any;
}

export function FormInput({
  label,
  name,
  placeholder,
  type = "text",
  control,
  transformValue,
}: FormInputProps) {
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
          <div>
            <Input
              {...field}
              onChange={(e) => {
                const value = transformValue
                  ? transformValue(e.target.value)
                  : e.target.value;
                field.onChange(value);
              }}
              type={type}
              placeholder={placeholder}
              className={cn({ "border-red-500": error })}
            />
            {error && (
              <p className="mt-1 text-xs text-red-500">{error.message}</p>
            )}
          </div>
        </div>
      )}
    />
  );
}
