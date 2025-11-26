import { Router } from "express";
import { listUsers, getUser, createUser, updateUser, deleteUser, getMe, syncUser } from "../controllers/users.controller";
import { firebaseAuth } from "../middleware/firebaseAuth";

const router = Router();

// Users CRUD
router.get("/", listUsers);
router.get("/:id", getUser);
router.post("/", createUser);
router.put("/:id", updateUser);
router.delete("/:id", deleteUser);

// Auth-only endpoints
router.get("/me", firebaseAuth, getMe);
router.post("/sync", firebaseAuth, syncUser);

// Contacts

export default router;
