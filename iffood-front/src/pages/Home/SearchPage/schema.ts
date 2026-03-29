import z from "zod";

export const searchPageParamsSchema = z.object({
  q: z.string().optional(),
  type: z.enum(["stores", "products"]).optional(),
  category: z.string().optional(),
});
