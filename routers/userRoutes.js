const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const jwtMiddleware = require('../middleware/jwtMiddleware');

router.post('/register', userController.register);
router.post('/logon', userController.logon);
router.post("/logoff", jwtMiddleware, userController.logoff);

module.exports = router;