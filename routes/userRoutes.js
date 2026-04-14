const express = require("express");
const router  = express.Router();

const {
  register,
  login,
  getMe,
  updateMe,
  changePassword,
  toggleLike,
  getLikedFoods,
  getAllUsers,
  getAdminStats,
} = require("../controllers/userController");

const { protect, adminOnly } = require("../middleware/auth");

// ─── Auth ─────────────────────────────────────────────────────────
router.post("/register", register);
router.post("/login",    login);

// ─── Profile ──────────────────────────────────────────────────────
router.get( "/me",              protect, getMe);
router.put( "/me",              protect, updateMe);
router.put( "/me/password",     protect, changePassword);
router.get( "/me/likes",        protect, getLikedFoods);
router.post("/me/likes/:foodId",protect, toggleLike);

// ─── Admin ────────────────────────────────────────────────────────
router.get("/",           protect, adminOnly, getAllUsers);
router.get("/admin/stats",protect, adminOnly, getAdminStats);

module.exports = router;
