import postgres from "postgres";

const url = process.env.DATABASE_URL;

if (!url) {
  console.warn("[diary] DATABASE_URL not set — diary features will be unavailable");
}

export const sql = url ? postgres(url, { onnotice: () => {} }) : null;

export const hasDb = (): boolean => sql !== null;
