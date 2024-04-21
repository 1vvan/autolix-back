const Router = require('express');
const router = new Router();

const autoController = require('../controllers/auto.controller.js');
const typesController = require('../controllers/types.controller.js');
const modelsController = require('../controllers/models.controller');

// get
router.get('/autos-available', autoController.getAvailableCars)
router.get('/autos/:id', autoController.getOneAuto)
router.get('/autos-models', modelsController.getCarsModels)
router.get('/types-info', typesController.getAllTypes)

module.exports = router;