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

const autoImagesController = require('../controllers/auto-images.controller');

// get
router.post('/autos/:carId/images', upload.array('images', 10), (req, res) => {
    const carId = req.params.carId;
    autoImagesController.uploadCarImages(req.files, carId, req, res);
});
router.delete('/autos/images/:imgId/delete', autoImagesController.deleteCarImage);

module.exports = router;