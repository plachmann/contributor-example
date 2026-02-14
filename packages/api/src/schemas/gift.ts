import { z } from "zod";

export const createGiftSchema = z.object({
  recipientId: z.string().uuid(),
  amount: z.number().int().positive(),
  comment: z.string().min(1).max(1000),
});

export const updateGiftSchema = z.object({
  amount: z.number().int().positive().optional(),
  comment: z.string().min(1).max(1000).optional(),
});
