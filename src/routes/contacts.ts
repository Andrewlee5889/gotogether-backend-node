import { Router } from "express";
import {
  listContacts,
  getContact,
  createContact,
  updateContact,
  deleteContact,
  listContactCategories,
  createContactCategory,
  updateContactCategory,
  deleteContactCategory,
  listPendingRequests,
  acceptContact,
  rejectContact,
} from "../controllers/contacts.controller";

const router = Router();

// Contacts CRUD
router.get("/:userId", listContacts);
router.get("/:userId/:contactId", getContact);
router.post("/:userId", createContact);
router.put("/:userId/:contactId", updateContact);
router.delete("/:userId/:contactId", deleteContact);

// Contact requests
router.get("/:userId/requests/pending", listPendingRequests);
router.post("/:userId/requests/:contactId/accept", acceptContact);
router.post("/:userId/requests/:contactId/reject", rejectContact);

// Contact categories
router.get("/:userId/categories", listContactCategories);
router.post("/:userId/categories", createContactCategory);
router.put("/:userId/categories/:categoryId", updateContactCategory);
router.delete("/:userId/categories/:categoryId", deleteContactCategory);

export default router;