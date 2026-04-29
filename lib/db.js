import { Pool } from 'pg';

let pool;

export function getDbPool() {
  try {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL is not set');
    }

    if (!pool) {
      pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
      });
    }

    return pool;
  } catch (error) {
    console.error('getDbPool error:', error);
    throw error;
  }
}
