const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");

router.post("/register", userController.register);
router.post("/logon", userController.logon);
router.post("/logoff", userController.logoff);

module.exports = router;