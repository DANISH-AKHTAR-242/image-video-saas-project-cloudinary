import { z } from "zod";

export const uploadPayloadSchema = z.object({
  title: z.string().min(1).max(120),
  description: z.string().max(500).optional(),
  originalSize: z.string().optional(),
});

export type UploadPayload = z.infer<typeof uploadPayloadSchema>;
