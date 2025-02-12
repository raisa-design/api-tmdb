import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

const pool = new Pool({
  user: process.env.USER as string,
  host: process.env.HOST as string,
  database: process.env.DATABASE as string,
  password: process.env.PASSWORD as string,
  port: process.env.PORT ? parseInt(process.env.PORT, 10) : undefined,
});

export default pool;
