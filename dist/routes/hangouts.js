"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const hangouts_controller_1 = require("../controllers/hangouts.controller");
const router = (0, express_1.Router)();
// Hangouts CRUD
router.get("/", hangouts_controller_1.listHangouts);
router.get("/:id", hangouts_controller_1.getHangout);
router.post("/", hangouts_controller_1.createHangout);
router.put("/:id", hangouts_controller_1.updateHangout);
router.delete("/:id", hangouts_controller_1.deleteHangout);
// Visibility controls
router.get("/:id/visibility", hangouts_controller_1.listVisibility);
router.post("/:id/visibility", hangouts_controller_1.addVisibility);
router.delete("/:id/visibility/:visibilityId", hangouts_controller_1.removeVisibility);
exports.default = router;
