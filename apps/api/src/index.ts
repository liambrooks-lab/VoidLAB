import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import assistantRoutes from "./routes/assistant.routes";
import authRoutes from "./routes/auth.routes";
import collaborationRoutes from "./routes/collaboration.routes";
import executeRoutes from "./routes/execute.routes";

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 5000);

app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);
app.use(express.json({ limit: "4mb" }));

app.get("/", (_req, res) => {
  res.json({
    name: "VoidLAB API",
    status: "online",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/assistant", assistantRoutes);
app.use("/api/collaboration", collaborationRoutes);
app.use("/api/execute", executeRoutes);

app.listen(port, () => {
  console.log(`VoidLAB API listening on http://localhost:${port}`);
});
