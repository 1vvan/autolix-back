const Router = require('express');
const router = new Router();

const salesController = require('../controllers/sales.controller');

// get
router.get('/sales', salesController.getSales)


module.exports = router;