import { Plan } from "@/prisma/generated/prisma";

export type PlanLimits = {
  dailyUploads: number;
  monthlyUploads: number;
  monthlyTransformations: number;
  priorityProcessing: boolean;
};

export const PLAN_LIMITS: Record<Plan, PlanLimits> = {
  FREE: {
    dailyUploads: 10,
    monthlyUploads: 300,
    monthlyTransformations: 300,
    priorityProcessing: false,
  },
  PRO: {
    dailyUploads: 250,
    monthlyUploads: 7500,
    monthlyTransformations: 7500,
    priorityProcessing: true,
  },
  BUSINESS: {
    dailyUploads: Number.MAX_SAFE_INTEGER,
    monthlyUploads: Number.MAX_SAFE_INTEGER,
    monthlyTransformations: Number.MAX_SAFE_INTEGER,
    priorityProcessing: true,
  },
};

export const PLAN_PRICES = {
  FREE: 0,
  PRO: 29,
  BUSINESS: 99,
} as const;

