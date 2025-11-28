"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listContacts = listContacts;
exports.getContact = getContact;
exports.createContact = createContact;
exports.updateContact = updateContact;
exports.deleteContact = deleteContact;
exports.listContactCategories = listContactCategories;
exports.createContactCategory = createContactCategory;
exports.updateContactCategory = updateContactCategory;
exports.deleteContactCategory = deleteContactCategory;
exports.listPendingRequests = listPendingRequests;
exports.acceptContact = acceptContact;
exports.rejectContact = rejectContact;
const db_1 = require("../db");
function toContactDTO(item) {
    return {
        id: item.contact?.id ?? item.contactId,
        displayName: item.contact?.displayName ?? null,
        email: item.contact?.email ?? null,
        photoUrl: item.contact?.photoUrl ?? null,
        category: item.category
            ? { id: item.category.id, name: item.category.name, color: item.category.color ?? null }
            : null,
        createdAt: item.createdAt,
    };
}
// Contacts represent user-to-user relationships (with optional category assignment)
async function listContacts(req, res) {
    try {
        const { userId } = req.params;
        const contacts = await db_1.prisma.contact.findMany({
            where: { userId, status: "ACCEPTED" },
            include: {
                User_Contact_contactIdToUser: { select: { id: true, displayName: true, email: true, photoUrl: true } },
                ContactCategory: { select: { id: true, name: true, color: true } },
            },
            orderBy: { createdAt: "desc" },
        });
        res.json(contacts.map((item) => toContactDTO({
            contactId: item.contactId,
            createdAt: item.createdAt,
            contact: item.User_Contact_contactIdToUser,
            category: item.ContactCategory,
        })));
    }
    catch (err) {
        console.error("Failed to list contacts:", err);
        res.status(500).json({ error: "Failed to list contacts" });
    }
}
async function getContact(req, res) {
    try {
        const { userId, contactId } = req.params;
        const item = await db_1.prisma.contact.findUnique({
            where: { userId_contactId: { userId, contactId } },
            include: {
                User_Contact_contactIdToUser: { select: { id: true, displayName: true, email: true, photoUrl: true } },
                ContactCategory: { select: { id: true, name: true, color: true } },
            },
        });
        if (!item)
            return res.status(404).json({ error: "Contact not found" });
        res.json(toContactDTO({
            contactId: item.contactId,
            createdAt: item.createdAt,
            contact: item.User_Contact_contactIdToUser,
            category: item.ContactCategory,
        }));
    }
    catch (err) {
        console.error("Failed to get contact:", err);
        res.status(500).json({ error: "Failed to get contact" });
    }
}
async function createContact(req, res) {
    try {
        const { userId } = req.params;
        const { contactId, categoryId } = req.body;
        if (!contactId)
            return res.status(400).json({ error: "contactId required" });
        if (contactId === userId)
            return res.status(400).json({ error: "Cannot add yourself as a contact" });
        // Create pending contact request (only initiator side)
        const item = await db_1.prisma.contact.create({
            data: { userId, contactId, categoryId, status: "PENDING" },
            include: {
                User_Contact_contactIdToUser: { select: { id: true, displayName: true, email: true, photoUrl: true } },
                ContactCategory: { select: { id: true, name: true, color: true } },
            },
        });
        res.status(201).json(toContactDTO({
            contactId: item.contactId,
            createdAt: item.createdAt,
            contact: item.User_Contact_contactIdToUser,
            category: item.ContactCategory,
        }));
    }
    catch (err) {
        console.error("Failed to create contact:", err);
        if (typeof err === "object" && err && err.code === "P2002") {
            return res.status(409).json({ error: "Contact request already sent" });
        }
        res.status(500).json({ error: "Failed to create contact" });
    }
}
async function updateContact(req, res) {
    try {
        const { userId, contactId } = req.params;
        const { categoryId } = req.body;
        const item = await db_1.prisma.contact.update({
            where: { userId_contactId: { userId, contactId } },
            data: { categoryId },
            include: {
                User_Contact_contactIdToUser: { select: { id: true, displayName: true, email: true, photoUrl: true } },
                ContactCategory: { select: { id: true, name: true, color: true } },
            },
        });
        res.json(toContactDTO({
            contactId: item.contactId,
            createdAt: item.createdAt,
            contact: item.User_Contact_contactIdToUser,
            category: item.ContactCategory,
        }));
    }
    catch (err) {
        console.error("Failed to update contact:", err);
        res.status(500).json({ error: "Failed to update contact" });
    }
}
async function deleteContact(req, res) {
    try {
        const { userId, contactId } = req.params;
        // Hard delete both directions to maintain symmetric friendship removal
        await db_1.prisma.$transaction([
            db_1.prisma.contact.deleteMany({ where: { userId, contactId } }),
            db_1.prisma.contact.deleteMany({ where: { userId: contactId, contactId: userId } }),
        ]);
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
// Contact request approval flow
async function listPendingRequests(req, res) {
    try {
        const { userId } = req.params;
        // Find pending requests where I am the contactId (incoming requests)
        const requests = await db_1.prisma.contact.findMany({
            where: { contactId: userId, status: "PENDING" },
            include: {
                User_Contact_userIdToUser: { select: { id: true, displayName: true, email: true, photoUrl: true } },
            },
            orderBy: { createdAt: "desc" },
        });
        res.json(requests.map((r) => ({
            id: r.User_Contact_userIdToUser.id,
            displayName: r.User_Contact_userIdToUser.displayName,
            email: r.User_Contact_userIdToUser.email,
            photoUrl: r.User_Contact_userIdToUser.photoUrl,
            createdAt: r.createdAt,
        })));
    }
    catch (err) {
        console.error("Failed to list pending requests:", err);
        res.status(500).json({ error: "Failed to list pending requests" });
    }
}
async function acceptContact(req, res) {
    try {
        const { userId, contactId } = req.params;
        // Find pending request where contactId sent request to userId
        const request = await db_1.prisma.contact.findUnique({
            where: { userId_contactId: { userId: contactId, contactId: userId } },
        });
        if (!request)
            return res.status(404).json({ error: "Contact request not found" });
        if (request.status === "ACCEPTED")
            return res.status(400).json({ error: "Already accepted" });
        // Accept: update request to ACCEPTED and create reciprocal ACCEPTED edge
        await db_1.prisma.$transaction([
            db_1.prisma.contact.update({
                where: { userId_contactId: { userId: contactId, contactId: userId } },
                data: { status: "ACCEPTED" },
            }),
            db_1.prisma.contact.create({
                data: { userId, contactId, status: "ACCEPTED" },
            }),
        ]);
        res.json({ message: "Contact request accepted" });
    }
    catch (err) {
        console.error("Failed to accept contact:", err);
        res.status(500).json({ error: "Failed to accept contact" });
    }
}
async function rejectContact(req, res) {
    try {
        const { userId, contactId } = req.params;
        // Delete the pending request
        await db_1.prisma.contact.delete({
            where: { userId_contactId: { userId: contactId, contactId: userId } },
        });
        res.status(204).send();
    }
    catch (err) {
        console.error("Failed to reject contact:", err);
        res.status(500).json({ error: "Failed to reject contact" });
    }
}
