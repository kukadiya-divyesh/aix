import pkg from 'pg';
const { Client } = pkg;

import dotenv from 'dotenv';
dotenv.config();
console.log("DB URL:", process.env.DATABASE_URL);
// Attempt to connect to the 'postgres' default database first to create the custom one
const baseUrl = process.env.DATABASE_URL.replace(/\/aix_inventory(\?.*|)$/, '/postgres$1');
const client = new Client({ connectionString: baseUrl });

async function init() {
  try {
    await client.connect();
    console.log('Connected to default postgres database.');

    // Check if aix_inventory exists
    const res = await client.query("SELECT 1 FROM pg_database WHERE datname='aix_inventory'");

    if (res.rowCount === 0) {
      console.log('Database "aix_inventory" not found. Creating it...');
      await client.query('CREATE DATABASE aix_inventory');
      console.log('Database "aix_inventory" created successfully.');
    } else {
      console.log('Database "aix_inventory" already exists.');
    }
  } catch (err) {
    console.error('FAILED TO CONNECT TO POSTGRES:', err.message);
    console.log('\n--- Troubleshooting ---');
    console.log('1. Ensure PostgreSQL is running on Port 5432.');
    console.log('2. Check if username "postgres" and password "postgres" are correct.');
    console.log('3. If you have a different password, update backend/.env then run this again.');
  } finally {
    await client.end();
  }
}

init();
