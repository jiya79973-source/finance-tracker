import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import authRoutes from "./routes/auth.js";
import transactionRoutes from "./routes/transactions.js";

const app = express();
const allowedOrigins = (process.env.CLIENT_ORIGIN || "http://localhost:5173").split(",").map((origin) => origin.trim());

app.use(helmet());
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error("Origin is not allowed by CORS"));
  },
}));
app.use(express.json({ limit: "10kb" }));
app.use("/api/auth", rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: "draft-7", legacyHeaders: false }), authRoutes);
app.use("/api/transactions", transactionRoutes);
app.get("/api/health", (_request, response) => response.json({ status: "ok" }));

app.use((error, _request, response, _next) => {
  if (error.message === "Origin is not allowed by CORS") {
    return response.status(403).json({ message: error.message });
  }
  console.error(error);
  return response.status(500).json({ message: "An unexpected server error occurred." });
});

export default app;
