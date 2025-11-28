"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const users_controller_1 = require("../controllers/users.controller");
const firebaseAuth_1 = require("../middleware/firebaseAuth");
const router = (0, express_1.Router)();
// Auth-only endpoints (define BEFORE dynamic :id routes to avoid shadowing)
router.get("/me", firebaseAuth_1.firebaseAuth, users_controller_1.getMe);
router.post("/sync", firebaseAuth_1.firebaseAuth, users_controller_1.syncUser);
// Users CRUD
router.get("/", users_controller_1.listUsers);
router.get("/:id", users_controller_1.getUser);
router.post("/", users_controller_1.createUser);
router.put("/:id", users_controller_1.updateUser);
router.delete("/:id", users_controller_1.deleteUser);
// Contacts
exports.default = router;
