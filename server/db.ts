import { drizzle } from 'drizzle-orm/node-postgres';
import pkg from 'pg';
const { Pool } = pkg;
import * as schema from '@shared/schema';

// Create a PostgreSQL pool with environment variables
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Create a Drizzle ORM instance with our schema
export const db = drizzle(pool, { schema });