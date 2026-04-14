const MealPlan = require("../models/MealPlan");
const Food     = require("../models/Food");

// ─── Helpers ─────────────────────────────────────────────────────
const getMondayOfWeek = (date = new Date()) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

// ─── Controllers ─────────────────────────────────────────────────

// @desc    Get current week's meal plan for the user
// @route   GET /api/meal-plans/current
// @access  Private
exports.getCurrentPlan = async (req, res, next) => {
  try {
    const weekStart = getMondayOfWeek();

    const plan = await MealPlan.findOne({
      user:          req.user.id,
      weekStartDate: { $gte: weekStart },
      isActive:      true,
    }).populate("meals.food", "name emoji cal protein carbs fat price type");

    if (!plan) {
      return res.status(404).json({ success: false, message: "No meal plan for this week. Create one!" });
    }

    res.json({ success: true, data: plan });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all meal plans for the user
// @route   GET /api/meal-plans
// @access  Private
exports.getAllPlans = async (req, res, next) => {
  try {
    const plans = await MealPlan.find({ user: req.user.id, isActive: true })
      .sort({ weekStartDate: -1 })
      .populate("meals.food", "name emoji cal type");

    res.json({ success: true, count: plans.length, data: plans });
  } catch (err) {
    next(err);
  }
};

// @desc    Create a new meal plan
// @route   POST /api/meal-plans
// @access  Private
exports.createPlan = async (req, res, next) => {
  try {
    const { title, weekStartDate, meals, targetCalories, targetProtein, targetBudget } = req.body;

    const plan = await MealPlan.create({
      user: req.user.id,
      title,
      weekStartDate: weekStartDate || getMondayOfWeek(),
      meals: meals || [],
      targetCalories,
      targetProtein,
      targetBudget,
    });

    const populated = await plan.populate("meals.food", "name emoji cal type");
    res.status(201).json({ success: true, data: populated });
  } catch (err) {
    next(err);
  }
};

// @desc    Add or update a meal slot in the plan
// @route   PUT /api/meal-plans/:id/slot
// @access  Private
exports.updateSlot = async (req, res, next) => {
  try {
    const { day, mealType, foodId, portionMultiplier, notes } = req.body;

    const plan = await MealPlan.findOne({ _id: req.params.id, user: req.user.id });
    if (!plan) return res.status(404).json({ success: false, message: "Meal plan not found" });

    const food = await Food.findById(foodId);
    if (!food) return res.status(404).json({ success: false, message: "Food not found" });

    // Remove existing slot for same day+mealType, then add new one
    plan.meals = plan.meals.filter((m) => !(m.day === day && m.mealType === mealType));
    plan.meals.push({ day, mealType, food: foodId, portionMultiplier: portionMultiplier || 1, notes });

    await plan.save();
    const populated = await plan.populate("meals.food", "name emoji cal protein carbs fat type");
    res.json({ success: true, data: populated });
  } catch (err) {
    next(err);
  }
};

// @desc    Remove a meal slot from the plan
// @route   DELETE /api/meal-plans/:id/slot
// @access  Private
exports.removeSlot = async (req, res, next) => {
  try {
    const { day, mealType } = req.body;

    const plan = await MealPlan.findOne({ _id: req.params.id, user: req.user.id });
    if (!plan) return res.status(404).json({ success: false, message: "Meal plan not found" });

    plan.meals = plan.meals.filter((m) => !(m.day === day && m.mealType === mealType));
    await plan.save();

    res.json({ success: true, data: plan });
  } catch (err) {
    next(err);
  }
};

// @desc    Auto-generate a meal plan based on user preferences
// @route   POST /api/meal-plans/auto-generate
// @access  Private
exports.autoGenerate = async (req, res, next) => {
  try {
    const user = req.user;
    const goals = user.goals || {};

    // Determine food type filter from diet preferences
    let typeFilter = {};
    const prefs = user.dietPreferences || [];
    if (prefs.includes("Vegan"))       typeFilter = { type: "vegan" };
    else if (prefs.includes("Vegetarian")) typeFilter = { type: { $in: ["veg", "vegan"] } };
    // else all types

    // Fetch available foods
    const allFoods = await Food.find({ isActive: true, ...typeFilter });
    if (allFoods.length < 3) {
      return res.status(400).json({ success: false, message: "Not enough foods in DB to generate a plan" });
    }

    const shuffle  = (arr) => arr.sort(() => Math.random() - 0.5);
    const DAYS     = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const MEALS    = ["Breakfast", "Lunch", "Dinner"];
    const meals    = [];

    // For each day, pick breakfast (<400 cal), lunch (any), dinner (<500 cal)
    DAYS.forEach((day) => {
      const breakfastOptions = shuffle(allFoods.filter((f) => f.cal < 400));
      const lunchOptions     = shuffle(allFoods);
      const dinnerOptions    = shuffle(allFoods.filter((f) => f.cal < 500));

      if (breakfastOptions[0]) meals.push({ day, mealType: "Breakfast", food: breakfastOptions[0]._id });
      if (lunchOptions[0])     meals.push({ day, mealType: "Lunch",     food: lunchOptions[0]._id     });
      if (dinnerOptions[0])    meals.push({ day, mealType: "Dinner",    food: dinnerOptions[0]._id    });
    });

    const plan = await MealPlan.create({
      user:            user.id,
      weekStartDate:   getMondayOfWeek(),
      title:           "Auto-Generated Plan",
      meals,
      targetCalories:  goals.dailyCalories || 2000,
      targetProtein:   goals.proteinGoal   || 120,
      targetBudget:    (goals.dailyBudget  || 600) * 7,
      isAutoGenerated: true,
    });

    const populated = await plan.populate("meals.food", "name emoji cal protein carbs fat price type");
    res.status(201).json({ success: true, data: populated });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete a meal plan
// @route   DELETE /api/meal-plans/:id
// @access  Private
exports.deletePlan = async (req, res, next) => {
  try {
    const plan = await MealPlan.findOne({ _id: req.params.id, user: req.user.id });
    if (!plan) return res.status(404).json({ success: false, message: "Meal plan not found" });

    plan.isActive = false;
    await plan.save();
    res.json({ success: true, message: "Meal plan deleted" });
  } catch (err) {
    next(err);
  }
};
