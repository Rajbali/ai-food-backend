const express = require("express");
const router = express.Router();

const {
  logMeal,
  getTodayLogs,
  getLogsByDate,
  getWeeklySummary,
  deleteMealLog,
} = require("../controllers/mealLogController");

const { protect } = require("../middleware/auth");

// All meal log routes require authentication
router.use(protect);

router.post("/", logMeal);
router.get("/today", getTodayLogs);
router.get("/weekly-summary", getWeeklySummary);
router.get("/", getLogsByDate); // ?date=2026-04-14
router.delete("/:id", deleteMealLog);

module.exports = router;
