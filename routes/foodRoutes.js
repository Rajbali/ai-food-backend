const express = require("express");
const router  = express.Router();

const {
  getAllFoods,
  getFoodById,
  getTrendingFoods,
  getFoodsByIngredients,
  createFood,
  updateFood,
  deleteFood,
  rateFood,
} = require("../controllers/foodController");

const { protect, adminOnly } = require("../middleware/auth");
const { uploadFoodImage } = require("../middleware/upload");

// ─── Public ──────────────────────────────────────────────────────
router.get("/",                getAllFoods);
router.get("/trending",        getTrendingFoods);
router.get("/by-ingredients",  getFoodsByIngredients);
router.get("/:id",             getFoodById);

// ─── Authenticated ───────────────────────────────────────────────
router.post("/:id/rate",       protect, rateFood);

// ─── Admin only ──────────────────────────────────────────────────
router.post(  "/",    protect, adminOnly, uploadFoodImage, createFood);
router.put(   "/:id", protect, adminOnly, updateFood);
router.delete("/:id", protect, adminOnly, deleteFood);

module.exports = router;
