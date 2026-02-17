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
  let adminId: string;

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
    adminId = admin.id;

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

  it("rejects self-gifting", async () => {
    const res = await request(app)
      .post(`/api/v1/campaigns/${campaignId}/gifts`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ recipientId: userId, amount: 500, comment: "Self gift" });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain("yourself");
  });

  it("rejects gifting in closed campaign", async () => {
    const closedCampaign = await prisma.campaign.create({
      data: {
        title: "Closed",
        budgetPerUser: 10000,
        openDate: new Date("2020-01-01"),
        closeDate: new Date("2020-12-31"),
        createdBy: adminId,
      },
    });
    await prisma.campaignParticipant.createMany({
      data: [
        { campaignId: closedCampaign.id, userId },
        { campaignId: closedCampaign.id, userId: recipientId },
      ],
    });

    const res = await request(app)
      .post(`/api/v1/campaigns/${closedCampaign.id}/gifts`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ recipientId, amount: 500, comment: "Late gift" });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain("not currently open");
  });

  it("rejects gifting by non-participant", async () => {
    const outsider = await prisma.user.create({
      data: { email: "outsider@test.com", displayName: "Outsider" },
    });
    const outsiderToken = jwt.sign(
      { id: outsider.id, email: outsider.email, displayName: outsider.displayName, isAdmin: false },
      JWT_SECRET
    );

    const res = await request(app)
      .post(`/api/v1/campaigns/${campaignId}/gifts`)
      .set("Authorization", `Bearer ${outsiderToken}`)
      .send({ recipientId, amount: 500, comment: "Outsider gift" });
    expect(res.status).toBe(403);
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

  // PUT gift endpoint tests (#10)
  it("updates a gift amount within budget", async () => {
    // Get the existing gift created in "creates a gift"
    const gifts = await request(app)
      .get(`/api/v1/campaigns/${campaignId}/gifts`)
      .set("Authorization", `Bearer ${userToken}`);
    const gift = gifts.body.find((g: any) => g.recipient.id === recipientId);

    const res = await request(app)
      .put(`/api/v1/campaigns/${campaignId}/gifts/${gift.id}`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ amount: 3000 });
    expect(res.status).toBe(200);
    expect(res.body.amount).toBe(3000);
  });

  it("updates a gift comment only", async () => {
    const gifts = await request(app)
      .get(`/api/v1/campaigns/${campaignId}/gifts`)
      .set("Authorization", `Bearer ${userToken}`);
    const gift = gifts.body.find((g: any) => g.recipient.id === recipientId);

    const res = await request(app)
      .put(`/api/v1/campaigns/${campaignId}/gifts/${gift.id}`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ comment: "Updated comment" });
    expect(res.status).toBe(200);
    expect(res.body.comment).toBe("Updated comment");
  });

  it("rejects update exceeding budget", async () => {
    const gifts = await request(app)
      .get(`/api/v1/campaigns/${campaignId}/gifts`)
      .set("Authorization", `Bearer ${userToken}`);
    const gift = gifts.body.find((g: any) => g.recipient.id === recipientId);

    const res = await request(app)
      .put(`/api/v1/campaigns/${campaignId}/gifts/${gift.id}`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ amount: 99999 });
    expect(res.status).toBe(400);
  });

  it("rejects update of another user's gift", async () => {
    const otherUser = await prisma.user.create({
      data: { email: "other@test.com", displayName: "Other" },
    });
    const otherToken = jwt.sign(
      { id: otherUser.id, email: otherUser.email, displayName: otherUser.displayName, isAdmin: false },
      JWT_SECRET
    );

    const gifts = await request(app)
      .get(`/api/v1/campaigns/${campaignId}/gifts`)
      .set("Authorization", `Bearer ${userToken}`);
    const gift = gifts.body[0];

    const res = await request(app)
      .put(`/api/v1/campaigns/${campaignId}/gifts/${gift.id}`)
      .set("Authorization", `Bearer ${otherToken}`)
      .send({ amount: 1000 });
    expect(res.status).toBe(403);
  });

  it("rejects update in closed campaign", async () => {
    const closedCampaign = await prisma.campaign.create({
      data: {
        title: "Closed for update test",
        budgetPerUser: 10000,
        openDate: new Date("2020-01-01"),
        closeDate: new Date("2020-12-31"),
        createdBy: adminId,
      },
    });

    // Create a gift directly in DB for the closed campaign
    const gift = await prisma.gift.create({
      data: {
        campaignId: closedCampaign.id,
        giverId: userId,
        recipientId,
        amount: 500,
        comment: "Old gift",
      },
    });

    const res = await request(app)
      .put(`/api/v1/campaigns/${closedCampaign.id}/gifts/${gift.id}`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ amount: 1000 });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain("not currently open");
  });

  // Self-contained delete test (#19)
  it("deletes a gift", async () => {
    // Create a gift specifically for this test
    const createRes = await request(app)
      .post(`/api/v1/campaigns/${campaignId}/gifts`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ recipientId: recipient2Id, amount: 500, comment: "To delete" });
    expect(createRes.status).toBe(201);
    const giftId = createRes.body.id;

    const res = await request(app)
      .delete(`/api/v1/campaigns/${campaignId}/gifts/${giftId}`)
      .set("Authorization", `Bearer ${userToken}`);
    expect(res.status).toBe(204);
  });
});