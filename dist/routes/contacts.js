"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const contacts_controller_1 = require("../controllers/contacts.controller");
const router = (0, express_1.Router)();
// Contact categories (declare before dynamic :contactId route to avoid shadowing)
router.get("/:userId/categories", contacts_controller_1.listContactCategories);
router.post("/:userId/categories", contacts_controller_1.createContactCategory);
router.put("/:userId/categories/:categoryId", contacts_controller_1.updateContactCategory);
router.delete("/:userId/categories/:categoryId", contacts_controller_1.deleteContactCategory);
// Contact requests
router.get("/:userId/requests/pending", contacts_controller_1.listPendingRequests);
router.post("/:userId/requests/:contactId/accept", contacts_controller_1.acceptContact);
router.post("/:userId/requests/:contactId/reject", contacts_controller_1.rejectContact);
// Contacts CRUD
router.get("/:userId", contacts_controller_1.listContacts);
router.get("/:userId/:contactId", contacts_controller_1.getContact);
router.post("/:userId", contacts_controller_1.createContact);
router.put("/:userId/:contactId", contacts_controller_1.updateContact);
router.delete("/:userId/:contactId", contacts_controller_1.deleteContact);
exports.default = router;
