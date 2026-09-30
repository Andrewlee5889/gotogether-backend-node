"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listHangouts = listHangouts;
exports.getHangout = getHangout;
exports.createHangout = createHangout;
exports.updateHangout = updateHangout;
exports.joinHangout = joinHangout;
exports.reviewJoinRequest = reviewJoinRequest;
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
                joinPolicy: true,
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
        const { userId, title, description, location, latitude, longitude, startsAt, endsAt, isPublic, joinPolicy } = req.body;
        if (!userId || !title || !startsAt)
            return res.status(400).json({ error: "userId, title, startsAt required" });
        const hangout = await db_1.prisma.hangout.create({
            data: { userId, title, description, location, latitude, longitude, startsAt: new Date(startsAt), endsAt: endsAt ? new Date(endsAt) : undefined, isPublic, joinPolicy },
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
        const { title, description, location, latitude, longitude, startsAt, endsAt, isPublic, joinPolicy } = req.body;
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
                joinPolicy,
            },
        });
        res.json(hangout);
    }
    catch (err) {
        console.error("Failed to update hangout:", err);
        res.status(500).json({ error: "Failed to update hangout" });
    }
}
async function joinHangout(req, res) {
    try {
        const { id } = req.params;
        const { userId } = req.body;
        if (!userId)
            return res.status(400).json({ error: "userId required" });
        const hangout = await db_1.prisma.hangout.findUnique({ where: { id } });
        if (!hangout)
            return res.status(404).json({ error: "Hangout not found" });
        if (hangout.userId === userId)
            return res.status(400).json({ error: "Hosts are already part of their hangout" });
        if (!hangout.isPublic)
            return res.status(403).json({ error: "This hangout is not public" });
        if (hangout.joinPolicy === "INVITE_ONLY")
            return res.status(403).json({ error: "This hangout is invite-only" });
        const participant = await db_1.prisma.hangoutParticipant.upsert({
            where: { hangoutId_userId: { hangoutId: id, userId } },
            update: { status: hangout.joinPolicy === "OPEN" ? "JOINED" : "PENDING" },
            create: { hangoutId: id, userId, status: hangout.joinPolicy === "OPEN" ? "JOINED" : "PENDING" },
        });
        res.status(participant.status === "JOINED" ? 201 : 202).json(participant);
    }
    catch (err) {
        console.error("Failed to join hangout:", err);
        res.status(500).json({ error: "Failed to join hangout" });
    }
}
async function reviewJoinRequest(req, res) {
    try {
        const { id, userId } = req.params;
        const { hostUserId, approved } = req.body;
        if (!hostUserId || typeof approved !== "boolean") {
            return res.status(400).json({ error: "hostUserId and approved are required" });
        }
        const hangout = await db_1.prisma.hangout.findUnique({ where: { id } });
        if (!hangout)
            return res.status(404).json({ error: "Hangout not found" });
        if (hangout.userId !== hostUserId)
            return res.status(403).json({ error: "Only the host can review join requests" });
        const participant = await db_1.prisma.hangoutParticipant.update({
            where: { hangoutId_userId: { hangoutId: id, userId } },
            data: { status: approved ? "JOINED" : "DECLINED" },
        });
        res.json(participant);
    }
    catch (err) {
        console.error("Failed to review join request:", err);
        res.status(500).json({ error: "Failed to review join request" });
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
