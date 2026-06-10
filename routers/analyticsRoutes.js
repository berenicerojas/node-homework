const express = require("express");
const router = express.Router();
const analyticsController = require("../controllers/analyticsController");
const jwtMiddleware = require("../middleware/jwtMiddleware");

router.use(jwtMiddleware);
router.get("/", analyticsController.getUserAnalytics); 
router.get("/users-stats", analyticsController.getUsersWithStats);
router.get("/search", analyticsController.searchTasks);

module.exports = router;