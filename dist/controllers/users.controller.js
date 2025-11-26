"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listUsers = listUsers;
exports.getUser = getUser;
exports.createUser = createUser;
exports.updateUser = updateUser;
exports.deleteUser = deleteUser;
exports.listContacts = listContacts;
exports.addContact = addContact;
exports.removeContact = removeContact;
exports.listCategories = listCategories;
exports.createCategory = createCategory;
exports.updateCategory = updateCategory;
exports.deleteCategory = deleteCategory;
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
// Contacts
async function listContacts(req, res) {
    try {
        const { id } = req.params; // userId
        const contacts = await db_1.prisma.contact.findMany({
            where: { userId: id },
            include: {
                contact: { select: { id: true, displayName: true, email: true, photoUrl: true } },
                category: { select: { id: true, name: true, color: true } },
            },
            orderBy: { createdAt: "desc" },
        });
        res.json(contacts);
    }
    catch (err) {
        console.error("Failed to list contacts:", err);
        res.status(500).json({ error: "Failed to list contacts" });
    }
}
async function addContact(req, res) {
    try {
        const { id } = req.params; // userId
        const { contactId, categoryId, nickname } = req.body;
        if (!contactId)
            return res.status(400).json({ error: "contactId required" });
        const contact = await db_1.prisma.contact.create({
            data: { userId: id, contactId, categoryId, nickname },
            include: {
                contact: { select: { id: true, displayName: true, email: true, photoUrl: true } },
                category: { select: { id: true, name: true, color: true } },
            },
        });
        res.status(201).json(contact);
    }
    catch (err) {
        console.error("Failed to add contact:", err);
        res.status(500).json({ error: "Failed to add contact" });
    }
}
async function removeContact(req, res) {
    try {
        const { id, contactId } = req.params; // userId, contactId
        await db_1.prisma.contact.delete({ where: { userId_contactId: { userId: id, contactId } } });
        res.status(204).send();
    }
    catch (err) {
        console.error("Failed to remove contact:", err);
        res.status(500).json({ error: "Failed to remove contact" });
    }
}
// Categories
async function listCategories(req, res) {
    try {
        const { id } = req.params; // userId
        const categories = await db_1.prisma.contactCategory.findMany({ where: { userId: id }, orderBy: { name: "asc" } });
        res.json(categories);
    }
    catch (err) {
        console.error("Failed to list categories:", err);
        res.status(500).json({ error: "Failed to list categories" });
    }
}
async function createCategory(req, res) {
    try {
        const { id } = req.params; // userId
        const { name, color } = req.body;
        if (!name)
            return res.status(400).json({ error: "name required" });
        const category = await db_1.prisma.contactCategory.create({ data: { userId: id, name, color } });
        res.status(201).json(category);
    }
    catch (err) {
        console.error("Failed to create category:", err);
        res.status(500).json({ error: "Failed to create category" });
    }
}
async function updateCategory(req, res) {
    try {
        const { id, categoryId } = req.params; // userId, categoryId
        const { name, color } = req.body;
        const category = await db_1.prisma.contactCategory.update({ where: { id: categoryId }, data: { name, color } });
        res.json(category);
    }
    catch (err) {
        console.error("Failed to update category:", err);
        res.status(500).json({ error: "Failed to update category" });
    }
}
async function deleteCategory(req, res) {
    try {
        const { id, categoryId } = req.params;
        await db_1.prisma.contactCategory.delete({ where: { id: categoryId } });
        res.status(204).send();
    }
    catch (err) {
        console.error("Failed to delete category:", err);
        res.status(500).json({ error: "Failed to delete category" });
    }
}
