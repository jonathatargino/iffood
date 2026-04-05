import { SectionHeader } from "@/components/SectionHeader";
import type { Review } from "@/models/review";
import { ReviewItem } from "./components/ReviewItem";
import React from "react";

interface StoreReviewsSectionProps {
  reviews: Review[];
}

export function StoreReviewsSection({ reviews }: StoreReviewsSectionProps) {
  return (
    <div>
      <SectionHeader title="Últimas Avaliações" />
      {reviews.map((review, index) => (
        <React.Fragment key={review.id}>
          {index > 0 && <hr className="mx-4 border-gray-100" />}
          <ReviewItem review={review} />
        </React.Fragment>
      ))}
    </div>
  );
}
