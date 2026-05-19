const express = require("express");
const router = express.Router();
const taskController = require("../controllers/taskController"); 
const authMiddleware = require("../middleware/auth"); // Adjust this path to where your auth.js is stored!

router.post("/", authMiddleware, taskController.create);
router.get("/", authMiddleware, taskController.index);
router.get("/:id", authMiddleware, taskController.show);
router.patch("/:id", authMiddleware, taskController.update);
router.delete("/:id", authMiddleware, taskController.deleteTask);

module.exports = router;