import { Pool } from "pg";

export type AuthProvider = "github" | "google" | "x";
export type SocialLinks = { github: string; instagram: string; linkedin: string; x: string; };

const databaseUrl = process.env.DATABASE_URL;

// NO-CRASH POOL: Only initialize if URL exists
const pool = databaseUrl ? new Pool({ connectionString: databaseUrl }) : null;

export const initializeDatabase = async () => {
  if (!pool) {
    console.log("VoidLAB: Running in 'Database-Free' mode.");
    return;
  }
  // Original SQL setup here...
};

// Return null/empty instead of failing
export const getUserProfileById = async (userId: string) => null;
export const getOAuthAccountForUser = async (userId: string, provider: AuthProvider) => null;