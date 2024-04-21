const Router = require('express');
const router = new Router();

const { uploadToS3 } = require('../config/s3-upload');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

const autoController = require('../controllers/auto.controller.js');

// get
router.get('/autos-all', autoController.getAllCars)

// post
router.post('/autos/buy', autoController.buyCar)
router.post('/autos/add', upload.array('carImages', 10), async (req, res) => {
  if (!req.files || req.files.length === 0) {
      return res.status(400).send('No files uploaded.');
  }

  const uploads = req.files.map((file) => {
      const key = `${Date.now()}-${file.originalname}`;
      return uploadToS3(file.buffer, key)
          .then((uploadResult) => ({
              status: 'Success',
              key: key,
              url: uploadResult.Location,
              bucket: uploadResult.Bucket
          }))
          .catch((error) => ({
              status: 'Failed',
              key: key,
              message: error.message
          }));
  });

  try {
      const results = await Promise.all(uploads);
      autoController.addCar(results.filter(r => r.status === 'Success'), req, res)
  } catch (error) {
      res.status(500).json({ message: "Error processing files", error: error.toString() });
  }

});

//put
router.put('/autos/update', autoController.updateAuto)

//delete
router.delete('/autos/:carId/delete', autoController.deleteCar);

module.exports = router;
