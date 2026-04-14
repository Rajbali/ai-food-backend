const Food = require("../models/Food");

// ─── Helper ──────────────────────────────────────────────────────
const buildFoodFilter = (query) => {
  const filter = { isActive: true };

  if (query.type)    filter.type    = query.type;
  if (query.cuisine) filter.cuisine = query.cuisine;

  if (query.maxCal)   filter.cal   = { ...filter.cal,   $lte: Number(query.maxCal) };
  if (query.minCal)   filter.cal   = { ...filter.cal,   $gte: Number(query.minCal) };
  if (query.maxPrice) filter.price = { ...filter.price, $lte: Number(query.maxPrice) };

  if (query.tags) {
    const tags = Array.isArray(query.tags) ? query.tags : query.tags.split(",");
    filter.tags = { $in: tags };
  }

  if (query.search) {
    filter.$text = { $search: query.search };
  }

  return filter;
};

const buildSortOption = (sortBy) => {
  switch (sortBy) {
    case "cal":    return { cal: 1 };
    case "price":  return { price: 1 };
    case "health": return { health: -1 };
    default:       return { rating: -1 };
  }
};

// ─── Controllers ─────────────────────────────────────────────────

// @desc    Get all foods (with filtering, sorting, pagination)
// @route   GET /api/foods
// @access  Public
exports.getAllFoods = async (req, res, next) => {
  try {
    const page  = Math.max(1, Number(req.query.page)  || 1);
    const limit = Math.min(50, Number(req.query.limit) || 12);
    const skip  = (page - 1) * limit;

    const filter = buildFoodFilter(req.query);
    const sort   = buildSortOption(req.query.sort);

    const [foods, total] = await Promise.all([
      Food.find(filter).sort(sort).skip(skip).limit(limit),
      Food.countDocuments(filter),
    ]);

    res.json({
      success: true,
      count: foods.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: foods,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single food by ID
// @route   GET /api/foods/:id
// @access  Public
exports.getFoodById = async (req, res, next) => {
  try {
    const food = await Food.findById(req.params.id);
    if (!food || !food.isActive) {
      return res.status(404).json({ success: false, message: "Food not found" });
    }
    res.json({ success: true, data: food });
  } catch (err) {
    next(err);
  }
};

// @desc    Get trending / featured foods
// @route   GET /api/foods/trending
// @access  Public
exports.getTrendingFoods = async (req, res, next) => {
  try {
    const foods = await Food.find({ isActive: true })
      .sort({ rating: -1, health: -1 })
      .limit(8);
    res.json({ success: true, count: foods.length, data: foods });
  } catch (err) {
    next(err);
  }
};

// @desc    Get foods by ingredients (ingredient-based search)
// @route   GET /api/foods/by-ingredients?items=rice,egg,onion
// @access  Public
exports.getFoodsByIngredients = async (req, res, next) => {
  try {
    const items = req.query.items
      ? req.query.items.split(",").map((i) => i.trim().toLowerCase())
      : [];

    if (items.length === 0) {
      return res.status(400).json({ success: false, message: "Provide at least one ingredient" });
    }

    // Match foods whose ingredients contain any of the provided items
    const regexes = items.map((item) => new RegExp(item, "i"));
    const foods = await Food.find({
      isActive: true,
      ingredients: { $elemMatch: { $in: regexes } },
    }).sort({ rating: -1 });

    res.json({ success: true, count: foods.length, data: foods });
  } catch (err) {
    next(err);
  }
};

// @desc    Create a new food (admin)
// @route   POST /api/foods
// @access  Private/Admin
exports.createFood = async (req, res, next) => {
  try {
    const body = req.body || {};
    const toNum = (v) => (v === undefined || v === null || v === "" ? undefined : Number(v));
    const parseArray = (v) => {
      if (Array.isArray(v)) return v;
      if (typeof v === "string") {
        // allow JSON string or comma-separated
        const trimmed = v.trim();
        if (!trimmed) return [];
        if (trimmed.startsWith("[")) {
          try {
            const arr = JSON.parse(trimmed);
            return Array.isArray(arr) ? arr : [];
          } catch {
            return [];
          }
        }
        return trimmed
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
      }
      return [];
    };

    const imageUrl =
      req.file?.filename ? `/uploads/${req.file.filename}` : (body.imageUrl || undefined);

    const payload = {
      ...body,
      imageUrl,
      cal: toNum(body.cal),
      protein: toNum(body.protein) ?? 0,
      carbs: toNum(body.carbs) ?? 0,
      fat: toNum(body.fat) ?? 0,
      price: toNum(body.price),
      health: toNum(body.health),
      rating: toNum(body.rating),
      ratingCount: toNum(body.ratingCount),
      tags: parseArray(body.tags),
      ingredients: parseArray(body.ingredients),
      steps: Array.isArray(body.steps)
        ? body.steps
        : typeof body.steps === "string"
          ? body.steps
              .split("\n")
              .map((s) => s.trim())
              .filter(Boolean)
          : [],
    };

    const food = await Food.create(payload);
    res.status(201).json({ success: true, data: food });
  } catch (err) {
    next(err);
  }
};

// @desc    Update a food (admin)
// @route   PUT /api/foods/:id
// @access  Private/Admin
exports.updateFood = async (req, res, next) => {
  try {
    const food = await Food.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!food) return res.status(404).json({ success: false, message: "Food not found" });
    res.json({ success: true, data: food });
  } catch (err) {
    next(err);
  }
};

// @desc    Soft-delete a food (admin)
// @route   DELETE /api/foods/:id
// @access  Private/Admin
exports.deleteFood = async (req, res, next) => {
  try {
    const food = await Food.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    if (!food) return res.status(404).json({ success: false, message: "Food not found" });
    res.json({ success: true, message: "Food deactivated successfully" });
  } catch (err) {
    next(err);
  }
};

// @desc    Rate a food item
// @route   POST /api/foods/:id/rate
// @access  Private
exports.rateFood = async (req, res, next) => {
  try {
    const { rating } = req.body;
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: "Rating must be between 1 and 5" });
    }

    const food = await Food.findById(req.params.id);
    if (!food) return res.status(404).json({ success: false, message: "Food not found" });

    // Rolling average
    const newCount  = food.ratingCount + 1;
    const newRating = ((food.rating * food.ratingCount) + rating) / newCount;

    food.rating      = Math.round(newRating * 10) / 10;
    food.ratingCount = newCount;
    await food.save();

    res.json({ success: true, data: { rating: food.rating, ratingCount: food.ratingCount } });
  } catch (err) {
    next(err);
  }
};
