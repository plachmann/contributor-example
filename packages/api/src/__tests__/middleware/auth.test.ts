import { describe, it, expect, vi } from "vitest";
import jwt from "jsonwebtoken";
import { requireAuth, requireAdmin } from "../../middleware/auth.js";

const JWT_SECRET = process.env.JWT_SECRET || "change-me";

function mockReqResNext() {
  const req: any = { headers: {} };
  const res: any = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };
  const next = vi.fn();
  return { req, res, next };
}

describe("requireAuth", () => {
  it("rejects requests without Authorization header", () => {
    const { req, res, next } = mockReqResNext();
    requireAuth(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("rejects invalid tokens", () => {
    const { req, res, next } = mockReqResNext();
    req.headers.authorization = "Bearer invalid-token";
    requireAuth(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("attaches user to request for valid tokens", () => {
    const { req, res, next } = mockReqResNext();
    const payload = {
      id: "user-1",
      email: "test@example.com",
      displayName: "Test User",
      isAdmin: false,
    };
    const token = jwt.sign(payload, JWT_SECRET);
    req.headers.authorization = `Bearer ${token}`;
    requireAuth(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(req.user).toMatchObject(payload);
  });
});

describe("requireAdmin", () => {
  it("rejects non-admin users", () => {
    const { req, res, next } = mockReqResNext();
    req.user = {
      id: "user-1",
      email: "test@example.com",
      displayName: "Test",
      isAdmin: false,
    };
    requireAdmin(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it("allows admin users", () => {
    const { req, res, next } = mockReqResNext();
    req.user = {
      id: "user-1",
      email: "admin@example.com",
      displayName: "Admin",
      isAdmin: true,
    };
    requireAdmin(req, res, next);
    expect(next).toHaveBeenCalled();
  });
});
