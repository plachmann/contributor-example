import express, { type Express } from "express";
import cors from "cors";
import { errorHandler } from "./middleware/error-handler.js";

const app: Express = express();
const port = process.env.API_PORT || 3001;

app.use(cors({ origin: process.env.CORS_ORIGIN || "http://localhost:3000" }));
app.use(express.json());

app.get("/api/v1/health", (_req, res) => {
  res.json({ status: "ok" });
});

// Error handler must be last
app.use(errorHandler);

app.listen(port, () => {
  console.log(`API running on http://localhost:${port}`);
});

export default app;
