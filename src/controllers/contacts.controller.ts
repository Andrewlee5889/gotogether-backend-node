import { Request, Response } from "express";
import { prisma } from "../db";

// Contacts represent user-to-user relationships (with optional category assignment)
export async function listContacts(req: Request, res: Response) {
  try {
    const { userId } = req.params;
    const contacts = await prisma.contact.findMany({
      where: { userId },
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

export async function createContact(req: Request, res: Response) {
  try {
    const { userId } = req.params;
    const { contactId, categoryId, nickname } = req.body;
    if (!contactId) return res.status(400).json({ error: "contactId required" });
    const membership = await prisma.contact.create({
      data: { userId, contactId, categoryId, nickname },
      include: {
        contact: { select: { id: true, displayName: true, email: true, photoUrl: true } },
        category: { select: { id: true, name: true, color: true } },
      },
    });
    res.status(201).json(membership);
  } catch (err) {
    console.error("Failed to create contact:", err);
    if (typeof err === "object" && err && (err as any).code === "P2002") {
      return res.status(409).json({ error: "Contact already exists" });
    }
    res.status(500).json({ error: "Failed to create contact" });
  }
}

export async function updateContact(req: Request, res: Response) {
  try {
    const { userId, contactId } = req.params;
    const { categoryId, nickname } = req.body;
    const membership = await prisma.contact.update({
      where: { userId_contactId: { userId, contactId } },
      data: { categoryId, nickname },
      include: {
        contact: { select: { id: true, displayName: true, email: true, photoUrl: true } },
        category: { select: { id: true, name: true, color: true } },
      },
    });
    res.json(membership);
  } catch (err) {
    console.error("Failed to update contact:", err);
    res.status(500).json({ error: "Failed to update contact" });
  }
}

export async function deleteContact(req: Request, res: Response) {
  try {
    const { userId, contactId } = req.params;
    await prisma.contact.delete({ where: { userId_contactId: { userId, contactId } } });
    res.status(204).send();
  } catch (err) {
    console.error("Failed to delete contact:", err);
    res.status(500).json({ error: "Failed to delete contact" });
  }
}

// Contact categories
export async function listContactCategories(req: Request, res: Response) {
  try {
    const { userId } = req.params;
    const categories = await prisma.contactCategory.findMany({ where: { userId }, orderBy: { name: "asc" } });
    res.json(categories);
  } catch (err) {
    console.error("Failed to list categories:", err);
    res.status(500).json({ error: "Failed to list categories" });
  }
}

export async function createContactCategory(req: Request, res: Response) {
  try {
    const { userId } = req.params;
    const { name, color } = req.body;
    if (!name) return res.status(400).json({ error: "name required" });
    const category = await prisma.contactCategory.create({ data: { userId, name, color } });
    res.status(201).json(category);
  } catch (err) {
    console.error("Failed to create category:", err);
    res.status(500).json({ error: "Failed to create category" });
  }
}

export async function updateContactCategory(req: Request, res: Response) {
  try {
    const { userId, categoryId } = req.params;
    const { name, color } = req.body;
    const category = await prisma.contactCategory.update({ where: { id: categoryId }, data: { name, color } });
    res.json(category);
  } catch (err) {
    console.error("Failed to update category:", err);
    res.status(500).json({ error: "Failed to update category" });
  }
}

export async function deleteContactCategory(req: Request, res: Response) {
  try {
    const { userId, categoryId } = req.params;
    await prisma.contactCategory.delete({ where: { id: categoryId } });
    res.status(204).send();
  } catch (err) {
    console.error("Failed to delete category:", err);
    res.status(500).json({ error: "Failed to delete category" });
  }
}