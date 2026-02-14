import { Router, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { createCampaignSchema } from "../schemas/campaign.js";
import { AuthRequest } from "../types.js";

const router = Router();

// List campaigns user participates in
router.get("/", requireAuth, async (req: AuthRequest, res: Response) => {
  const campaigns = await prisma.campaign.findMany({
    where: {
      participants: { some: { userId: req.user!.id } },
    },
    orderBy: { createdAt: "desc" },
  });
  res.json(campaigns);
});

// Create campaign (admin only)
router.post(
  "/",
  requireAuth,
  requireAdmin,
  validate(createCampaignSchema),
  async (req: AuthRequest, res: Response) => {
    const campaign = await prisma.campaign.create({
      data: {
        ...req.body,
        createdBy: req.user!.id,
      },
    });
    res.status(201).json(campaign);
  }
);

// Get campaign details with user's remaining budget
router.get("/:id", requireAuth, async (req: AuthRequest, res: Response) => {
  const campaign = await prisma.campaign.findUnique({
    where: { id: req.params.id as string },
  });
  if (!campaign) {
    res.status(404).json({ error: "Campaign not found" });
    return;
  }

  // Check participation
  const participant = await prisma.campaignParticipant.findUnique({
    where: {
      campaignId_userId: {
        campaignId: campaign.id,
        userId: req.user!.id,
      },
    },
  });
  if (!participant && !req.user!.isAdmin) {
    res.status(403).json({ error: "Not a participant in this campaign" });
    return;
  }

  // Calculate remaining budget
  const totalGifted = await prisma.gift.aggregate({
    where: { campaignId: campaign.id, giverId: req.user!.id },
    _sum: { amount: true },
  });

  res.json({
    ...campaign,
    totalGifted: totalGifted._sum.amount || 0,
    remainingBudget: campaign.budgetPerUser - (totalGifted._sum.amount || 0),
  });
});

// Campaign status (admin only)
router.get(
  "/:id/status",
  requireAuth,
  requireAdmin,
  async (req: AuthRequest, res: Response) => {
    const campaign = await prisma.campaign.findUnique({
      where: { id: req.params.id as string },
      include: {
        participants: {
          include: { user: { select: { id: true, email: true, displayName: true } } },
        },
      },
    });
    if (!campaign) {
      res.status(404).json({ error: "Campaign not found" });
      return;
    }

    // Get gifting totals per user
    const giftsByUser = await prisma.gift.groupBy({
      by: ["giverId"],
      where: { campaignId: campaign.id },
      _sum: { amount: true },
      _count: true,
    });

    const giftMap = new Map(giftsByUser.map((g) => [g.giverId, g]));

    const participantStatus = campaign.participants.map((p) => {
      const gifts = giftMap.get(p.userId);
      return {
        user: p.user,
        totalGifted: gifts?._sum.amount || 0,
        giftCount: gifts?._count || 0,
        remainingBudget: campaign.budgetPerUser - (gifts?._sum.amount || 0),
      };
    });

    res.json({
      campaign: {
        id: campaign.id,
        title: campaign.title,
        budgetPerUser: campaign.budgetPerUser,
        openDate: campaign.openDate,
        closeDate: campaign.closeDate,
      },
      participantStatus,
    });
  }
);

export default router;
