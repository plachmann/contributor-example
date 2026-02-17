import { z } from "zod";

export const createGiftSchema = z.object({
  recipientId: z.string().uuid(),
  amount: z.number().int().positive().max(10_000_000),
  comment: z.string().min(1).max(1000),
});

export const updateGiftSchema = z.object({
  amount: z.number().int().positive().max(10_000_000).optional(),
  comment: z.string().min(1).max(1000).optional(),
}).refine((data) => data.amount !== undefined || data.comment !== undefined, {
  message: "At least one field (amount or comment) must be provided",
});