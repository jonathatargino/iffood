import z from "zod";

export const productDetailFormSchema = z.object({
  productOption: z.object({
    id: z.string(),
    name: z.string(),
    quantity: z.number(),
  }),
  quantity: z.number().min(1, "A quantidade deve ser pelo menos 1"),
});

export type ProductDetailFormData = z.infer<typeof productDetailFormSchema>;
