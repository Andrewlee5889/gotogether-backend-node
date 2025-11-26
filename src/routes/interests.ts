import { Router } from "express";
import {
  listInterests,
  createInterest,
  updateInterest,
  deleteInterest,
  listUserInterests,
  addUserInterest,
  removeUserInterest,
} from "../controllers/interests.controller";

const router = Router();

// Interest tags
router.get("/", listInterests);
router.post("/", createInterest);
router.put("/:id", updateInterest);
router.delete("/:id", deleteInterest);

// User interests
router.get("/user/:userId", listUserInterests);
router.post("/user/:userId", addUserInterest);
router.delete("/user/:userId/:interestId", removeUserInterest);

export default router;
