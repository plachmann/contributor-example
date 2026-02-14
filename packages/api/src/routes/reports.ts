import { Router, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import { AuthRequest } from "../types.js";

const router = Router({ mergeParams: true });

router.get("/summary", requireAuth, requireAdmin, async (req: AuthRequest, res: Response) => {
  const campaignId = req.params.id as string;

  const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });
  if (!campaign) {
    res.status(404).json({ error: "Campaign not found" });
    return;
  }

  const totalParticipants = await prisma.campaignParticipant.count({
    where: { campaignId },
  });

  const participantsWhoGifted = await prisma.gift.groupBy({
    by: ["giverId"],
    where: { campaignId },
  });

  const giftStats = await prisma.gift.aggregate({
    where: { campaignId },
    _sum: { amount: true },
    _avg: { amount: true },
    _count: true,
  });

  res.json({
    totalParticipants,
    participantsWhoGifted: participantsWhoGifted.length,
    participationRate:
      totalParticipants > 0 ? participantsWhoGifted.length / totalParticipants : 0,
    totalAmountGifted: giftStats._sum?.amount || 0,
    averageGiftAmount: Math.round(giftStats._avg?.amount || 0),
    totalGiftsCount: giftStats._count,
  });
});

export default router;
