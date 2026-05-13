const express = require("express");
const router = express.Router();
const taskController = require("../controllers/taskController");

router.post("/", taskController.createTask);
router.get("/", taskController.index);
router.patch("/:id", taskController.updateTask);
router.delete("/:id", taskController.deleteTask);
router.get("/:id", taskController.show);

module.exports = router;