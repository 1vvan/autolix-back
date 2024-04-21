const Router = require('express');
const router = new Router();

const typesController = require('../controllers/types.controller');

// get
router.get('/types-info', typesController.getAllTypes)

module.exports = router;