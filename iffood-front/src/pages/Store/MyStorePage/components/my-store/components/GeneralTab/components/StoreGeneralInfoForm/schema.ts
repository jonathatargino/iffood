import z from "zod";

export const storeInfoSchema = z.object({
  name: z.string().min(1, "Nome da loja é obrigatório"),
  description: z.string().min(1, "Descrição é obrigatória"),
  whatsapp: z
    .string()
    .regex(
      /^\(\d{2}\) 9\d{4}-\d{4}$/,
      "WhatsApp deve ter 11 dígitos (DDD + número)",
    ),
});

export type StoreInfoFormData = z.infer<typeof storeInfoSchema>;
