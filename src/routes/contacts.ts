import { Router } from "express";
import {
  listContacts,
  createContact,
  updateContact,
  deleteContact,
  listContactCategories,
  createContactCategory,
  updateContactCategory,
  deleteContactCategory,
} from "../controllers/contacts.controller";

const router = Router();

// Contacts CRUD
router.get("/:userId", listContacts);
router.post("/:userId", createContact);
router.put("/:userId/:contactId", updateContact);
router.delete("/:userId/:contactId", deleteContact);

// Contact categories
router.get("/:userId/categories", listContactCategories);
router.post("/:userId/categories", createContactCategory);
router.put("/:userId/categories/:categoryId", updateContactCategory);
router.delete("/:userId/categories/:categoryId", deleteContactCategory);

export default router;