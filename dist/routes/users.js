"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const users_controller_1 = require("../controllers/users.controller");
const router = (0, express_1.Router)();
// Users CRUD
router.get("/", users_controller_1.listUsers);
router.get("/:id", users_controller_1.getUser);
router.post("/", users_controller_1.createUser);
router.put("/:id", users_controller_1.updateUser);
router.delete("/:id", users_controller_1.deleteUser);
// Contacts
router.get("/:id/contacts", users_controller_1.listContacts);
router.post("/:id/contacts", users_controller_1.addContact);
router.delete("/:id/contacts/:contactId", users_controller_1.removeContact);
// Categories
router.get("/:id/categories", users_controller_1.listCategories);
router.post("/:id/categories", users_controller_1.createCategory);
router.put("/:id/categories/:categoryId", users_controller_1.updateCategory);
router.delete("/:id/categories/:categoryId", users_controller_1.deleteCategory);
exports.default = router;
