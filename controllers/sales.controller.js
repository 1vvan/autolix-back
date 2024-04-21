const pool = require('../db');


class SalesController {
    // get
    async getSales(req, res) {
        try {
          const { sale_date_start, sale_date_end, sale_price_min, sale_price_max, payment_method_id } = req.query;
    
          const result = await pool.query(
            `SELECT * FROM get_sales_filtered($1, $2, $3, $4, $5)`,
            [sale_date_start || null, sale_date_end || null, sale_price_min || null, sale_price_max || null, payment_method_id || null]
          );
    
          res.json(result.rows);
        } catch (err) {
          console.error(err);
          res.status(500).json({ err });
        }
      }
  }

module.exports = new SalesController()