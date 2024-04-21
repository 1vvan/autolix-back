const Router = require('express');
const router = new Router();
const multer = require('multer');

const storage = multer.diskStorage({
    destination: function(req, file, cb) {
      cb(null, 'uploads/')
    },
    filename: function(req, file, cb) {
      cb(null, Date.now() + '-' + file.originalname)
    }
});

const upload = multer({ storage: storage });
const autoController = require('../controllers/auto.controller.js');

// get
router.get('/autos-all', autoController.getAllCars)
// router.get('/autos/available', autoController.getAvailableCars)
// router.get('/autos/:id', autoController.getOneAuto)

// post
router.post('/autos/buy', autoController.buyCar)
router.post('/autos/add', upload.array('carImages', 10), async (req, res) => {
  autoController.addCar(req, res)
});

//put
router.put('/autos/update', autoController.updateAuto)

//delete
router.delete('/autos/:carId/delete', autoController.deleteCar);

module.exports = router;