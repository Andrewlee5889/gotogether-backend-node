"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const contacts_controller_1 = require("../controllers/contacts.controller");
const router = (0, express_1.Router)();
// Contacts CRUD
router.get("/:userId", contacts_controller_1.listContacts);
router.post("/:userId", contacts_controller_1.createContact);
router.put("/:userId/:contactId", contacts_controller_1.updateContact);
router.delete("/:userId/:contactId", contacts_controller_1.deleteContact);
// Contact categories
router.get("/:userId/categories", contacts_controller_1.listContactCategories);
router.post("/:userId/categories", contacts_controller_1.createContactCategory);
router.put("/:userId/categories/:categoryId", contacts_controller_1.updateContactCategory);
router.delete("/:userId/categories/:categoryId", contacts_controller_1.deleteContactCategory);
exports.default = router;
