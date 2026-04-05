import z from "zod";

export const reviewSchema = z.object({
  rating: z.number().int().min(0).max(5),
  tags: z.array(z.string()),
  description: z.string().optional(),
});

export type ReviewFormData = z.infer<typeof reviewSchema>;
