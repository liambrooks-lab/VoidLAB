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

// Satisfies imports in other controllers
export const getUserProfileById = async (_id: string) => ({ name: "VoidLAB User" });
export const getOAuthAccountForUser = async (_id: string, _p: AuthProvider) => ({ accessToken: "temp" });
export const upsertOAuthUser = async (_i: any) => ({ created: false, profile: { id: "temp" } });
export const createOrUpdateManualUser = async (_i: any) => ({ created: false, profile: { id: "temp" } });
export const updateUserProfile = async (_id: string, _p: any) => ({ id: "temp" });