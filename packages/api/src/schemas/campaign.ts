import { z } from "zod";

export const createCampaignSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  budgetPerUser: z.number().int().positive(),
  openDate: z.coerce.date(),
  closeDate: z.coerce.date(),
}).refine((data) => data.closeDate > data.openDate, {
  message: "Close date must be after open date",
  path: ["closeDate"],
});
