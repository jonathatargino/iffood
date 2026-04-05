import z from "zod";
import { MAX_FLAVORS } from "./utils";

export const flavorSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Nome do sabor é obrigatório"),
  quantity: z.number().min(0, "Quantidade não pode ser negativa"),
  status: z.enum(["new", "updated", "deleted"]).optional(),
});

export const productFormSchema = z.object({
  name: z.string().min(1, "Nome do produto é obrigatório"),
  description: z
    .string()
    .min(10, "Descrição deve ter pelo menos 10 caracteres"),
  price: z.string().min(1, "Preço é obrigatório"),
  category: z.enum(["sweet", "savory"]),
  image: z.file().optional(),
  flavors: z
    .array(flavorSchema)
    .min(1, "Adicione pelo menos um sabor")
    .max(MAX_FLAVORS, `Máximo de ${MAX_FLAVORS} sabores`),
});

export type ProductFormData = z.infer<typeof productFormSchema>;
