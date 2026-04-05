import { Controller, type Control } from "react-hook-form";
import type { ReviewFormData } from "../schema";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface ReviewRatingInputProps {
  control: Control<ReviewFormData>;
}

export function ReviewRatingInput({ control }: ReviewRatingInputProps) {
  return (
    <Controller
      control={control}
      name="rating"
      render={({ field: { onChange, value } }) => (
        <div className="flex justify-center gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              onClick={() => onChange(star)}
              fill={value >= star ? "#FF7622" : "none"}
              className={cn("size-10 cursor-pointer stroke-gray-400 stroke-1", {
                "stroke-0": value >= star,
              })}
            />
          ))}
        </div>
      )}
    />
  );
}
