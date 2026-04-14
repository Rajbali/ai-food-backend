const jwt  = require("jsonwebtoken");
const User = require("../models/User");
const Food = require("../models/Food");

// ─── Helper ──────────────────────────────────────────────────────
const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || "7d" });

const sendTokenResponse = (user, statusCode, res) => {
  const token = generateToken(user._id);
  // Remove password from output
  user.password = undefined;
  res.status(statusCode).json({ success: true, token, data: user });
};

// ─── Auth ─────────────────────────────────────────────────────────

// @desc    Register a new user
// @route   POST /api/users/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ success: false, message: "Email already registered" });
    }
    const user = await User.create({ name, email, password });
    sendTokenResponse(user, 201, res);
  } catch (err) {
    next(err);
  }
};

// @desc    Login user
// @route   POST /api/users/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Please provide email and password" });
    }

    const user = await User.findOne({ email }).select("+password");
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    sendTokenResponse(user, 200, res);
  } catch (err) {
    next(err);
  }
};

// ─── Profile ──────────────────────────────────────────────────────

// @desc    Get current user profile
// @route   GET /api/users/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).populate("likedFoods", "name emoji cal type");
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

// @desc    Update profile & health goals
// @route   PUT /api/users/me
// @access  Private
exports.updateMe = async (req, res, next) => {
  try {
    // Fields allowed to update (password updated separately)
    const allowed = ["name", "age", "weight", "height", "gender", "activityLevel", "goals", "dietPreferences", "allergies"];
    const updates = {};
    allowed.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    const user = await User.findByIdAndUpdate(req.user.id, updates, {
      new: true,
      runValidators: true,
    });

    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

// @desc    Change password
// @route   PUT /api/users/me/password
// @access  Private
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id).select("+password");

    if (!(await user.matchPassword(currentPassword))) {
      return res.status(401).json({ success: false, message: "Current password is incorrect" });
    }

    user.password = newPassword;
    await user.save();

    sendTokenResponse(user, 200, res);
  } catch (err) {
    next(err);
  }
};

// ─── Likes ────────────────────────────────────────────────────────

// @desc    Toggle like/unlike a food
// @route   POST /api/users/me/likes/:foodId
// @access  Private
exports.toggleLike = async (req, res, next) => {
  try {
    const food = await Food.findById(req.params.foodId);
    if (!food) return res.status(404).json({ success: false, message: "Food not found" });

    const user = await User.findById(req.user.id);
    const idx  = user.likedFoods.indexOf(req.params.foodId);

    let action;
    if (idx > -1) {
      user.likedFoods.splice(idx, 1);
      action = "unliked";
    } else {
      user.likedFoods.push(req.params.foodId);
      action = "liked";
    }

    await user.save();
    res.json({ success: true, action, likedFoods: user.likedFoods });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all liked foods
// @route   GET /api/users/me/likes
// @access  Private
exports.getLikedFoods = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).populate("likedFoods");
    res.json({ success: true, count: user.likedFoods.length, data: user.likedFoods });
  } catch (err) {
    next(err);
  }
};

// ─── Admin ────────────────────────────────────────────────────────

// @desc    Get all users (admin)
// @route   GET /api/users
// @access  Private/Admin
exports.getAllUsers = async (req, res, next) => {
  try {
    const page  = Math.max(1, Number(req.query.page)  || 1);
    const limit = Math.min(50, Number(req.query.limit) || 20);
    const skip  = (page - 1) * limit;

    const [users, total] = await Promise.all([
      User.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
      User.countDocuments(),
    ]);

    res.json({ success: true, count: users.length, total, page, data: users });
  } catch (err) {
    next(err);
  }
};

// @desc    Get admin dashboard stats
// @route   GET /api/users/admin/stats
// @access  Private/Admin
exports.getAdminStats = async (req, res, next) => {
  try {
    const [totalUsers, totalFoods, newToday] = await Promise.all([
      User.countDocuments(),
      Food.countDocuments({ isActive: true }),
      User.countDocuments({ createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) } }),
    ]);

    res.json({
      success: true,
      data: { totalUsers, totalFoods, newUsersToday: newToday },
    });
  } catch (err) {
    next(err);
  }
};
