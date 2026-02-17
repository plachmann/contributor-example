import { Router, Response } from "express";
import multer from "multer";
import { parse } from "csv-parse/sync";
import { prisma } from "../lib/prisma.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import { AuthRequest } from "../types.js";

const router = Router({ mergeParams: true });
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 1024 * 1024 } });

// List participants (for coworker picker — excludes current user)
router.get("/", requireAuth, async (req: AuthRequest, res: Response) => {
  const campaignId = req.params.id as string;
  const participants = await prisma.campaignParticipant.findMany({
    where: {
      campaignId,
      userId: { not: req.user!.id },
    },
    include: {
      user: {
        select: { id: true, email: true, displayName: true, avatarUrl: true },
      },
    },
  });
  res.json(participants.map((p) => p.user));
});

// Import participants via CSV (admin only)
router.post(
  "/import",
  requireAuth,
  requireAdmin,
  upload.single("file"),
  async (req: AuthRequest, res: Response) => {
    if (!req.file) {
      res.status(400).json({ error: "No CSV file uploaded" });
      return;
    }

    const campaignId = req.params.id as string;
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
    });
    if (!campaign) {
      res.status(404).json({ error: "Campaign not found" });
      return;
    }

    const records = parse(req.file.buffer.toString(), {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    }) as Array<{ email: string; display_name: string }>;

    let created = 0;
    let added = 0;
    const errors: string[] = [];

    for (const record of records) {
      if (!record.email) {
        errors.push(`Row missing email: ${JSON.stringify(record)}`);
        continue;
      }

      // Upsert user
      const user = await prisma.user.upsert({
        where: { email: record.email },
        update: { displayName: record.display_name || record.email },
        create: {
          email: record.email,
          displayName: record.display_name || record.email,
        },
      });
      created++;

      // Add as participant (skip if already exists)
      try {
        await prisma.campaignParticipant.create({
          data: { campaignId: campaign.id, userId: user.id },
        });
        added++;
      } catch {
        // Already a participant — skip
      }
    }

    res.json({
      usersProcessed: created,
      participantsAdded: added,
      errors,
    });
  }
);

export default router;
