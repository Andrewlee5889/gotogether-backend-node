import "dotenv/config";
import express from "express";
import cors from "cors";
import healthRoutes from "./routes/health";
import hangoutsRoutes from "./routes/hangouts";
import usersRoutes from "./routes/users";
import contactsRoutes from "./routes/contacts";
import interestsRoutes from "./routes/interests";

// Factory to allow future dependency injection (e.g., prisma, middlewares)
export function createApp() {
	const app = express();

	// CORS + JSON
	app.use(cors());
	app.use(express.json());

	// Routes
	app.use(healthRoutes);
	app.use("/api/hangouts", hangoutsRoutes);
	app.use("/api/users", usersRoutes);
	app.use("/api/contacts", contactsRoutes);
	app.use("/api/interests", interestsRoutes);

	return app;
}

// Backward-compatible default export of a ready app
const app = createApp();
export default app;
