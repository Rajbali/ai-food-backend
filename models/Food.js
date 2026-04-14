const mongoose = require("mongoose");

const FoodSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Food name is required"],
      trim: true,
      unique: true,
    },
    emoji: {
      type: String,
      default: "🍽️",
    },
    desc: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
    },
    imageUrl: {
      type: String,
      trim: true,
    },

    // ─── Nutrition ────────────────────────────────────────────
    cal: {
      type: Number,
      required: [true, "Calories are required"],
      min: [0, "Calories cannot be negative"],
    },
    protein: { type: Number, default: 0 }, // grams
    carbs:   { type: Number, default: 0 }, // grams
    fat:     { type: Number, default: 0 }, // grams

    // ─── Classification ───────────────────────────────────────
    type: {
      type: String,
      enum: ["veg", "vegan", "non-veg"],
      required: [true, "Food type is required"],
    },
    cuisine: {
      type: String,
      required: [true, "Cuisine type is required"],
      trim: true,
    },
    tags: {
      type: [String],
      default: [],
    },

    // ─── Score & Pricing ──────────────────────────────────────
    health: {
      type: Number,
      min: 0,
      max: 100,
      default: 70,
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
    },
    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0,
    },
    ratingCount: {
      type: Number,
      default: 0,
    },

    // ─── Recipe ───────────────────────────────────────────────
    ingredients: {
      type: [String],
      default: [],
    },
    steps: {
      type: [String],
      default: [],
    },

    // ─── Status ───────────────────────────────────────────────
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Index for search and filter queries
FoodSchema.index({ name: "text", desc: "text", tags: "text" });
FoodSchema.index({ type: 1, cuisine: 1, cal: 1, price: 1, rating: -1 });

module.exports = mongoose.model("Food", FoodSchema);
