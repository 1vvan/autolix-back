const Router = require('express');
const router = new Router();

const { uploadToS3 } = require('../config/s3-upload');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

const autoImagesController = require('../controllers/auto-images.controller');

router.post('/autos/:carId/images', upload.array('images', 10), async (req, res) => {
  const carId = req.params.carId;

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
      autoImagesController.uploadCarImages(results.filter(r => r.status === 'Success'), carId, req, res);
  } catch (error) {
      res.status(500).json({ message: "Error processing files", error: error.toString() });
  }
});
router.delete('/autos/images/:imgId/delete', autoImagesController.deleteCarImage);

module.exports = router;
