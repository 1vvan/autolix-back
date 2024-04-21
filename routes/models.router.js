const Router = require('express');
const router = new Router();

const modelsController = require('../controllers/models.controller');

// post
router.post('/brands/add', modelsController.addBrand)
router.post('/models/add', modelsController.addModel)

//delete
router.delete('/brands/:brandId/delete', modelsController.deleteBrand)
router.delete('/models/:modelId/delete', modelsController.deleteModel)

module.exports = router;