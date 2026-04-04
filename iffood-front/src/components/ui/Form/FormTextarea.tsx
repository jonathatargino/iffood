import { Controller, type Control } from "react-hook-form";
import { cn } from "@/lib/utils";
import { Textarea } from "../textarea";

interface FormTextareaProps {
  label?: string;
  name: string;
  placeholder?: string;
  control: Control<any>;
  transformValue?: (value: any) => any;
}

export function FormTextarea({
  label,
  name,
  placeholder,
  control,
  transformValue,
}: FormTextareaProps) {
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
            <Textarea
              {...field}
              onChange={(e) => {
                const value = transformValue
                  ? transformValue(e.target.value)
                  : e.target.value;
                field.onChange(value);
              }}
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
