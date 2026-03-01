import { type Config } from "drizzle-kit";

export default {
  schema: "./src/server/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url:
      process.env.DATABASE_URL ||
      "postgres://postgres:password@localhost:5432/myapp",
  },
  casing: "snake_case",
  tablesFilter: ["Project_Kaizen_*"],
} satisfies Config;
