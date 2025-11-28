const { Client } = require("pg");

async function createTestDatabase() {
  // Connect to default postgres database
  const client = new Client({
    user: "gotogether_dev_user",
    password: "supersecretpassword",
    host: "localhost",
    port: 5432,
    database: "postgres", // Connect to default database
  });

  try {
    await client.connect();
    console.log("Connected to PostgreSQL");

    // Check if database exists
    const checkQuery = "SELECT 1 FROM pg_database WHERE datname = 'gotogether_test'";
    const result = await client.query(checkQuery);

    if (result.rows.length === 0) {
      // Database doesn't exist, create it
      await client.query("CREATE DATABASE gotogether_test");
      console.log("✅ Created gotogether_test database");
    } else {
      console.log("ℹ️  gotogether_test database already exists");
    }
  } catch (err) {
    console.error("❌ Error:", err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

createTestDatabase();
