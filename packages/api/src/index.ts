import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });
import "express-async-errors";
import express, { type Express } from "express";
import cors from "cors";
import { errorHandler } from "./middleware/error-handler.js";
import authRoutes from "./routes/auth.js";
import campaignRoutes from "./routes/campaigns.js";
import participantRoutes from "./routes/participants.js";
import giftRoutes from "./routes/gifts.js";
import reportRoutes from "./routes/reports.js";
import { prisma } from "./lib/prisma.js";

const app: Express = express();
const port = process.env.API_PORT || 3001;

app.use(cors({ origin: process.env.CORS_ORIGIN || "http://localhost:3000" }));
app.use(express.json());

app.get("/api/v1/health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "ok" });
  } catch {
    res.status(503).json({ status: "error", message: "Database unavailable" });
  }
});

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/campaigns", campaignRoutes);
app.use("/api/v1/campaigns/:id/participants", participantRoutes);
app.use("/api/v1/campaigns/:id/gifts", giftRoutes);
app.use("/api/v1/campaigns/:id/reports", reportRoutes);

// Error handler must be last
app.use(errorHandler);

if (process.env.NODE_ENV !== "test") {
  app.listen(port, () => {
    console.log(`API running on http://localhost:${port}`);
  });
}

export default app;
