const express = require("express");
const router  = express.Router();

const {
  getCurrentPlan,
  getAllPlans,
  createPlan,
  updateSlot,
  removeSlot,
  autoGenerate,
  deletePlan,
} = require("../controllers/mealPlanController");

const { protect } = require("../middleware/auth");

// All meal plan routes require authentication
router.use(protect);

router.get( "/current",       getCurrentPlan);
router.post("/auto-generate", autoGenerate);
router.get( "/",              getAllPlans);
router.post("/",              createPlan);
router.put( "/:id/slot",      updateSlot);
router.delete("/:id/slot",    removeSlot);
router.delete("/:id",         deletePlan);

module.exports = router;
