import "express-async-errors";
import express, { type Express } from "express";
import cors from "cors";
import { errorHandler } from "./middleware/error-handler.js";
import authRoutes from "./routes/auth.js";
import campaignRoutes from "./routes/campaigns.js";
import participantRoutes from "./routes/participants.js";
import giftRoutes from "./routes/gifts.js";
import reportRoutes from "./routes/reports.js";

const app: Express = express();
const port = process.env.API_PORT || 3001;

app.use(cors({ origin: process.env.CORS_ORIGIN || "http://localhost:3000" }));
app.use(express.json());

app.get("/api/v1/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/campaigns", campaignRoutes);
app.use("/api/v1/campaigns/:id/participants", participantRoutes);
app.use("/api/v1/campaigns/:id/gifts", giftRoutes);
app.use("/api/v1/campaigns/:id/reports", reportRoutes);

// Error handler must be last
app.use(errorHandler);

app.listen(port, () => {
  console.log(`API running on http://localhost:${port}`);
});

export default app;
