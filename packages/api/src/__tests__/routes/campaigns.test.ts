import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import app from "../../index.js";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "change-me";

describe("Campaign routes", () => {
  let adminToken: string;
  let userToken: string;

  beforeAll(async () => {
    await prisma.gift.deleteMany();
    await prisma.campaignParticipant.deleteMany();
    await prisma.campaign.deleteMany();
    await prisma.user.deleteMany();

    const admin = await prisma.user.create({
      data: { email: "admin@test.com", displayName: "Admin", isAdmin: true },
    });
    const user = await prisma.user.create({
      data: { email: "user@test.com", displayName: "User" },
    });

    adminToken = jwt.sign(
      { id: admin.id, email: admin.email, displayName: admin.displayName, isAdmin: true },
      JWT_SECRET
    );
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

  it("rejects campaign creation by non-admin", async () => {
    const res = await request(app)
      .post("/api/v1/campaigns")
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        title: "Test",
        budgetPerUser: 10000,
        openDate: "2025-01-01T00:00:00Z",
        closeDate: "2027-12-31T23:59:59Z",
      });
    expect(res.status).toBe(403);
  });

  it("allows admin to create a campaign", async () => {
    const res = await request(app)
      .post("/api/v1/campaigns")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        title: "Q4 Bonuses",
        budgetPerUser: 50000,
        openDate: "2025-01-01T00:00:00Z",
        closeDate: "2027-12-31T23:59:59Z",
      });
    expect(res.status).toBe(201);
    expect(res.body.title).toBe("Q4 Bonuses");
    expect(res.body.budgetPerUser).toBe(50000);
  });

  it("lists campaigns for authenticated users", async () => {
    const res = await request(app)
      .get("/api/v1/campaigns")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("rejects unauthenticated requests", async () => {
    const res = await request(app).get("/api/v1/campaigns");
    expect(res.status).toBe(401);
  });
});
