require('dotenv').config();
const { Pool } = require('pg');

const isProduction = process.env.CONFIG === 'production';

const pool = new Pool({
  user: isProduction ? process.env.PROD_DB_USER : process.env.LOCAL_DB_USER,
  host: isProduction ? process.env.PROD_DB_HOST : process.env.LOCAL_DB_HOST,
  database: isProduction ? process.env.PROD_DB_DATABASE : process.env.LOCAL_DB_DATABASE,
  password: isProduction ? process.env.PROD_DB_PASSWORD : process.env.LOCAL_DB_PASSWORD,
  port: isProduction ? process.env.PROD_DB_PORT : process.env.LOCAL_DB_PORT,
  ssl: isProduction ? { rejectUnauthorized: false } : undefined
});

module.exports = pool;
