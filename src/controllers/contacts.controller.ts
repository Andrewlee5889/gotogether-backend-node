import { Request, Response } from "express";
import { prisma } from "../db";

function toContactDTO(item: any) {
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
export async function listContacts(req: Request, res: Response) {
  try {
    const { userId } = req.params;
    const contacts = await prisma.contact.findMany({
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
  } catch (err) {
    console.error("Failed to list contacts:", err);
    res.status(500).json({ error: "Failed to list contacts" });
  }
}

export async function getContact(req: Request, res: Response) {
  try {
    const { userId, contactId } = req.params;
    const item = await prisma.contact.findUnique({
      where: { userId_contactId: { userId, contactId } },
      include: {
        User_Contact_contactIdToUser: { select: { id: true, displayName: true, email: true, photoUrl: true } },
        ContactCategory: { select: { id: true, name: true, color: true } },
      },
    });
    if (!item) return res.status(404).json({ error: "Contact not found" });
    res.json(toContactDTO({
      contactId: item.contactId,
      createdAt: item.createdAt,
      contact: item.User_Contact_contactIdToUser,
      category: item.ContactCategory,
    }));
  } catch (err) {
    console.error("Failed to get contact:", err);
    res.status(500).json({ error: "Failed to get contact" });
  }
}

export async function createContact(req: Request, res: Response) {
  try {
    const { userId } = req.params;
    const { contactId, categoryId } = req.body;
    if (!contactId) return res.status(400).json({ error: "contactId required" });
    if (contactId === userId) return res.status(400).json({ error: "Cannot add yourself as a contact" });

    // Create pending contact request (only initiator side)
    const item = await prisma.contact.create({
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
  } catch (err) {
    console.error("Failed to create contact:", err);
    if (typeof err === "object" && err && (err as any).code === "P2002") {
      return res.status(409).json({ error: "Contact request already sent" });
    }
    res.status(500).json({ error: "Failed to create contact" });
  }
}

export async function updateContact(req: Request, res: Response) {
  try {
    const { userId, contactId } = req.params;
    const { categoryId } = req.body;
    const item = await prisma.contact.update({
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
  } catch (err) {
    console.error("Failed to update contact:", err);
    res.status(500).json({ error: "Failed to update contact" });
  }
}

export async function deleteContact(req: Request, res: Response) {
  try {
    const { userId, contactId } = req.params;
    // Hard delete both directions to maintain symmetric friendship removal
    await prisma.$transaction([
      prisma.contact.deleteMany({ where: { userId, contactId } }),
      prisma.contact.deleteMany({ where: { userId: contactId, contactId: userId } }),
    ]);
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

// Contact request approval flow
export async function listPendingRequests(req: Request, res: Response) {
  try {
    const { userId } = req.params;
    // Find pending requests where I am the contactId (incoming requests)
    const requests = await prisma.contact.findMany({
      where: { contactId: userId, status: "PENDING" },
      include: {
        User_Contact_userIdToUser: { select: { id: true, displayName: true, email: true, photoUrl: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json(requests.map((r: any) => ({
      id: r.User_Contact_userIdToUser.id,
      displayName: r.User_Contact_userIdToUser.displayName,
      email: r.User_Contact_userIdToUser.email,
      photoUrl: r.User_Contact_userIdToUser.photoUrl,
      createdAt: r.createdAt,
    })));
  } catch (err) {
    console.error("Failed to list pending requests:", err);
    res.status(500).json({ error: "Failed to list pending requests" });
  }
}

export async function acceptContact(req: Request, res: Response) {
  try {
    const { userId, contactId } = req.params;
    // Find pending request where contactId sent request to userId
    const request = await prisma.contact.findUnique({
      where: { userId_contactId: { userId: contactId, contactId: userId } },
    });
    if (!request) return res.status(404).json({ error: "Contact request not found" });
    if (request.status === "ACCEPTED") return res.status(400).json({ error: "Already accepted" });

    // Accept: update request to ACCEPTED and create reciprocal ACCEPTED edge
    await prisma.$transaction([
      prisma.contact.update({
        where: { userId_contactId: { userId: contactId, contactId: userId } },
        data: { status: "ACCEPTED" },
      }),
      prisma.contact.create({
        data: { userId, contactId, status: "ACCEPTED" },
      }),
    ]);
    res.json({ message: "Contact request accepted" });
  } catch (err) {
    console.error("Failed to accept contact:", err);
    res.status(500).json({ error: "Failed to accept contact" });
  }
}

export async function rejectContact(req: Request, res: Response) {
  try {
    const { userId, contactId } = req.params;
    // Delete the pending request
    await prisma.contact.delete({
      where: { userId_contactId: { userId: contactId, contactId: userId } },
    });
    res.status(204).send();
  } catch (err) {
    console.error("Failed to reject contact:", err);
    res.status(500).json({ error: "Failed to reject contact" });
  }
}