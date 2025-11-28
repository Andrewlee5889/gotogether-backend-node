import { Request, Response } from "express";
import { prisma } from "../db";

// List all interest tags
export async function listInterests(_req: Request, res: Response) {
  try {
    const tags = await prisma.interest.findMany({ orderBy: { name: "asc" } });
    res.json(tags);
  } catch (err) {
    console.error("Failed to list interests:", err);
    res.status(500).json({ error: "Failed to list interests" });
  }
}

// Create a new interest tag
export async function createInterest(req: Request, res: Response) {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ error: "name required" });
    const tag = await prisma.interest.create({ data: { name, description } });
    res.status(201).json(tag);
  } catch (err) {
    console.error("Failed to create interest:", err);
    res.status(500).json({ error: "Failed to create interest" });
  }
}

// Update an interest tag
export async function updateInterest(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    const tag = await prisma.interest.update({ where: { id }, data: { name, description } });
    res.json(tag);
  } catch (err) {
    console.error("Failed to update interest:", err);
    res.status(500).json({ error: "Failed to update interest" });
  }
}

// Delete an interest tag
export async function deleteInterest(req: Request, res: Response) {
  try {
    const { id } = req.params;
    await prisma.interest.delete({ where: { id } });
    res.status(204).send();
  } catch (err) {
    console.error("Failed to delete interest:", err);
    res.status(500).json({ error: "Failed to delete interest" });
  }
}

// User interest selections
export async function listUserInterests(req: Request, res: Response) {
  try {
    const { userId } = req.params;
    const items = await prisma.userInterest.findMany({
      where: { userId },
      include: { Interest: true },
      orderBy: { createdAt: "desc" },
    });
    res.json(items);
  } catch (err) {
    console.error("Failed to list user interests:", err);
    res.status(500).json({ error: "Failed to list user interests" });
  }
}

export async function addUserInterest(req: Request, res: Response) {
  try {
    const { userId } = req.params;
    const { interestId } = req.body;
    if (!interestId) return res.status(400).json({ error: "interestId required" });
    const item = await prisma.userInterest.create({ data: { userId, interestId } });
    res.status(201).json(item);
  } catch (err) {
    console.error("Failed to add user interest:", err);
    res.status(500).json({ error: "Failed to add user interest" });
  }
}

export async function removeUserInterest(req: Request, res: Response) {
  try {
    const { userId, interestId } = req.params;
    await prisma.userInterest.delete({ where: { userId_interestId: { userId, interestId } } });
    res.status(204).send();
  } catch (err) {
    console.error("Failed to remove user interest:", err);
    res.status(500).json({ error: "Failed to remove user interest" });
  }
}
