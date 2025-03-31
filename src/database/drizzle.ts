import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import config from "@/lib/config";

const { env: { databaseUrl } } =config;

const sql = neon(databaseUrl);

export const db = drizzle({ client: sql });
