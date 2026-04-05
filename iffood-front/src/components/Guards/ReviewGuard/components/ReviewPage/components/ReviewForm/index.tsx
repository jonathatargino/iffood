import { FormTextarea } from "@/components/Form";
import { useForm } from "react-hook-form";
import { ReviewTagsInput } from "./ReviewTagsInput";
import { reviewSchema, type ReviewFormData } from "./schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { ReviewRatingInput } from "./ReviewRatingInput";
import { LoadingButton } from "@/components/LoadingButton";
import { useCreateReview } from "@/components/Guards/ReviewGuard/hooks/useCreateReview";

interface ReviewFormProps {
  reviewRequestId: string;
}

export function ReviewForm({ reviewRequestId }: ReviewFormProps) {
  const { control, handleSubmit } = useForm<ReviewFormData>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      rating: 5,
      tags: [],
    },
  });

  const createReviewMutation = useCreateReview();

  function onSubmit(data: ReviewFormData) {
    createReviewMutation.mutate({ ...data, reviewRequestId });
  }
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="px-6">
      <h1 className="text-center font-bold">O que você achou do seu pedido?</h1>
      <p className="text-center text-xs text-gray-500">
        Escolha de 1 a 5 estrelas para classificar.
      </p>

      <div className="mt-4 flex flex-col gap-6">
        <ReviewRatingInput control={control} />
        <ReviewTagsInput control={control} />
        <FormTextarea
          control={control}
          name="description"
          label="Deixar comentário"
          placeholder="Conte-nos da sua experiência (opcional)"
        />
      </div>

      <div className="fixed bottom-2 left-0 w-full border-t border-gray-100 px-6 pt-2">
        <LoadingButton
          className="w-full"
          type="submit"
          isLoading={createReviewMutation.isPending}
        >
          Enviar Avaliação
        </LoadingButton>
      </div>
    </form>
  );
}
