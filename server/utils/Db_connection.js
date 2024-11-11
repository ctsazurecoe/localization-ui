import sqlPackage from 'mssql';
import config from '../db_config.js';

const { connect } = sqlPackage;
let pool;

async function getConnection() {
  if (!pool) {
    try {
      pool = await connect(config);
    } catch (err) {
      console.error('Database connection failed:', err);
      throw err;
    }
  }
  return pool;
}

async function closeConnection() {
  if (pool) {
    try {
      await pool.close();
    } catch (err) {
      console.error('Error closing connection pool:', err);
      throw err;
    } finally {
      pool = undefined;
    }
  }
}

export { closeConnection, getConnection };
