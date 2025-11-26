"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listContacts = listContacts;
exports.createContact = createContact;
exports.updateContact = updateContact;
exports.deleteContact = deleteContact;
exports.listContactCategories = listContactCategories;
exports.createContactCategory = createContactCategory;
exports.updateContactCategory = updateContactCategory;
exports.deleteContactCategory = deleteContactCategory;
const db_1 = require("../db");
// Contacts represent user-to-user relationships (with optional category assignment)
async function listContacts(req, res) {
    try {
        const { userId } = req.params;
        const contacts = await db_1.prisma.contact.findMany({
            where: { userId },
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
async function createContact(req, res) {
    try {
        const { userId } = req.params;
        const { contactId, categoryId, nickname } = req.body;
        if (!contactId)
            return res.status(400).json({ error: "contactId required" });
        const membership = await db_1.prisma.contact.create({
            data: { userId, contactId, categoryId, nickname },
            include: {
                contact: { select: { id: true, displayName: true, email: true, photoUrl: true } },
                category: { select: { id: true, name: true, color: true } },
            },
        });
        res.status(201).json(membership);
    }
    catch (err) {
        console.error("Failed to create contact:", err);
        if (typeof err === "object" && err && err.code === "P2002") {
            return res.status(409).json({ error: "Contact already exists" });
        }
        res.status(500).json({ error: "Failed to create contact" });
    }
}
async function updateContact(req, res) {
    try {
        const { userId, contactId } = req.params;
        const { categoryId, nickname } = req.body;
        const membership = await db_1.prisma.contact.update({
            where: { userId_contactId: { userId, contactId } },
            data: { categoryId, nickname },
            include: {
                contact: { select: { id: true, displayName: true, email: true, photoUrl: true } },
                category: { select: { id: true, name: true, color: true } },
            },
        });
        res.json(membership);
    }
    catch (err) {
        console.error("Failed to update contact:", err);
        res.status(500).json({ error: "Failed to update contact" });
    }
}
async function deleteContact(req, res) {
    try {
        const { userId, contactId } = req.params;
        await db_1.prisma.contact.delete({ where: { userId_contactId: { userId, contactId } } });
        res.status(204).send();
    }
    catch (err) {
        console.error("Failed to delete contact:", err);
        res.status(500).json({ error: "Failed to delete contact" });
    }
}
// Contact categories
async function listContactCategories(req, res) {
    try {
        const { userId } = req.params;
        const categories = await db_1.prisma.contactCategory.findMany({ where: { userId }, orderBy: { name: "asc" } });
        res.json(categories);
    }
    catch (err) {
        console.error("Failed to list categories:", err);
        res.status(500).json({ error: "Failed to list categories" });
    }
}
async function createContactCategory(req, res) {
    try {
        const { userId } = req.params;
        const { name, color } = req.body;
        if (!name)
            return res.status(400).json({ error: "name required" });
        const category = await db_1.prisma.contactCategory.create({ data: { userId, name, color } });
        res.status(201).json(category);
    }
    catch (err) {
        console.error("Failed to create category:", err);
        res.status(500).json({ error: "Failed to create category" });
    }
}
async function updateContactCategory(req, res) {
    try {
        const { userId, categoryId } = req.params;
        const { name, color } = req.body;
        const category = await db_1.prisma.contactCategory.update({ where: { id: categoryId }, data: { name, color } });
        res.json(category);
    }
    catch (err) {
        console.error("Failed to update category:", err);
        res.status(500).json({ error: "Failed to update category" });
    }
}
async function deleteContactCategory(req, res) {
    try {
        const { userId, categoryId } = req.params;
        await db_1.prisma.contactCategory.delete({ where: { id: categoryId } });
        res.status(204).send();
    }
    catch (err) {
        console.error("Failed to delete category:", err);
        res.status(500).json({ error: "Failed to delete category" });
    }
}
