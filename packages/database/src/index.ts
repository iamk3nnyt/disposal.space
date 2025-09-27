import { neon } from "@neondatabase/serverless";
import * as dotenv from "dotenv";
import { drizzle } from "drizzle-orm/neon-http";

// Load environment variables
dotenv.config();

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql);

// Export schema
export * from "./db/schema";
