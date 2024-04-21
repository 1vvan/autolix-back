const pool = require('../db');


class ModelsController {
    // get
    async getCarsModels(req, res) {
        try {
            const models = await pool.query('SELECT * FROM autos_models');
            const brands = await pool.query('SELECT * FROM autos_brands');
            res.json({ models: models.rows, brands: brands.rows });
        } catch (err) {
            console.error(err.message);
            res.status(500).send(`Error, ${err.message}`);
        }
    };

    // post
    async addBrand(req, res) {
        try {
            const newBrand = await pool.query(
                'INSERT INTO autos_brands (name) VALUES ($1) RETURNING *',
                [req.body.name,]
            );
            res.send({ message: 'Brand was added successfuly', brand: newBrand.rows[0] });
        } catch (err) {
            console.error(err.message);
            res.status(500).send(`Error, ${err.message}`);
        }
    }
    async addModel(req, res) {
        try {
            const newModel = await pool.query(
                'INSERT INTO autos_models (brand_id, name) VALUES ($1, $2) RETURNING *',
                [req.body.brand_id, req.body.name,]
            );
            res.send({ message: 'Model was added successfuly', model: newModel.rows[0] });
        } catch (err) {
            console.error(err.message);
            res.status(500).send(`Error, ${err.message}`);
        }
    }

    //delete
    async deleteModel(req, res) {
        try {
            const modelId = req.params.modelId;
            await pool.query(`DELETE FROM public.autos_models WHERE id = ${modelId};`);
            res.json({ message: 'Model was deleted successfuly' });
        } catch (err) {
            console.error(err.message);
            res.status(500).send(`Error, ${err.message}`);
        }
    };

    async deleteBrand(req, res) {
        try {
            const brandId = req.params.brandId;
            await pool.query(`DELETE FROM autos_models WHERE brand_id = ${brandId};`);
            await pool.query(`DELETE FROM autos_brands WHERE id = ${brandId};`)
            res.json({ message: 'Model was deleted successfuly' });
        } catch (err) {
            console.error(err.message);
            res.status(500).send(`Error, ${err.message}`);
        }
    };
}

module.exports = new ModelsController()