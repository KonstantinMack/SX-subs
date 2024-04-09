import "dotenv/config";
import mysql from "mysql2";

const devDb = {
  host: process.env.DEV_DB_HOST,
  user: process.env.DEV_DB_USER,
  password: process.env.DEV_DB_PASSWORD,
  database: process.env.DEV_DB_DATABASE,
  port: process.env.DEV_DB_PORT || 3306,
};

const prodDb = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  port: process.env.DB_PORT || 3306,
};

const dbConfig = process.env.NODE_ENV === "production" ? prodDb : devDb;

const connection = mysql.createPool(dbConfig);

export default connection;
