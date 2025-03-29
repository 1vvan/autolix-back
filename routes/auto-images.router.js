const Router = require('express');
const router = new Router();

const multer = require('multer');

const autoImagesController = require('../controllers/auto-images.controller');
const upload = require('../middleware/upload');

router.post('/autos/:carId/images', upload.array('images', 10), async (req, res) => {
    const carId = req.params.carId;

    if (!req.files || req.files.length === 0) {
        return res.status(400).send('No files uploaded.');
    }

    const baseUrl = 'http://localhost:8080/uploads/';
    const filePaths = req.files.map(file => ({
        url: baseUrl + file.filename
    }));

    try {
        await autoImagesController.uploadCarImages(filePaths, carId);
        res.json({ message: 'Images uploaded successfully', images: filePaths });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error saving image paths', error: error.toString() });
    }
});

router.delete('/autos/images/:imgId/delete', autoImagesController.deleteCarImage);

module.exports = router;
