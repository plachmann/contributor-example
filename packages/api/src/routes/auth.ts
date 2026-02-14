import { Router, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { AuthRequest } from "../types.js";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "change-me";

// Google OAuth redirect
router.get("/login", (_req: Request, res: Response) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const callbackUrl = process.env.OAUTH_CALLBACK_URL;
  if (!clientId || !callbackUrl) {
    res.status(500).json({ error: "OAuth not configured" });
    return;
  }
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", callbackUrl);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid email profile");
  res.redirect(url.toString());
});

// OAuth callback
router.get("/callback", async (req: Request, res: Response) => {
  const { code } = req.query;
  if (!code) {
    res.status(400).json({ error: "Missing authorization code" });
    return;
  }

  try {
    // Exchange code for tokens
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: process.env.OAUTH_CALLBACK_URL,
        grant_type: "authorization_code",
      }),
    });
    const tokens = await tokenRes.json();

    // Get user info
    const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    const userInfo = await userInfoRes.json();

    // Find user in our DB (must be pre-imported by admin)
    const user = await prisma.user.findUnique({
      where: { email: userInfo.email },
    });
    if (!user) {
      res.status(403).json({ error: "User not registered. Contact your admin." });
      return;
    }

    // Update avatar if available
    if (userInfo.picture && userInfo.picture !== user.avatarUrl) {
      await prisma.user.update({
        where: { id: user.id },
        data: { avatarUrl: userInfo.picture },
      });
    }

    // Issue JWT
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        isAdmin: user.isAdmin,
      },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    // Redirect to frontend with token
    const frontendUrl = process.env.CORS_ORIGIN || "http://localhost:3000";
    res.redirect(`${frontendUrl}/auth/callback?token=${token}`);
  } catch (err) {
    console.error("OAuth callback error:", err);
    res.status(500).json({ error: "Authentication failed" });
  }
});

// Dev-only login (generates JWT for any user by email)
if (process.env.NODE_ENV !== "production") {
  router.post("/dev-login", async (req: Request, res: Response) => {
    const { email } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        isAdmin: user.isAdmin,
      },
      JWT_SECRET,
      { expiresIn: "24h" }
    );
    res.json({ token, user });
  });
}

// Get current user
router.get("/me", requireAuth, async (req: AuthRequest, res: Response) => {
  const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json(user);
});

export default router;
