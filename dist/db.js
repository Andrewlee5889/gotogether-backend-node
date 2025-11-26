"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const client_1 = require("@prisma/client");
// Prisma Client singleton
exports.prisma = new client_1.PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
});
// Graceful shutdown
process.on("beforeExit", async () => {
    await exports.prisma.$disconnect();
});
