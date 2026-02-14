import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import app from "../../index.js";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "change-me";

describe("Gift routes", () => {
  let userToken: string;
  let userId: string;
  let recipientId: string;
  let recipient2Id: string;
  let campaignId: string;

  beforeAll(async () => {
    await prisma.gift.deleteMany();
    await prisma.campaignParticipant.deleteMany();
    await prisma.campaign.deleteMany();
    await prisma.user.deleteMany();

    const user = await prisma.user.create({
      data: { email: "giver@test.com", displayName: "Giver" },
    });
    const recipient = await prisma.user.create({
      data: { email: "recipient@test.com", displayName: "Recipient" },
    });
    const recipient2 = await prisma.user.create({
      data: { email: "recipient2@test.com", displayName: "Recipient 2" },
    });
    userId = user.id;
    recipientId = recipient.id;
    recipient2Id = recipient2.id;

    const admin = await prisma.user.create({
      data: { email: "admin2@test.com", displayName: "Admin", isAdmin: true },
    });

    const campaign = await prisma.campaign.create({
      data: {
        title: "Test",
        budgetPerUser: 10000,
        openDate: new Date("2025-01-01"),
        closeDate: new Date("2027-12-31"),
        createdBy: admin.id,
      },
    });
    campaignId = campaign.id;

    await prisma.campaignParticipant.createMany({
      data: [
        { campaignId, userId: user.id },
        { campaignId, userId: recipient.id },
        { campaignId, userId: recipient2.id },
      ],
    });

    userToken = jwt.sign(
      { id: user.id, email: user.email, displayName: user.displayName, isAdmin: false },
      JWT_SECRET
    );
  });

  afterAll(async () => {
    await prisma.gift.deleteMany();
    await prisma.campaignParticipant.deleteMany();
    await prisma.campaign.deleteMany();
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  it("creates a gift", async () => {
    const res = await request(app)
      .post(`/api/v1/campaigns/${campaignId}/gifts`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ recipientId, amount: 2500, comment: "Great work!" });
    expect(res.status).toBe(201);
    expect(res.body.amount).toBe(2500);
  });

  it("rejects gift exceeding budget", async () => {
    const res = await request(app)
      .post(`/api/v1/campaigns/${campaignId}/gifts`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ recipientId: recipient2Id, amount: 99999, comment: "Too much" });
    expect(res.status).toBe(400);
  });

  it("lists gifts I've given", async () => {
    const res = await request(app)
      .get(`/api/v1/campaigns/${campaignId}/gifts`)
      .set("Authorization", `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it("lists received gifts anonymously", async () => {
    const recipientToken = jwt.sign(
      { id: recipientId, email: "recipient@test.com", displayName: "Recipient", isAdmin: false },
      JWT_SECRET
    );
    const res = await request(app)
      .get(`/api/v1/campaigns/${campaignId}/gifts/received`)
      .set("Authorization", `Bearer ${recipientToken}`);
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
    // Should not include giver info
    expect(res.body[0]).not.toHaveProperty("giverId");
    expect(res.body[0]).not.toHaveProperty("giver");
  });

  it("deletes a gift", async () => {
    const gifts = await request(app)
      .get(`/api/v1/campaigns/${campaignId}/gifts`)
      .set("Authorization", `Bearer ${userToken}`);
    const giftId = gifts.body[0].id;

    const res = await request(app)
      .delete(`/api/v1/campaigns/${campaignId}/gifts/${giftId}`)
      .set("Authorization", `Bearer ${userToken}`);
    expect(res.status).toBe(204);
  });
});
