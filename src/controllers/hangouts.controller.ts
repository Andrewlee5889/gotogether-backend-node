import { Request, Response } from "express";
import { prisma } from "../db";

export async function listHangouts(req: Request, res: Response) {
  try {
    const {
      userId,
      title,
      isPublic,
      startsAtFrom,
      startsAtTo,
      endsAtFrom,
      endsAtTo,
      latMin,
      latMax,
      lngMin,
      lngMax,
      orderBy = "startsAt",
      orderDir = "asc",
      page = "1",
      limit = "25",
      interestId,
    } = req.query as Record<string, string>;

    const where: any = {};
    if (userId) where.userId = userId;
    if (title) where.title = { contains: title, mode: "insensitive" };
    if (typeof isPublic !== "undefined") where.isPublic = isPublic === "true";
    if (startsAtFrom || startsAtTo) where.startsAt = {
      ...(startsAtFrom ? { gte: new Date(startsAtFrom) } : {}),
      ...(startsAtTo ? { lte: new Date(startsAtTo) } : {}),
    };
    if (endsAtFrom || endsAtTo) where.endsAt = {
      ...(endsAtFrom ? { gte: new Date(endsAtFrom) } : {}),
      ...(endsAtTo ? { lte: new Date(endsAtTo) } : {}),
    };
    if (latMin || latMax) where.latitude = {
      ...(latMin ? { gte: parseFloat(latMin) } : {}),
      ...(latMax ? { lte: parseFloat(latMax) } : {}),
    };
    if (lngMin || lngMax) where.longitude = {
      ...(lngMin ? { gte: parseFloat(lngMin) } : {}),
      ...(lngMax ? { lte: parseFloat(lngMax) } : {}),
    };

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Relational interest filter (by interestId only; slug removed)
    if (interestId) {
      where.User = { UserInterest: { some: { interestId } } };
    }

    const hangouts = await prisma.hangout.findMany({
      where,
      orderBy: { [orderBy as string]: orderDir === "desc" ? "desc" : "asc" },
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
  } catch (err) {
    console.error("Failed to list hangouts:", err);
    res.status(500).json({ error: "Failed to list hangouts" });
  }
}

export async function getHangout(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const hangout = await prisma.hangout.findUnique({
      where: { id },
      include: { HangoutVisibility: true },
    });
    if (!hangout) return res.status(404).json({ error: "Hangout not found" });
    res.json(hangout);
  } catch (err) {
    console.error("Failed to get hangout:", err);
    res.status(500).json({ error: "Failed to get hangout" });
  }
}

export async function createHangout(req: Request, res: Response) {
  try {
    const { userId, title, description, location, latitude, longitude, startsAt, endsAt, isPublic } = req.body;
    if (!userId || !title || !startsAt) return res.status(400).json({ error: "userId, title, startsAt required" });
    const hangout = await prisma.hangout.create({
      data: { userId, title, description, location, latitude, longitude, startsAt: new Date(startsAt), endsAt: endsAt ? new Date(endsAt) : undefined, isPublic },
    });
    res.status(201).json(hangout);
  } catch (err) {
    console.error("Failed to create hangout:", err);
    res.status(500).json({ error: "Failed to create hangout" });
  }
}

export async function updateHangout(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { title, description, location, latitude, longitude, startsAt, endsAt, isPublic } = req.body;
    const hangout = await prisma.hangout.update({
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
  } catch (err) {
    console.error("Failed to update hangout:", err);
    res.status(500).json({ error: "Failed to update hangout" });
  }
}

export async function deleteHangout(req: Request, res: Response) {
  try {
    const { id } = req.params;
    await prisma.hangout.delete({ where: { id } });
    res.status(204).send();
  } catch (err) {
    console.error("Failed to delete hangout:", err);
    res.status(500).json({ error: "Failed to delete hangout" });
  }
}

// Visibility controls
export async function listVisibility(req: Request, res: Response) {
  try {
    const { id } = req.params; // hangoutId
    const vis = await prisma.hangoutVisibility.findMany({ where: { hangoutId: id }, orderBy: { createdAt: "desc" } });
    res.json(vis);
  } catch (err) {
    console.error("Failed to list visibility:", err);
    res.status(500).json({ error: "Failed to list visibility" });
  }
}

export async function addVisibility(req: Request, res: Response) {
  try {
    const { id } = req.params; // hangoutId
    const { categoryId, userId } = req.body;
    if (!categoryId && !userId) return res.status(400).json({ error: "Provide categoryId or userId" });
    const vis = await prisma.hangoutVisibility.create({ data: { hangoutId: id, categoryId, userId } });
    res.status(201).json(vis);
  } catch (err) {
    console.error("Failed to add visibility:", err);
    res.status(500).json({ error: "Failed to add visibility" });
  }
}

export async function removeVisibility(req: Request, res: Response) {
  try {
    const { id, visibilityId } = req.params;
    await prisma.hangoutVisibility.delete({ where: { id: visibilityId } });
    res.status(204).send();
  } catch (err) {
    console.error("Failed to remove visibility:", err);
    res.status(500).json({ error: "Failed to remove visibility" });
  }
}
