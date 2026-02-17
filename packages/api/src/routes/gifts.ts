import { Router, Response } from "express";
import { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { createGiftSchema, updateGiftSchema } from "../schemas/gift.js";
import { AuthRequest } from "../types.js";
import { BadRequestError, NotFoundError, ForbiddenError } from "../lib/errors.js";

type TxClient = Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">;

const router = Router({ mergeParams: true });

async function assertCampaignOpen(campaignId: string, client: TxClient = prisma) {
  const campaign = await client.campaign.findUnique({ where: { id: campaignId } });
  if (!campaign) throw new NotFoundError("Campaign not found");
  const now = new Date();
  if (now < campaign.openDate || now > campaign.closeDate) {
    throw new BadRequestError("Campaign is not currently open for gifting");
  }
  return campaign;
}

async function assertParticipant(campaignId: string, userId: string, client: TxClient = prisma) {
  const p = await client.campaignParticipant.findUnique({
    where: { campaignId_userId: { campaignId, userId } },
  });
  if (!p) throw new ForbiddenError("Not a participant in this campaign");
}

async function getRemainingBudget(campaignId: string, userId: string, client: TxClient = prisma, excludeGiftId?: string) {
  const campaign = await client.campaign.findUnique({ where: { id: campaignId } });
  if (!campaign) throw new NotFoundError("Campaign not found");

  const where: Record<string, unknown> = { campaignId, giverId: userId };
  if (excludeGiftId) where.id = { not: excludeGiftId };

  const total = await client.gift.aggregate({ where: where as any, _sum: { amount: true } });
  return campaign.budgetPerUser - (total._sum?.amount || 0);
}

// List gifts I've given in this campaign
router.get("/", requireAuth, async (req: AuthRequest, res: Response) => {
  const campaignId = req.params.id as string;
  const gifts = await prisma.gift.findMany({
    where: { campaignId, giverId: req.user!.id },
    include: {
      recipient: { select: { id: true, displayName: true, avatarUrl: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  res.json(gifts);
});

// List gifts I've received (anonymous — no giver info)
router.get("/received", requireAuth, async (req: AuthRequest, res: Response) => {
  const campaignId = req.params.id as string;
  const gifts = await prisma.gift.findMany({
    where: { campaignId, recipientId: req.user!.id },
    select: { id: true, amount: true, comment: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });
  res.json(gifts);
});

// Create a gift
router.post(
  "/",
  requireAuth,
  validate(createGiftSchema),
  async (req: AuthRequest, res: Response) => {
    const campaignId = req.params.id as string;
    const { recipientId, amount, comment } = req.body;
    const userId = req.user!.id;

    await assertCampaignOpen(campaignId);
    await assertParticipant(campaignId, userId);

    if (recipientId === userId) {
      throw new BadRequestError("Cannot gift to yourself");
    }

    await assertParticipant(campaignId, recipientId);

    const gift = await prisma.$transaction(async (tx) => {
      const remaining = await getRemainingBudget(campaignId, userId, tx);
      if (amount > remaining) {
        throw new BadRequestError(
          `Amount exceeds remaining budget. You have $${(remaining / 100).toFixed(2)} left.`
        );
      }

      return tx.gift.create({
        data: { campaignId, giverId: userId, recipientId, amount, comment },
        include: {
          recipient: { select: { id: true, displayName: true, avatarUrl: true } },
        },
      });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

    res.status(201).json(gift);
  }
);

// Update a gift
router.put(
  "/:giftId",
  requireAuth,
  validate(updateGiftSchema),
  async (req: AuthRequest, res: Response) => {
    const campaignId = req.params.id as string;
    const giftId = req.params.giftId as string;
    const userId = req.user!.id;
    const { amount, comment } = req.body;

    await assertCampaignOpen(campaignId);

    const existing = await prisma.gift.findUnique({ where: { id: giftId } });
    if (!existing) throw new NotFoundError("Gift not found");
    if (existing.giverId !== userId) throw new ForbiddenError("Not your gift");
    if (existing.campaignId !== campaignId) throw new NotFoundError("Gift not in this campaign");

    const gift = await prisma.$transaction(async (tx) => {
      if (amount !== undefined) {
        const remaining = await getRemainingBudget(campaignId, userId, tx, giftId);
        if (amount > remaining) {
          throw new BadRequestError(
            `Amount exceeds remaining budget. You have $${(remaining / 100).toFixed(2)} left.`
          );
        }
      }

      return tx.gift.update({
        where: { id: giftId },
        data: {
          ...(amount !== undefined && { amount }),
          ...(comment !== undefined && { comment }),
        },
        include: {
          recipient: { select: { id: true, displayName: true, avatarUrl: true } },
        },
      });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

    res.json(gift);
  }
);

// Delete a gift
router.delete("/:giftId", requireAuth, async (req: AuthRequest, res: Response) => {
  const campaignId = req.params.id as string;
  const giftId = req.params.giftId as string;
  const userId = req.user!.id;

  await assertCampaignOpen(campaignId);

  const existing = await prisma.gift.findUnique({ where: { id: giftId } });
  if (!existing) throw new NotFoundError("Gift not found");
  if (existing.giverId !== userId) throw new ForbiddenError("Not your gift");
  if (existing.campaignId !== campaignId) throw new NotFoundError("Gift not in this campaign");

  await prisma.gift.delete({ where: { id: giftId } });
  res.status(204).send();
});

export default router;