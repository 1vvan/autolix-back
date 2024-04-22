const pool = require('../db');
const imagesController = require('./auto-images.controller')

class AutoController {
  // get
  async getAllCars(req, res) {
    try {
      const { brand_id, model_id, status_id, year_min, year_max, gearbox_type_id, engine_type_id, fuel_id, drive_unit_id } = req.query;

      const result = await pool.query(
        `SELECT * FROM get_all_autos($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [brand_id || null, model_id || null, status_id || null, year_min || null, year_max || null, gearbox_type_id || null, engine_type_id || null, fuel_id || null, drive_unit_id || null]
      );

      const carsWithUpdatedImages = result.rows.map(car => {
        if (car.images && car.images.length > 0) {
          car.images = car.images.map(imageObj => {
            return {
              id: imageObj.id,
              path: imageObj.path
            };
          });
        }
        return car;
      });

      res.json(carsWithUpdatedImages);
    } catch (err) {
      console.error(err);
      res.status(500).json({ err });
    }
  };
  async getAvailableCars(req, res) {
    try {
      const { brand_id, model_id, year_min, year_max, gearbox_type_id, engine_type_id, fuel_id, drive_unit_id } = req.query;

      const result = await pool.query(
        `SELECT * FROM get_available_autos($1, $2, $3, $4, $5, $6, $7, $8)`,
        [brand_id || null, model_id || null, year_min || null, year_max || null, gearbox_type_id || null, engine_type_id || null, fuel_id || null, drive_unit_id || null]
      );

      const carsWithUpdatedImages = result.rows.map(car => {
        if (car.images && car.images.length > 0) {
          car.images = car.images.map(imageObj => {
            return {
              id: imageObj.id,
              path: imageObj.path
            };
          });
        }
        return car;
      });

      res.json(carsWithUpdatedImages);
    } catch (err) {
      console.error(err.message);
      res.status(500).send(`Error, ${err.message}`);
    }
  };

  async getOneAuto(req, res) {
    try {
      const { id } = req.params;
      const { rows } = await pool.query('SELECT * FROM get_one_auto($1)', [id]);

      const carsWithUpdatedImages = rows.map(car => {
        if (car.images && car.images.length > 0) {
          car.images = car.images.map(imageObj => {
            return {
              id: imageObj.id,
              path: imageObj.path
            };
          });
        }
        return car;
      });

      res.json(carsWithUpdatedImages[0]);
    } catch (err) {
      console.error(err.message);
      res.status(500).send(`Error, ${err.message}`);
    }
  }


  // post
  async buyCar(req, res) {
    try {
      const { user_id, buying_price, buying_car_id, payment_method, phone, email, address } = req.body;
      await pool.query('SELECT buy_car($1, $2, $3, $4, $5, $6, $7)', [user_id, buying_price, buying_car_id, payment_method, phone, email, address]);
      res.status(200).send('Car bought successfully');
    } catch (err) {
      console.error(err.message);
      res.status(500).send(`Error, ${err.message}`);
    }
  };
  async addCar(files, req, res) {
    try {
      const { year, color, engine_type_id, engine_capacity, fuel_id, gearbox_type_id, drive_unit_id, vin, price, horse_power, model_id } = req.body;
      const result = await pool.query('SELECT add_car($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)', [year, color, engine_type_id, engine_capacity, fuel_id, gearbox_type_id, drive_unit_id, vin, price, horse_power, model_id]);
      const carId = result.rows[0].add_car;

      await imagesController.uploadCarImages(files, carId)

      res.status(200).json({ message: 'Car was added', carId: carId });
    } catch (err) {
      console.error(err.message);
      res.status(500).send(`Error, ${err.message}`);
    }
  }
  async updateAuto(req, res) {
    const { id, model_id, year, color, engine_type_id, engine_capacity, fuel_id, gearbox_type_id, drive_unit_id, vin, price, status_id, horse_power } = req.body;
    try {
      const result = await pool.query(
        `SELECT update_auto($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
        [id, model_id, year, color, engine_type_id, engine_capacity, fuel_id, gearbox_type_id, drive_unit_id, vin, price, status_id, horse_power]
      );
      res.status(200).json({ message: 'The car is successfully updated' });
    } catch (err) {
      console.error(err.message);
      res.status(500).send(`Error: ${err.message}`);
    }
  }


  //delete
  async deleteCar(req, res) {
    try {
      const car_id = req.params.carId;
      await pool.query(`DELETE FROM public.autos WHERE id = ${car_id};`);
      res.json({ message: 'Car was deleted successfuly' });
    } catch (err) {
      console.error(err.message);
      res.status(500).send(`Error, ${err.message}`);
    }
  };
}

module.exports = new AutoController()
