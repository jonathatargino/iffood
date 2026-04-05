import { LoadingView } from "@/views/LoadingView";
import { ReviewPage } from "./components/ReviewPage";
import { useGetPendingReview } from "./hooks/useGetPendingReview";

export interface ReviewGuardProps {
  children: React.ReactNode;
}

export function ReviewGuard({ children }: ReviewGuardProps) {
  const { data: pendingReview, isLoading, isError } = useGetPendingReview();

  if (isLoading) {
    return <LoadingView />;
  }

  if (pendingReview && !isError) {
    return <ReviewPage reviewRequest={pendingReview} />;
  }

  return children;
}
