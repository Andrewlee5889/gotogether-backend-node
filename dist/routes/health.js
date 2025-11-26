"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = require("../db");
const router = (0, express_1.Router)();
// Simple health endpoint
router.get("/health", async (_req, res) => {
    try {
        await db_1.prisma.$queryRaw `SELECT NOW()`;
        res.json({
            status: "ok",
            time: new Date().toISOString(),
        });
    }
    catch (err) {
        console.error("DB health check failed:", err);
        res.status(500).json({ status: "error" });
    }
});
exports.default = router;
