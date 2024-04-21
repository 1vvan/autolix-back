const pool = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

class UserController {
    async registerUser (req, res) {
        const { email, password, full_name } = req.body;

        try {
            const hashedPassword = await bcrypt.hash(password, 10);
            const newUser = await pool.query(
                'INSERT INTO users (email, password, full_name) VALUES ($1, $2, $3) RETURNING *',
                [email, hashedPassword, full_name]
            );
            const token = jwt.sign(
                { userId: newUser.rows[0].id, email: newUser.rows[0].email, isAdmin: newUser.rows[0].is_admin },
                process.env.JWT_SECRET,
                { expiresIn: '1d' }
            );
    
            res.json({user: newUser.rows[0], token: token});
        } catch (err) {
            console.error(err.message);
            res.status(500).send(err.message);
        }
    };

    async loginUser (req, res) {
        const { email, password } = req.body;
        try {
            const user = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
            if (user.rows.length === 0) {
                return res.status(401).send('Email or password is incorrect');
            }
    
            const isValidPassword = await bcrypt.compare(password, user.rows[0].password);
            if (!isValidPassword) {
                return res.status(401).send('Email or password is incorrect');
            }

            const token = jwt.sign(
                { userId: user.rows[0].id, email: user.rows[0].email, isAdmin: user.rows[0].is_admin },
                process.env.JWT_SECRET,
                { expiresIn: '1d' }
            );
    
            res.json({user: user.rows[0], token: token});
        } catch (err) {
            console.error(err.message);
            res.status(500).send(err.message);
        }
    };

    async getUser(req, res) {
        const { id } = req.params;
        try {
            const user = await pool.query('SELECT id, full_name, email, is_admin FROM users WHERE id = $1', [id]);
    
            if (user.rows.length === 0) {
                return res.status(404).json({ message: "User not found" });
            }
    
            res.json(user.rows[0]);
        } catch (err) {
            console.error(err.message);
            res.status(500).send(err.message);
        }
    }
    
}

module.exports = new UserController()
