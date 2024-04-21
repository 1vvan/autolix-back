const pool = require('../db');

class TypesController {
    //get
    async getEngineTypes (req, res) {
        try {
          const { rows } = await pool.query('SELECT * FROM engine_types;');
          res.json(rows);
        } catch (err) {
          console.error(err.message);
          res.status(500).send(`Error, ${err.message}`);
        }
    }
    async getDriveUnitTypes (req, res) {
        try {
          const { rows } = await pool.query('SELECT * FROM drive_unit_types;');
          res.json(rows);
        } catch (err) {
          console.error(err.message);
          res.status(500).send(`Error, ${err.message}`);
        }
    }
    async getFuelTypes (req, res) {
        try {
          const { rows } = await pool.query('SELECT * FROM fuel_types;');
          res.json(rows);
        } catch (err) {
          console.error(err.message);
          res.status(500).send(`Error, ${err.message}`);
        }
    }
    async getGearboxTypes (req, res) {
        try {
          const { rows } = await pool.query('SELECT * FROM gearbox_types;');
          res.json(rows);
        } catch (err) {
          console.error(err.message);
          res.status(500).send(`Error, ${err.message}`);
        }
    }
    async getPaymentsMethods (req, res) {
        try {
          const { rows } = await pool.query('SELECT * FROM payment_methods;');
          res.json(rows);
        } catch (err) {
          console.error(err.message);
          res.status(500).send(`Error, ${err.message}`);
        }
    }
    async getStatusTypes (req, res) {
        try {
          const { rows } = await pool.query('SELECT * FROM status_types;');
          res.json(rows);
        } catch (err) {
          console.error(err.message);
          res.status(500).send(`Error, ${err.message}`);
        }
    }

    async getAllTypes (req, res) {
        try{
            const { rows } = await pool.query('SELECT * FROM get_all_types_info();');
            res.json(rows[0].get_all_types_info);
        } catch (err) {
            console.error(err.message);
            res.status(500).send(`Error, ${err.message}`);
        }
    }
}

module.exports = new TypesController()