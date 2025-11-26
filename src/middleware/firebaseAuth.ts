import { Request, Response, NextFunction } from "express";
import { initializeApp, applicationDefault, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

let initialized = false;

function initFirebase() {
  if (initialized) return;
  const useCert = process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_PROJECT_ID;
  if (useCert) {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID as string,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL as string,
        privateKey: (process.env.FIREBASE_PRIVATE_KEY as string).replace(/\\n/g, "\n"),
      }),
    });
  } else {
    initializeApp({ credential: applicationDefault() });
  }
  initialized = true;
}

export async function firebaseAuth(req: Request, res: Response, next: NextFunction) {
  try {
    initFirebase();
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.substring(7) : undefined;
    if (!token) return res.status(401).json({ error: "Missing Bearer token" });
    const decoded = await getAuth().verifyIdToken(token);
    (req as any).authUser = {
      uid: decoded.uid,
      email: decoded.email,
      name: decoded.name,
      picture: decoded.picture,
      providerId: decoded.firebase?.sign_in_provider,
    };
    next();
  } catch (err) {
    console.error("Firebase auth failed:", err);
    return res.status(401).json({ error: "Invalid token" });
  }
}
