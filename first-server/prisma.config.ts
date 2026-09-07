// import "dotenv/config";  
// Removed from here — server.js loads .env before this runs locally
// On Railway, DATABASE_URL is injected directly into process.env by the platform
// Keeping dotenv here caused Railway to use placeholder URL instead of real DATABASE_URL

import { defineConfig } from "prisma/config";  // removed env import — no longer needed

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/deshmukhdb",
  },
});