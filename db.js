const { Pool } = require('pg');
const pool = new Pool({
  user: 'upu5i5g3317pn',
  host: 'c6b7lkfdshud3i.cluster-czz5s0kz4scl.eu-west-1.rds.amazonaws.com',
  database: 'd5fflrr95enrt9',
  password: 'p7f789680a5e1f5708049de63a355ea5730e0af858ce793db8cfe4f69368d1d0c',
  port: 5432,
  ssl: {
        rejectUnauthorized: false
    }
});

module.exports = pool;
