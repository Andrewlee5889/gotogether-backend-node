"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listUsers = listUsers;
exports.getUser = getUser;
exports.createUser = createUser;
exports.updateUser = updateUser;
exports.deleteUser = deleteUser;
exports.getMe = getMe;
exports.syncUser = syncUser;
const db_1 = require("../db");
async function listUsers(_req, res) {
    try {
        const users = await db_1.prisma.user.findMany({
            orderBy: { createdAt: "desc" },
            select: { id: true, firebaseUid: true, email: true, displayName: true, photoUrl: true, createdAt: true },
        });
        res.json(users);
    }
    catch (err) {
        console.error("Failed to list users:", err);
        res.status(500).json({ error: "Failed to list users" });
    }
}
async function getUser(req, res) {
    try {
        const { id } = req.params;
        const user = await db_1.prisma.user.findUnique({
            where: { id },
            select: { id: true, firebaseUid: true, email: true, displayName: true, photoUrl: true, createdAt: true },
        });
        if (!user)
            return res.status(404).json({ error: "User not found" });
        res.json(user);
    }
    catch (err) {
        console.error("Failed to get user:", err);
        res.status(500).json({ error: "Failed to get user" });
    }
}
async function createUser(req, res) {
    try {
        const { firebaseUid, email, displayName, photoUrl } = req.body;
        if (!firebaseUid)
            return res.status(400).json({ error: "firebaseUid required" });
        const user = await db_1.prisma.user.create({
            data: { firebaseUid, email, displayName, photoUrl },
            select: { id: true, firebaseUid: true, email: true, displayName: true, photoUrl: true, createdAt: true },
        });
        res.status(201).json(user);
    }
    catch (err) {
        console.error("Failed to create user:", err);
        res.status(500).json({ error: "Failed to create user" });
    }
}
async function updateUser(req, res) {
    try {
        const { id } = req.params;
        const { email, displayName, photoUrl } = req.body;
        const user = await db_1.prisma.user.update({
            where: { id },
            data: { email, displayName, photoUrl },
            select: { id: true, firebaseUid: true, email: true, displayName: true, photoUrl: true, createdAt: true },
        });
        res.json(user);
    }
    catch (err) {
        console.error("Failed to update user:", err);
        res.status(500).json({ error: "Failed to update user" });
    }
}
async function deleteUser(req, res) {
    try {
        const { id } = req.params;
        await db_1.prisma.user.delete({ where: { id } });
        res.status(204).send();
    }
    catch (err) {
        console.error("Failed to delete user:", err);
        res.status(500).json({ error: "Failed to delete user" });
    }
}
// Auth: get current user (from Firebase token)
async function getMe(req, res) {
    try {
        const authUser = req.authUser;
        if (!authUser)
            return res.status(401).json({ error: "Unauthorized" });
        const user = await db_1.prisma.user.findUnique({ where: { firebaseUid: authUser.uid } });
        if (!user)
            return res.status(404).json({ error: "User not found" });
        res.json(user);
    }
    catch (err) {
        console.error("Failed to get me:", err);
        res.status(500).json({ error: "Failed to get current user" });
    }
}
// Auth: sync (upsert) user from Firebase token
async function syncUser(req, res) {
    try {
        const authUser = req.authUser;
        if (!authUser)
            return res.status(401).json({ error: "Unauthorized" });
        const user = await db_1.prisma.user.upsert({
            where: { firebaseUid: authUser.uid },
            create: {
                firebaseUid: authUser.uid,
                email: authUser.email ?? null,
                displayName: authUser.name ?? null,
                photoUrl: authUser.picture ?? null,
            },
            update: {
                email: authUser.email ?? null,
                displayName: authUser.name ?? null,
                photoUrl: authUser.picture ?? null,
            },
        });
        res.status(200).json(user);
    }
    catch (err) {
        console.error("Failed to sync user:", err);
        res.status(500).json({ error: "Failed to sync user" });
    }
}
