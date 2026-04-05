import z from "zod";

export const orderItemsEditSectionSchema = z.object({
  productId: z.string(),
  productOptionId: z.string(),
  quantity: z.number().min(1, "A quantidade deve ser no mínimo 1"),
});

export type OrderItemsEditSectionFormData = z.infer<
  typeof orderItemsEditSectionSchema
>;
