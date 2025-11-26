import "dotenv/config";
import express from "express";
import cors from "cors";
import healthRoutes from "./routes/health";
import hangoutsRoutes from "./routes/hangouts";
import usersRoutes from "./routes/users";
import membershipsRoutes from "./routes/memberships";

const app = express();
const port = process.env.PORT || 3000;

// CORS + JSON
app.use(cors());
app.use(express.json());

// Routes
app.use(healthRoutes);
app.use("/api/hangouts", hangoutsRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/memberships", membershipsRoutes);

app.listen(port, () => {
  console.log(`API listening on port ${port}`);
});
