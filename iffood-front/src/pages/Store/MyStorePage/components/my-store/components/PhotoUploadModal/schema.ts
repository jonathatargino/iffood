import z from "zod";

export const uploadPhotoSchema = z.object({
  image: z.file(),
});

export type UploadPhotoData = z.infer<typeof uploadPhotoSchema>;
