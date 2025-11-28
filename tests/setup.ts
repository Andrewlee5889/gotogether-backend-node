// Jest setup file - runs before all tests
import 'dotenv/config';

// Load test environment variables
if (process.env.NODE_ENV === 'test') {
  // Allow override via .env.test if it exists
  require('dotenv').config({ path: '.env.test', override: true });
}

// Set longer timeout for integration tests
jest.setTimeout(10000);
