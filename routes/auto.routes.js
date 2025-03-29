const Router = require('express');
const router = new Router();

const autoController = require('../controllers/auto.controller.js');
const upload = require('../middleware/upload.js');

// get
router.get('/autos-all', autoController.getAllCars)

// post
router.post('/autos/buy', autoController.buyCar)
router.post('/autos/add', upload.array('carImages', 10), async (req, res) => {
    if (!req.files || req.files.length === 0) {
        return res.status(400).send('No files uploaded.');
    }

    const baseUrl = 'http://localhost:8080/uploads/';
    const filePaths = req.files.map(file => ({
        url: baseUrl + file.filename
    }));

    try {
        await autoController.addCar(filePaths, req, res);
    } catch (error) {
        res.status(500).json({ message: "Error processing files", error: error.toString() });
    }
});

//put
router.put('/autos/update', autoController.updateAuto)

//delete
router.delete('/autos/:carId/delete', autoController.deleteCar);

module.exports = router;
