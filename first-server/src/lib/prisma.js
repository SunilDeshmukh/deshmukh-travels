// Prisma 7.10 requires a driver adapter — new PrismaClient() alone won't work
const { PrismaClient } = require('@prisma/client');
const { PrismaPg }     = require('@prisma/adapter-pg');

// Create the pg adapter — reads DATABASE_URL from process.env
// dotenv.config() in server.js already loaded .env before this file runs
const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

// Pass the adapter to PrismaClient — this is what 7.10 requires
const prisma = new PrismaClient({ adapter });

module.exports = prisma;