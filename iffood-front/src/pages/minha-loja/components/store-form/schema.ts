import { z } from "zod";

export const storeFormSchema = z.object({
  name: z.string().min(3, "O nome deve ter pelo menos 3 caracteres"),
  description: z
    .string()
    .min(10, "A descrição deve ter pelo menos 10 caracteres")
    .max(500, "A descrição deve ter no máximo 500 caracteres"),
  whatsapp: z.string().regex(/^\d{11}$/, "WhatsApp deve ter 11 dígitos"),
  photo: z
    .instanceof(File)
    .optional()
    .refine((val) => val !== undefined, "A foto é obrigatória"),
});

export type StoreFormData = z.infer<typeof storeFormSchema>;
