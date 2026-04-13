import { Pool } from "pg";

export type AuthProvider = "github" | "google" | "x";
export type SocialLinks = { github: string; instagram: string; linkedin: string; x: string; };

const databaseUrl = process.env.DATABASE_URL;
const pool = databaseUrl ? new Pool({ connectionString: databaseUrl }) : null;

export const initializeDatabase = async () => {
  if (!pool) {
    console.warn("VoidLAB: Running without database. Persistence is disabled.");
    return;
  }
};

// Placeholder exports to satisfy existing controller imports
export const getUserProfileById = async (_id: string) => null;
export const getOAuthAccountForUser = async (_id: string, _p: AuthProvider) => null;
export const upsertOAuthUser = async (_i: any) => ({ created: false, profile: {} });
export const createOrUpdateManualUser = async (_i: any) => ({ created: false, profile: {} });
export const updateUserProfile = async (_id: string, _p: any) => null;