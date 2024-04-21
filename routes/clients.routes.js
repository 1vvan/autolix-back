const Router = require('express');
const router = new Router();

const clientsController = require('../controllers/clients.controller');

// get
router.get('/clients', clientsController.getAllClients)
router.get('/clients/:userId/purchases', clientsController.getClientPurchases)

module.exports = router;