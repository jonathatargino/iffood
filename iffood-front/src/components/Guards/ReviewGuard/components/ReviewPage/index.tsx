import { PageHeader } from "@/components/PageHeader";
import type { ReviewRequest } from "@/models/review";
import { ReviewStoreInfo } from "./components/ReviewStoreInfo";
import { ReviewForm } from "./components/ReviewForm";

interface ReviewPageProps {
  reviewRequest: ReviewRequest;
}

export function ReviewPage({ reviewRequest }: ReviewPageProps) {
  return (
    <>
      <PageHeader text="Avalie seu pedido" />
      <ReviewStoreInfo
        storeName={reviewRequest.storeName}
        storePhotoUrl={reviewRequest.storePhotoUrl ?? undefined}
        reviewRequestCreatedAt={new Date(reviewRequest.createdAt)}
      />
      <ReviewForm reviewRequestId={reviewRequest.id} />
    </>
  );
}
