export type AssetType = "IMAGE" | "VIDEO";

export interface Asset {
  id: string;
  userId: string;
  title: string;
  description?: string | null;
  publicId: string;
  resourceType: string;
  originalBytes: number;
  processedBytes?: number | null;
  duration?: number | null;
  format?: string | null;
  type: AssetType;
  createdAt: string;
  updatedAt: string;
}

export interface UsageSnapshot {
  plan: string;
  uploadsToday: number;
  freeTierLimit: number;
  lastResetAt: string | null;
  lastUploadAt: string | null;
}
