import { Router } from "express";
import { listUsers, getUser, createUser, updateUser, deleteUser, getMe, syncUser } from "../controllers/users.controller";
import { firebaseAuth } from "../middleware/firebaseAuth";

const router = Router();

// Auth-only endpoints (define BEFORE dynamic :id routes to avoid shadowing)
router.get("/me", firebaseAuth, getMe);
router.post("/sync", firebaseAuth, syncUser);

// Users CRUD
router.get("/", listUsers);
router.get("/:id", getUser);
router.post("/", createUser);
router.put("/:id", updateUser);
router.delete("/:id", deleteUser);

// Contacts

export default router;
