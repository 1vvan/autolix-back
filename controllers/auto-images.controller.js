const pool = require('../db');
const format = require('pg-format');
const fs = require('fs');

class AutoImagesController {
    async uploadCarImages(files, carId, req, res) {
        try {
            const values = files.map(file => [carId, file.url]);
            const query = format('INSERT INTO autos_images (car_id, image_path) VALUES %L', values);
    
            await pool.query(query);
    
        } catch (err) {
            console.error(err);
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
    
            const imageUrl = selectRes.rows[0].image_path;
            const imagePath = imageUrl.replace('http://localhost:8080/uploads/', 'uploads/');
    
            fs.unlink(imagePath, (err) => {
                if (err) console.error('Failed to delete file:', err);
            });
    
            const deleteQuery = `DELETE FROM autos_images WHERE id = $1;`;
            await pool.query(deleteQuery, [imgId]);
    
            res.json({ message: 'Image deleted successfully', imageName: imagePath });
        } catch (err) {
            console.error(err);
            res.status(500).send(`Error, ${err}`);
        }
    }    
}

module.exports = new AutoImagesController()
