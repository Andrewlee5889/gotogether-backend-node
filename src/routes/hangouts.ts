import { Router } from "express";
import {
  listHangouts,
  getHangout,
  createHangout,
  updateHangout,
  deleteHangout,
  listVisibility,
  addVisibility,
  removeVisibility,
} from "../controllers/hangouts.controller";

const router = Router();

// Hangouts CRUD
router.get("/", listHangouts);
router.get("/:id", getHangout);
router.post("/", createHangout);
router.put("/:id", updateHangout);
router.delete("/:id", deleteHangout);

// Visibility controls
router.get("/:id/visibility", listVisibility);
router.post("/:id/visibility", addVisibility);
router.delete("/:id/visibility/:visibilityId", removeVisibility);

export default router;
