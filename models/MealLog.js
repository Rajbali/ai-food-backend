const mongoose = require("mongoose");

const MealLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    food: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Food",
      required: true,
    },

    // ─── Meal Context ─────────────────────────────────────────
    mealType: {
      type: String,
      enum: ["Breakfast", "Lunch", "Dinner", "Snack"],
      required: [true, "Meal type is required"],
    },
    date: {
      type: Date,
      default: Date.now,
    },

    // ─── Portion & Computed Nutrition ─────────────────────────
    // portionMultiplier: 1 = standard serving, 0.5 = half, 2 = double
    portionMultiplier: {
      type: Number,
      default: 1,
      min: 0.1,
      max: 10,
    },
    // Snapshot of nutrition at time of logging (in case food data changes)
    snapshot: {
      cal:     { type: Number },
      protein: { type: Number },
      carbs:   { type: Number },
      fat:     { type: Number },
      price:   { type: Number },
    },

    notes: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

// Index for efficient daily/weekly queries per user
MealLogSchema.index({ user: 1, date: -1 });
MealLogSchema.index({ user: 1, date: 1, mealType: 1 });

module.exports = mongoose.model("MealLog", MealLogSchema);
