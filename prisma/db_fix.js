const { Client } = require('pg');
const dotenv = require('dotenv');
dotenv.config();

async function run() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to database.');
    
    const res = await client.query("UPDATE \"User\" SET role = 'ACCOUNT_MANAGER' WHERE role = 'FINANCE'");
    console.log(`Successfully updated ${res.rowCount} users from FINANCE to ACCOUNT_MANAGER.`);
    
  } catch (err) {
    console.error('Error executing query:', err);
  } finally {
    await client.end();
  }
}

run();
