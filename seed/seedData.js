require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const Food = require("../models/Food");
const User = require("../models/User");

const FOODS = [
  {
    name: "Paneer Tikka Masala",
    emoji: "🍛",
    cal: 420,
    price: 180,
    rating: 4.8,
    ratingCount: 240,
    type: "veg",
    cuisine: "Indian",
    tags: ["High Protein", "Spicy"],
    health: 82,
    desc: "Creamy tomato-based curry with soft paneer cubes",
    ingredients: [
      "Paneer 200g",
      "Tomatoes 3",
      "Cream 50ml",
      "Garam Masala 2tsp",
      "Ginger-Garlic paste 1tbsp",
      "Kasuri Methi",
      "Salt & Oil",
    ],
    steps: [
      "Marinate paneer in spices and yogurt for 30 min",
      "Sauté onions until golden brown",
      "Add ginger-garlic paste and cook 2 min",
      "Add tomato puree and cook until oil separates",
      "Add cream and simmer for 10 min",
      "Add paneer and kasuri methi, cook 5 min",
    ],
    protein: 22,
    carbs: 30,
    fat: 18,
  },
  {
    name: "Avocado Buddha Bowl",
    emoji: "🥗",
    cal: 380,
    price: 250,
    rating: 4.7,
    ratingCount: 185,
    type: "vegan",
    cuisine: "Continental",
    tags: ["Low-Cal", "Healthy"],
    health: 95,
    desc: "Nourishing bowl with grains, greens, and avocado",
    ingredients: [
      "Brown Rice 1 cup",
      "Avocado 1",
      "Chickpeas 100g",
      "Spinach 50g",
      "Cherry Tomatoes 8",
      "Tahini 2tbsp",
      "Lemon Juice",
      "Seeds",
    ],
    steps: [
      "Cook brown rice as per instructions",
      "Roast chickpeas with olive oil and spices at 200°C for 20 min",
      "Slice avocado and cherry tomatoes",
      "Mix tahini with lemon juice for dressing",
      "Assemble bowl with rice as base",
      "Top with all ingredients and drizzle dressing",
    ],
    protein: 18,
    carbs: 45,
    fat: 16,
  },
  {
    name: "Grilled Chicken Salad",
    emoji: "🥙",
    cal: 310,
    price: 220,
    rating: 4.6,
    ratingCount: 210,
    type: "non-veg",
    cuisine: "Continental",
    tags: ["High Protein", "Low-Cal"],
    health: 90,
    desc: "Light and filling salad with grilled chicken breast",
    ingredients: [
      "Chicken Breast 200g",
      "Mixed Greens 100g",
      "Cucumber",
      "Bell Pepper",
      "Olive Oil 1tbsp",
      "Balsamic Vinegar",
      "Salt & Pepper",
    ],
    steps: [
      "Marinate chicken in olive oil, lemon, and herbs",
      "Grill chicken for 6-7 min per side",
      "Let rest for 5 min then slice",
      "Toss greens with dressing",
      "Top with chicken and veggies",
    ],
    protein: 35,
    carbs: 12,
    fat: 11,
  },
  {
    name: "Dal Makhani",
    emoji: "🫘",
    cal: 390,
    price: 140,
    rating: 4.9,
    ratingCount: 320,
    type: "veg",
    cuisine: "Indian",
    tags: ["Budget", "Comfort"],
    health: 78,
    desc: "Slow-cooked black lentils in rich buttery gravy",
    ingredients: [
      "Black Lentils 200g",
      "Butter 30g",
      "Cream 40ml",
      "Tomatoes 2",
      "Onion 1",
      "Cumin",
      "Spices",
    ],
    steps: [
      "Soak lentils overnight and pressure cook",
      "Sauté onions in butter until caramelized",
      "Add tomatoes and cook until mushy",
      "Add lentils and simmer on low flame for 30 min",
      "Finish with cream and butter",
    ],
    protein: 16,
    carbs: 48,
    fat: 14,
  },
  {
    name: "Acai Smoothie Bowl",
    emoji: "🍇",
    cal: 280,
    price: 180,
    rating: 4.5,
    ratingCount: 150,
    type: "vegan",
    cuisine: "Brazilian",
    tags: ["Low-Cal", "Antioxidant"],
    health: 93,
    desc: "Thick acai blend topped with granola and fruits",
    ingredients: [
      "Acai Powder 2tbsp",
      "Banana 1",
      "Almond Milk 100ml",
      "Granola 30g",
      "Berries",
      "Honey 1tsp",
    ],
    steps: [
      "Blend acai powder with banana and milk until smooth",
      "Pour into bowl",
      "Top with granola, berries, and honey",
      "Serve immediately",
    ],
    protein: 8,
    carbs: 52,
    fat: 7,
  },
  {
    name: "Butter Chicken",
    emoji: "🍗",
    cal: 520,
    price: 200,
    rating: 4.9,
    ratingCount: 410,
    type: "non-veg",
    cuisine: "Indian",
    tags: ["Classic", "Comfort"],
    health: 65,
    desc: "Iconic creamy tomato sauce with tender chicken",
    ingredients: [
      "Chicken 300g",
      "Butter 40g",
      "Heavy Cream 80ml",
      "Tomato Puree 200ml",
      "Kashmiri Chili",
      "Cardamom",
      "Garam Masala",
    ],
    steps: [
      "Marinate and grill chicken pieces",
      "Make makhani sauce with tomato, butter, cream",
      "Blend sauce until smooth",
      "Add grilled chicken to sauce",
      "Simmer for 10 min and serve",
    ],
    protein: 38,
    carbs: 22,
    fat: 28,
  },
  {
    name: "Quinoa Power Bowl",
    emoji: "🌾",
    cal: 340,
    price: 260,
    rating: 4.6,
    ratingCount: 130,
    type: "vegan",
    cuisine: "Continental",
    tags: ["High Protein", "Vegan"],
    health: 91,
    desc: "Protein-rich quinoa with roasted veggies and hummus",
    ingredients: [
      "Quinoa 1 cup",
      "Hummus 3tbsp",
      "Roasted Veggies",
      "Kale",
      "Lemon Tahini Dressing",
    ],
    steps: [
      "Cook quinoa in vegetable stock",
      "Roast vegetables at 200°C for 25 min",
      "Prepare tahini dressing",
      "Assemble bowl and serve warm",
    ],
    protein: 14,
    carbs: 44,
    fat: 13,
  },
  {
    name: "Masala Oats",
    emoji: "🥣",
    cal: 240,
    price: 80,
    rating: 4.3,
    ratingCount: 95,
    type: "veg",
    cuisine: "Indian",
    tags: ["Budget", "Quick"],
    health: 85,
    desc: "Savory oats with vegetables and Indian spices",
    ingredients: [
      "Rolled Oats 100g",
      "Onion",
      "Tomato",
      "Green Chili",
      "Cumin Seeds",
      "Coriander",
      "Salt",
    ],
    steps: [
      "Heat oil and add cumin seeds",
      "Add onions and green chili, sauté",
      "Add tomatoes and spices",
      "Add oats and water, cook for 5 min",
      "Garnish with coriander",
    ],
    protein: 10,
    carbs: 38,
    fat: 5,
  },
];

const ADMIN_USER = {
  name: "Admin User",
  email: "admin@nutriai.com",
  password: "admin123456",
  role: "admin",
  age: 30,
  gender: "Male",
  activityLevel: "Moderately Active",
  goals: { dailyCalories: 2000, proteinGoal: 120, dailyBudget: 600, waterGoal: 2.5 },
};

const DEMO_USER = {
  name: "Arjun Sharma",
  email: "arjun@example.com",
  password: "demo123456",
  role: "user",
  age: 28,
  weight: 72,
  height: 175,
  gender: "Male",
  activityLevel: "Moderately Active",
  dietPreferences: ["Vegetarian"],
  goals: { dailyCalories: 2000, proteinGoal: 120, dailyBudget: 600, waterGoal: 2.5 },
  mealsLogged: 42,
  streakDays: 7,
  healthScore: 84,
};

const seed = async () => {
  try {
    await connectDB();
    console.log("🌱 Starting seed...\n");

    // Clear existing data
    await Food.deleteMany({});
    await User.deleteMany({});
    console.log("🗑️  Cleared existing Foods and Users");

    // Seed foods
    const foods = await Food.insertMany(FOODS);
    console.log(`✅ Seeded ${foods.length} foods`);

    // Seed admin user
    const admin = await User.create(ADMIN_USER);
    console.log(`✅ Admin user created: ${admin.email}`);

    // Seed demo user (with liked foods)
    const demo = await User.create({
      ...DEMO_USER,
      likedFoods: [foods[0]._id, foods[3]._id, foods[5]._id],
    });
    console.log(`✅ Demo user created: ${demo.email}`);

    console.log("\n─────────────────────────────────────");
    console.log("🎉 Seed complete!\n");
    console.log("  Admin  →  admin@nutriai.com  /  admin123456");
    console.log("  Demo   →  arjun@example.com  /  demo123456");
    console.log("─────────────────────────────────────\n");

    process.exit(0);
  } catch (err) {
    console.error("❌ Seed failed:", err.message);
    process.exit(1);
  }
};

seed();
