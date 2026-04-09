import { SectionHeader } from "@/components/SectionHeader";
import type { Review } from "@/models/review";
import { ReviewItem } from "./components/ReviewItem";
import { AIReviewResume } from "./components/AIReviewResume";
import React from "react";

interface StoreReviewsSectionProps {
  reviews: Review[];
  reviewResume?: string;
}

export function StoreReviewsSection({
  reviews,
  reviewResume,
}: StoreReviewsSectionProps) {
  return (
    <div>
      <SectionHeader title="Últimas Avaliações" />
      <AIReviewResume reviewResume={reviewResume} />
      {reviews.map((review, index) => (
        <React.Fragment key={review.id}>
          {index > 0 && <hr className="mx-4 border-gray-100" />}
          <ReviewItem review={review} />
        </React.Fragment>
      ))}
    </div>
  );
}
