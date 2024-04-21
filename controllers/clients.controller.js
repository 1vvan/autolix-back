const pool = require('../db');


class ClientsController {
    // get
    async getAllClients (req, res) {
        try {
            const { rows } = await pool.query('SELECT * FROM clients');
            res.json(rows);
          } catch (err) {
            console.error(err.message);
            res.status(500).send(`Error, ${err.message}`);
          }
    };

    async getClientPurchases (req, res) {
      try {
        const userId = parseInt(req.params.userId);
        if (isNaN(userId)) {
          return res.status(400).send("Invalid user ID provided");
        }

        const queryText = 'SELECT * FROM get_user_purchases($1)';
        const { rows } = await pool.query(queryText, [userId]);
        res.json(rows);
      } catch (error) {
        console.error(error.message);
        res.status(500).send(`Error, ${error.message}`);
      }
    }
  }

module.exports = new ClientsController()