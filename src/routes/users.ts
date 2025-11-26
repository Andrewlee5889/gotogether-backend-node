import { Router } from "express";
import {
  listUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  listContacts,
  addContact,
  removeContact,
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../controllers/users.controller";

const router = Router();

// Users CRUD
router.get("/", listUsers);
router.get("/:id", getUser);
router.post("/", createUser);
router.put("/:id", updateUser);
router.delete("/:id", deleteUser);

// Contacts
router.get("/:id/contacts", listContacts);
router.post("/:id/contacts", addContact);
router.delete("/:id/contacts/:contactId", removeContact);

// Categories
router.get("/:id/categories", listCategories);
router.post("/:id/categories", createCategory);
router.put("/:id/categories/:categoryId", updateCategory);
router.delete("/:id/categories/:categoryId", deleteCategory);

export default router;
