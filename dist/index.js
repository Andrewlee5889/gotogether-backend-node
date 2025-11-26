"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const health_1 = __importDefault(require("./routes/health"));
const hangouts_1 = __importDefault(require("./routes/hangouts"));
const users_1 = __importDefault(require("./routes/users"));
const contacts_1 = __importDefault(require("./routes/contacts"));
const app = (0, express_1.default)();
const port = process.env.PORT || 3000;
// CORS + JSON
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Routes
app.use(health_1.default);
app.use("/api/hangouts", hangouts_1.default);
app.use("/api/users", users_1.default);
app.use("/api/contacts", contacts_1.default);
app.listen(port, () => {
    console.log(`API listening on port ${port}`);
});
