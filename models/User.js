const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const UserSchema = new mongoose.Schema(
  {
    // ─── Auth ─────────────────────────────────────────────────
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false, // Never return password in queries
    },

    // ─── Physical Stats ───────────────────────────────────────
    age:    { type: Number, min: 1, max: 120 },
    weight: { type: Number, min: 1 },  // kg
    height: { type: Number, min: 1 },  // cm
    gender: {
      type: String,
      enum: ["Male", "Female", "Other", "Prefer not to say"],
    },
    activityLevel: {
      type: String,
      enum: ["Sedentary", "Lightly Active", "Moderately Active", "Very Active", "Extra Active"],
      default: "Moderately Active",
    },

    // ─── Health Goals ─────────────────────────────────────────
    goals: {
      dailyCalories: { type: Number, default: 2000 },
      proteinGoal:   { type: Number, default: 120 },  // grams
      dailyBudget:   { type: Number, default: 600 },  // INR
      waterGoal:     { type: Number, default: 2.5 },  // litres
    },

    // ─── Diet Preferences ─────────────────────────────────────
    dietPreferences: {
      type: [String],
      enum: ["Vegetarian", "Vegan", "Keto", "Paleo", "Mediterranean", "Gluten-Free", "Dairy-Free", "Low-Carb"],
      default: [],
    },
    allergies: {
      type: [String],
      default: [],
    },

    // ─── Liked Foods ──────────────────────────────────────────
    likedFoods: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Food",
      },
    ],

    // ─── Gamification ─────────────────────────────────────────
    streakDays:   { type: Number, default: 0 },
    mealsLogged:  { type: Number, default: 0 },
    healthScore:  { type: Number, default: 0, min: 0, max: 100 },

    // ─── Role ─────────────────────────────────────────────────
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
  },
  { timestamps: true }
);

// Hash password before saving
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Instance method to compare passwords
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", UserSchema);
