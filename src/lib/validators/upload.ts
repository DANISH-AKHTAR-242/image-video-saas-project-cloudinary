import { z } from "zod";

export const uploadPayloadSchema = z.object({
  title: z.string().trim().min(1).max(120),
  description: z.string().max(500).optional(),
  originalSize: z.string().optional(),
});

export type UploadPayload = z.infer<typeof uploadPayloadSchema>;

export const mediaTransformSchema = z.object({
  publicId: z.string().min(1),
  resourceType: z.enum(["image", "video"]).default("image"),
  width: z.number().int().positive().max(5000).optional(),
  height: z.number().int().positive().max(5000).optional(),
  crop: z.enum(["fill", "fit", "thumb", "scale"]).optional(),
  quality: z.union([z.literal("auto"), z.number().min(1).max(100)]).optional(),
  format: z.string().min(2).max(10).optional(),
});
