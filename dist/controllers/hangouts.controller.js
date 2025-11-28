"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listHangouts = listHangouts;
exports.getHangout = getHangout;
exports.createHangout = createHangout;
exports.updateHangout = updateHangout;
exports.deleteHangout = deleteHangout;
exports.listVisibility = listVisibility;
exports.addVisibility = addVisibility;
exports.removeVisibility = removeVisibility;
const db_1 = require("../db");
async function listHangouts(req, res) {
    try {
        const { userId, title, isPublic, startsAtFrom, startsAtTo, endsAtFrom, endsAtTo, latMin, latMax, lngMin, lngMax, orderBy = "startsAt", orderDir = "asc", page = "1", limit = "25", interestId, } = req.query;
        const where = {};
        if (userId)
            where.userId = userId;
        if (title)
            where.title = { contains: title, mode: "insensitive" };
        if (typeof isPublic !== "undefined")
            where.isPublic = isPublic === "true";
        if (startsAtFrom || startsAtTo)
            where.startsAt = {
                ...(startsAtFrom ? { gte: new Date(startsAtFrom) } : {}),
                ...(startsAtTo ? { lte: new Date(startsAtTo) } : {}),
            };
        if (endsAtFrom || endsAtTo)
            where.endsAt = {
                ...(endsAtFrom ? { gte: new Date(endsAtFrom) } : {}),
                ...(endsAtTo ? { lte: new Date(endsAtTo) } : {}),
            };
        if (latMin || latMax)
            where.latitude = {
                ...(latMin ? { gte: parseFloat(latMin) } : {}),
                ...(latMax ? { lte: parseFloat(latMax) } : {}),
            };
        if (lngMin || lngMax)
            where.longitude = {
                ...(lngMin ? { gte: parseFloat(lngMin) } : {}),
                ...(lngMax ? { lte: parseFloat(lngMax) } : {}),
            };
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const take = parseInt(limit);
        // Relational interest filter (by interestId only; slug removed)
        if (interestId) {
            where.User = { UserInterest: { some: { interestId } } };
        }
        const hangouts = await db_1.prisma.hangout.findMany({
            where,
            orderBy: { [orderBy]: orderDir === "desc" ? "desc" : "asc" },
            skip,
            take,
            select: {
                id: true,
                userId: true,
                title: true,
                description: true,
                location: true,
                latitude: true,
                longitude: true,
                startsAt: true,
                endsAt: true,
                isPublic: true,
                createdAt: true,
            },
        });
        res.json(hangouts);
    }
    catch (err) {
        console.error("Failed to list hangouts:", err);
        res.status(500).json({ error: "Failed to list hangouts" });
    }
}
async function getHangout(req, res) {
    try {
        const { id } = req.params;
        const hangout = await db_1.prisma.hangout.findUnique({
            where: { id },
            include: { HangoutVisibility: true },
        });
        if (!hangout)
            return res.status(404).json({ error: "Hangout not found" });
        res.json(hangout);
    }
    catch (err) {
        console.error("Failed to get hangout:", err);
        res.status(500).json({ error: "Failed to get hangout" });
    }
}
async function createHangout(req, res) {
    try {
        const { userId, title, description, location, latitude, longitude, startsAt, endsAt, isPublic } = req.body;
        if (!userId || !title || !startsAt)
            return res.status(400).json({ error: "userId, title, startsAt required" });
        const hangout = await db_1.prisma.hangout.create({
            data: { userId, title, description, location, latitude, longitude, startsAt: new Date(startsAt), endsAt: endsAt ? new Date(endsAt) : undefined, isPublic },
        });
        res.status(201).json(hangout);
    }
    catch (err) {
        console.error("Failed to create hangout:", err);
        res.status(500).json({ error: "Failed to create hangout" });
    }
}
async function updateHangout(req, res) {
    try {
        const { id } = req.params;
        const { title, description, location, latitude, longitude, startsAt, endsAt, isPublic } = req.body;
        const hangout = await db_1.prisma.hangout.update({
            where: { id },
            data: {
                title,
                description,
                location,
                latitude,
                longitude,
                startsAt: startsAt ? new Date(startsAt) : undefined,
                endsAt: endsAt ? new Date(endsAt) : undefined,
                isPublic,
            },
        });
        res.json(hangout);
    }
    catch (err) {
        console.error("Failed to update hangout:", err);
        res.status(500).json({ error: "Failed to update hangout" });
    }
}
async function deleteHangout(req, res) {
    try {
        const { id } = req.params;
        await db_1.prisma.hangout.delete({ where: { id } });
        res.status(204).send();
    }
    catch (err) {
        console.error("Failed to delete hangout:", err);
        res.status(500).json({ error: "Failed to delete hangout" });
    }
}
// Visibility controls
async function listVisibility(req, res) {
    try {
        const { id } = req.params; // hangoutId
        const vis = await db_1.prisma.hangoutVisibility.findMany({ where: { hangoutId: id }, orderBy: { createdAt: "desc" } });
        res.json(vis);
    }
    catch (err) {
        console.error("Failed to list visibility:", err);
        res.status(500).json({ error: "Failed to list visibility" });
    }
}
async function addVisibility(req, res) {
    try {
        const { id } = req.params; // hangoutId
        const { categoryId, userId } = req.body;
        if (!categoryId && !userId)
            return res.status(400).json({ error: "Provide categoryId or userId" });
        const vis = await db_1.prisma.hangoutVisibility.create({ data: { hangoutId: id, categoryId, userId } });
        res.status(201).json(vis);
    }
    catch (err) {
        console.error("Failed to add visibility:", err);
        res.status(500).json({ error: "Failed to add visibility" });
    }
}
async function removeVisibility(req, res) {
    try {
        const { id, visibilityId } = req.params;
        await db_1.prisma.hangoutVisibility.delete({ where: { id: visibilityId } });
        res.status(204).send();
    }
    catch (err) {
        console.error("Failed to remove visibility:", err);
        res.status(500).json({ error: "Failed to remove visibility" });
    }
}
