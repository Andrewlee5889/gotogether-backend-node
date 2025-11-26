import { Router } from "express";
import {
  listMemberships,
  createMembership,
  updateMembership,
  deleteMembership,
  listMembershipCategories,
  createMembershipCategory,
  updateMembershipCategory,
  deleteMembershipCategory,
} from "../controllers/memberships.controller";

const router = Router();

// Membership CRUD (contacts as memberships)
router.get("/:userId", listMemberships);
router.post("/:userId", createMembership);
router.put("/:userId/:contactId", updateMembership);
router.delete("/:userId/:contactId", deleteMembership);

// Membership categories
router.get("/:userId/categories", listMembershipCategories);
router.post("/:userId/categories", createMembershipCategory);
router.put("/:userId/categories/:categoryId", updateMembershipCategory);
router.delete("/:userId/categories/:categoryId", deleteMembershipCategory);

export default router;
