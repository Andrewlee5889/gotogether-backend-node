import { Request, Response } from "express";
import { prisma } from "../db";

export async function listUsers(_req: Request, res: Response) {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: { id: true, firebaseUid: true, email: true, displayName: true, photoUrl: true, createdAt: true },
    });
    res.json(users);
  } catch (err) {
    console.error("Failed to list users:", err);
    res.status(500).json({ error: "Failed to list users" });
  }
}

export async function getUser(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, firebaseUid: true, email: true, displayName: true, photoUrl: true, createdAt: true },
    });
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (err) {
    console.error("Failed to get user:", err);
    res.status(500).json({ error: "Failed to get user" });
  }
}

export async function createUser(req: Request, res: Response) {
  try {
    const { firebaseUid, email, displayName, photoUrl } = req.body;
    if (!firebaseUid) return res.status(400).json({ error: "firebaseUid required" });
    const user = await prisma.user.create({
      data: { firebaseUid, email, displayName, photoUrl },
      select: { id: true, firebaseUid: true, email: true, displayName: true, photoUrl: true, createdAt: true },
    });
    res.status(201).json(user);
  } catch (err) {
    console.error("Failed to create user:", err);
    res.status(500).json({ error: "Failed to create user" });
  }
}

export async function updateUser(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { email, displayName, photoUrl } = req.body;
    const user = await prisma.user.update({
      where: { id },
      data: { email, displayName, photoUrl },
      select: { id: true, firebaseUid: true, email: true, displayName: true, photoUrl: true, createdAt: true },
    });
    res.json(user);
  } catch (err) {
    console.error("Failed to update user:", err);
    res.status(500).json({ error: "Failed to update user" });
  }
}

export async function deleteUser(req: Request, res: Response) {
  try {
    const { id } = req.params;
    await prisma.user.delete({ where: { id } });
    res.status(204).send();
  } catch (err) {
    console.error("Failed to delete user:", err);
    res.status(500).json({ error: "Failed to delete user" });
  }
}

// Contacts
export async function listContacts(req: Request, res: Response) {
  try {
    const { id } = req.params; // userId
    const contacts = await prisma.contact.findMany({
      where: { userId: id },
      include: {
        contact: { select: { id: true, displayName: true, email: true, photoUrl: true } },
        category: { select: { id: true, name: true, color: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json(contacts);
  } catch (err) {
    console.error("Failed to list contacts:", err);
    res.status(500).json({ error: "Failed to list contacts" });
  }
}

export async function addContact(req: Request, res: Response) {
  try {
    const { id } = req.params; // userId
    const { contactId, categoryId, nickname } = req.body;
    if (!contactId) return res.status(400).json({ error: "contactId required" });
    const contact = await prisma.contact.create({
      data: { userId: id, contactId, categoryId, nickname },
      include: {
        contact: { select: { id: true, displayName: true, email: true, photoUrl: true } },
        category: { select: { id: true, name: true, color: true } },
      },
    });
    res.status(201).json(contact);
  } catch (err) {
    console.error("Failed to add contact:", err);
    res.status(500).json({ error: "Failed to add contact" });
  }
}

export async function removeContact(req: Request, res: Response) {
  try {
    const { id, contactId } = req.params; // userId, contactId
    await prisma.contact.delete({ where: { userId_contactId: { userId: id, contactId } } });
    res.status(204).send();
  } catch (err) {
    console.error("Failed to remove contact:", err);
    res.status(500).json({ error: "Failed to remove contact" });
  }
}

// Categories
export async function listCategories(req: Request, res: Response) {
  try {
    const { id } = req.params; // userId
    const categories = await prisma.contactCategory.findMany({ where: { userId: id }, orderBy: { name: "asc" } });
    res.json(categories);
  } catch (err) {
    console.error("Failed to list categories:", err);
    res.status(500).json({ error: "Failed to list categories" });
  }
}

export async function createCategory(req: Request, res: Response) {
  try {
    const { id } = req.params; // userId
    const { name, color } = req.body;
    if (!name) return res.status(400).json({ error: "name required" });
    const category = await prisma.contactCategory.create({ data: { userId: id, name, color } });
    res.status(201).json(category);
  } catch (err) {
    console.error("Failed to create category:", err);
    res.status(500).json({ error: "Failed to create category" });
  }
}

export async function updateCategory(req: Request, res: Response) {
  try {
    const { id, categoryId } = req.params; // userId, categoryId
    const { name, color } = req.body;
    const category = await prisma.contactCategory.update({ where: { id: categoryId }, data: { name, color } });
    res.json(category);
  } catch (err) {
    console.error("Failed to update category:", err);
    res.status(500).json({ error: "Failed to update category" });
  }
}

export async function deleteCategory(req: Request, res: Response) {
  try {
    const { id, categoryId } = req.params;
    await prisma.contactCategory.delete({ where: { id: categoryId } });
    res.status(204).send();
  } catch (err) {
    console.error("Failed to delete category:", err);
    res.status(500).json({ error: "Failed to delete category" });
  }
}
