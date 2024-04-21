const pool = require('../db');
const format = require('pg-format');

class AutoImagesController {
    async uploadCarImages(files, carId, req, res) {
        try {
            const values = files.map(file => [carId, file.path]);
            const query = format('INSERT INTO autos_images (car_id, image_path) VALUES %L RETURNING *', values);

            const dbRes = await pool.query(query);

            if (dbRes.rows.length > 0) {
                res.json({ message: 'Images are successfully uploaded and linked to the car', images: dbRes.rows });
            } else {
                res.status(404).json({ message: 'Failed to upload images' });
            }
        } catch (err) {
            console.error(err);
            res.status(500).send(`Error, ${err}`);
        }
    }

    async deleteCarImage(req, res) {
        try {
            const imgId = req.params.imgId
            const query = format(`DELETE FROM autos_images WHERE id = ${imgId};`);

            const dbRes = await pool.query(query);

            if (dbRes.rows.length > 0) {
                res.json({ message: 'Image is deleted' });
            } else {
                res.status(404).json({ message: 'Failed to delete image' });
            }
        } catch (err) {
            console.error(err);
            res.status(500).send(`Error, ${err}`);
        }
    }
}

module.exports = new AutoImagesController()