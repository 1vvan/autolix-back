const Router = require('express');
const router = new Router();

const userController = require('../controllers/user.controller');
router.post('/login', userController.loginUser)
router.post('/register', userController.registerUser)
router.get('/user/:id', userController.getUser)

module.exports = router;