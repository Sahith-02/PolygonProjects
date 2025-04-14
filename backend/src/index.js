import express from "express";
import cors from "cors";
import session from "express-session";
import authRoutes from "./Routes/auth.route.js";
import tileRoutes from "./Routes/tiles.route.js";
import path from "path";
import MBTiles from "@mapbox/mbtiles";

const app = express();
const PORT = process.env.PORT || 5001;

const allowedOrigins = [
  "https://geospatial-ap-frontend.onrender.com",
  "http://localhost:5173",
];

app.use(
  cors({
    origin: [
      "https://geospatial-ap-frontend.onrender.com",
      "http://localhost:5173",
    ],
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// Session middleware (required for Passport SAML)
app.use(
  session({
    secret: process.env.SESSION_SECRET || "saml-secret-key",
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: process.env.NODE_ENV === "production", // Set to true in production
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  })
);

app.use(express.json());
app.use("/api", tileRoutes);

// Auth routes should come after session middleware
app.use("/", authRoutes);

app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
