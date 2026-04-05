import type { Review } from "@/models/review";
import { Star } from "lucide-react";

interface ReviewItemProps {
  review: Review;
}

export function ReviewItem({ review }: ReviewItemProps) {
  const formattedDate = new Date(review.createdAt).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  });

  return (
    <div className="flex flex-col gap-4 rounded p-4">
      <div className="flex items-center">
        <div className="mr-2 flex text-yellow-500">
          {Array.from({ length: review.rating }, (_, i) => (
            <Star
              key={i}
              className="size-5 fill-yellow-400 stroke-yellow-400"
            />
          ))}
          {Array.from({ length: 5 - review.rating }, (_, i) => (
            <Star key={i} className="size-5 stroke-gray-300" />
          ))}
        </div>
        <span className="text-xs text-gray-500">{formattedDate}</span>
      </div>
      {review.tags && review.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {review.tags.map((tag, index) => (
            <span
              key={index}
              className="rounded-full bg-[#FF7622] px-2 py-1 text-xs font-semibold text-white"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
      {review.description && (
        <p className="text-xs text-gray-700">{review.description}</p>
      )}
    </div>
  );
}
