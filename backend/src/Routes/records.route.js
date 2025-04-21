// backend/src/Routes/records.route.js
import express from "express";
import pkg from "pg";
const { Pool } = pkg;
import dotenv from "dotenv";
dotenv.config();

const router = express.Router();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

router.get("/records/:parcelId", async (req, res) => {
  const { parcelId } = req.params;
  try {
    const adangalQuery = `
      SELECT * FROM adangal
      WHERE "Parcel no" = $1
    `;
    const ror1bQuery = `
      SELECT * FROM ror1b
      WHERE "Parcel no" = $1
    `;

    const adangalResult = await pool.query(adangalQuery, [parcelId]);
    const ror1bResult = await pool.query(ror1bQuery, [parcelId]);

    res.json({
      parcelId,
      adangal: adangalResult.rows,
      ror1b: ror1bResult.rows,
    });
  } catch (err) {
    console.error("Error fetching records:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
