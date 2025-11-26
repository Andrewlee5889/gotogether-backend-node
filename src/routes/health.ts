import { Router } from "express";
import { prisma } from "../db";

const router = Router();

// Simple health endpoint
router.get("/health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT NOW()`;
    res.json({
      status: "ok",
      time: new Date().toISOString(),
    });
  } catch (err) {
    console.error("DB health check failed:", err);
    res.status(500).json({ status: "error" });
  }
});

export default router;
