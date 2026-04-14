const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const connectDB = require("./config/db");
const errorHandler = require("./middleware/errorHandler");

// Load env vars
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// ─── Middleware ──────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Serve uploaded files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ─── Routes ─────────────────────────────────────────────────────
app.use("/api/foods",     require("./routes/foodRoutes"));
app.use("/api/users",     require("./routes/userRoutes"));
app.use("/api/meal-logs", require("./routes/mealLogRoutes"));
app.use("/api/meal-plans",require("./routes/mealPlanRoutes"));
app.use("/api/chat",      require("./routes/chatRoutes"));

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", message: "NutriAI API is running" });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// Global error handler (must be last)
app.use(errorHandler);

// ─── Start Server ────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 NutriAI Server running on port ${PORT} [${process.env.NODE_ENV}]`);
});
