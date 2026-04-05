import { Controller, type Control } from "react-hook-form";
import { tags } from "./const";
import type { ReviewFormData } from "../schema";
import { cn } from "@/lib/utils";

interface ReviewTagsInputProps {
  control: Control<ReviewFormData>;
}

export function ReviewTagsInput({ control }: ReviewTagsInputProps) {
  return (
    <Controller
      control={control}
      name="tags"
      render={({ field: { onChange, value } }) => (
        <div>
          <p className="mb-2 text-xs text-gray-500 uppercase">
            Do que você gostou?
          </p>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <div
                key={tag}
                className={cn(
                  "rounded-full border border-gray-200 p-2 text-xs",
                  {
                    "border-[#FF7622] bg-[#FF7622] text-white":
                      value.includes(tag),
                  },
                )}
                onClick={() => {
                  if (value.includes(tag)) {
                    onChange(value.filter((t) => t !== tag));
                  } else {
                    onChange([...value, tag]);
                  }
                }}
              >
                {tag}
              </div>
            ))}
          </div>
        </div>
      )}
    />
  );
}
