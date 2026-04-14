const MealLog = require("../models/MealLog");
const Food    = require("../models/Food");
const User    = require("../models/User");

// ─── Helpers ─────────────────────────────────────────────────────
const startOfDay = (date = new Date()) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const endOfDay = (date = new Date()) => {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
};

const startOfWeek = (date = new Date()) => {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Mon
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

// Aggregate nutrition from logs
const aggregateNutrition = (logs) =>
  logs.reduce(
    (acc, log) => {
      const m = log.portionMultiplier || 1;
      const s = log.snapshot || {};
      acc.cal     += (s.cal     || 0) * m;
      acc.protein += (s.protein || 0) * m;
      acc.carbs   += (s.carbs   || 0) * m;
      acc.fat     += (s.fat     || 0) * m;
      acc.spent   += (s.price   || 0) * m;
      return acc;
    },
    { cal: 0, protein: 0, carbs: 0, fat: 0, spent: 0 }
  );

// ─── Controllers ─────────────────────────────────────────────────

// @desc    Log a meal
// @route   POST /api/meal-logs
// @access  Private
exports.logMeal = async (req, res, next) => {
  try {
    const { foodId, mealType, date, portionMultiplier, notes } = req.body;

    const food = await Food.findById(foodId);
    if (!food) return res.status(404).json({ success: false, message: "Food not found" });

    const mult = portionMultiplier || 1;
    const log  = await MealLog.create({
      user: req.user.id,
      food: foodId,
      mealType,
      date: date || new Date(),
      portionMultiplier: mult,
      notes,
      snapshot: {
        cal:     food.cal,
        protein: food.protein,
        carbs:   food.carbs,
        fat:     food.fat,
        price:   food.price,
      },
    });

    // Increment mealsLogged counter on user
    await User.findByIdAndUpdate(req.user.id, { $inc: { mealsLogged: 1 } });

    const populated = await log.populate("food", "name emoji cal type cuisine");
    res.status(201).json({ success: true, data: populated });
  } catch (err) {
    next(err);
  }
};

// @desc    Get today's meal logs for current user
// @route   GET /api/meal-logs/today
// @access  Private
exports.getTodayLogs = async (req, res, next) => {
  try {
    const logs = await MealLog.find({
      user: req.user.id,
      date: { $gte: startOfDay(), $lte: endOfDay() },
    })
      .populate("food", "name emoji cal protein carbs fat type")
      .sort({ date: 1 });

    const nutrition = aggregateNutrition(logs);
    const user      = req.user;

    const goals = user.goals || {};
    const summary = {
      ...nutrition,
      calRemaining:     (goals.dailyCalories || 2000) - nutrition.cal,
      proteinRemaining: (goals.proteinGoal   || 120)  - nutrition.protein,
      budgetRemaining:  (goals.dailyBudget   || 600)  - nutrition.spent,
    };

    res.json({ success: true, count: logs.length, nutrition: summary, data: logs });
  } catch (err) {
    next(err);
  }
};

// @desc    Get meal logs for a specific date
// @route   GET /api/meal-logs?date=2026-04-14
// @access  Private
exports.getLogsByDate = async (req, res, next) => {
  try {
    const date = req.query.date ? new Date(req.query.date) : new Date();

    const logs = await MealLog.find({
      user: req.user.id,
      date: { $gte: startOfDay(date), $lte: endOfDay(date) },
    })
      .populate("food", "name emoji cal protein carbs fat price type")
      .sort({ mealType: 1 });

    const nutrition = aggregateNutrition(logs);
    res.json({ success: true, count: logs.length, nutrition, data: logs });
  } catch (err) {
    next(err);
  }
};

// @desc    Get this week's nutrition summary
// @route   GET /api/meal-logs/weekly-summary
// @access  Private
exports.getWeeklySummary = async (req, res, next) => {
  try {
    const weekStart = startOfWeek();
    const weekEnd   = endOfDay();

    const logs = await MealLog.find({
      user: req.user.id,
      date: { $gte: weekStart, $lte: weekEnd },
    }).populate("food", "name emoji cal protein carbs fat price health type");

    // Group by day
    const byDay = {};
    const DAYS  = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    DAYS.forEach((d) => (byDay[d] = []));

    logs.forEach((log) => {
      const dayIdx = new Date(log.date).getDay(); // 0=Sun
      const dayKey = DAYS[dayIdx === 0 ? 6 : dayIdx - 1];
      if (byDay[dayKey]) byDay[dayKey].push(log);
    });

    const dailyNutrition = {};
    DAYS.forEach((d) => {
      dailyNutrition[d] = aggregateNutrition(byDay[d]);
    });

    const weeklyTotal = aggregateNutrition(logs);
    const avgDaily    = {
      cal:     Math.round(weeklyTotal.cal     / 7),
      protein: Math.round(weeklyTotal.protein / 7),
      carbs:   Math.round(weeklyTotal.carbs   / 7),
      fat:     Math.round(weeklyTotal.fat     / 7),
      spent:   Math.round(weeklyTotal.spent   / 7),
    };

    res.json({
      success: true,
      weekStart,
      weeklyTotal,
      avgDaily,
      dailyNutrition,
      totalMeals: logs.length,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete a meal log entry
// @route   DELETE /api/meal-logs/:id
// @access  Private
exports.deleteMealLog = async (req, res, next) => {
  try {
    const log = await MealLog.findOne({ _id: req.params.id, user: req.user.id });
    if (!log) return res.status(404).json({ success: false, message: "Meal log not found" });

    await log.deleteOne();
    res.json({ success: true, message: "Meal log removed" });
  } catch (err) {
    next(err);
  }
};
