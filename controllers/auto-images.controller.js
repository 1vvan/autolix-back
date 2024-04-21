const pool = require('../db');
const format = require('pg-format');
const { deleteFromS3 } = require('../config/s3-upload');

class AutoImagesController {
    async uploadCarImages(files, carId, req, res) {
        try {
            const values = files.map(file => [carId, file.url]);
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
        const imgId = req.params.imgId;
    
        try {
            const selectQuery = `SELECT image_path FROM autos_images WHERE id = $1;`;
            const selectRes = await pool.query(selectQuery, [imgId]);
    
            if (selectRes.rows.length === 0) {
                return res.status(404).json({ message: 'Image not found' });
            }
    
            let imagePath = selectRes.rows[0].image_path;

            const baseUrl = 'https://autolix.s3.eu-north-1.amazonaws.com/';
            if (imagePath.startsWith(baseUrl)) {
                imagePath = imagePath.substring(baseUrl.length);
            }
    
            await deleteFromS3(imagePath);
    
            const deleteQuery = `DELETE FROM autos_images WHERE id = $1;`;
            const deleteRes = await pool.query(deleteQuery, [imgId]);
    
            if (deleteRes.rowCount > 0) {
                res.json({ message: 'Image deleted successfully', imageName: imagePath });
            } else {
                res.status(404).json({ message: 'Failed to delete image record' });
            }
        } catch (err) {
            console.error(err);
            res.status(500).send(`Error, ${err}`);
        }
    }
}

module.exports = new AutoImagesController()
