import express from "express";
import cors from "cors";
import session from "express-session";
import passport from "passport";
import authRoutes from "./Routes/auth.route.js";
import samlRoutes from "./Routes/saml.route.js";
import tileRoutes from "./Routes/tiles.route.js";
import path from "path";
import MBTiles from "@mapbox/mbtiles";

const app = express();
const PORT = process.env.PORT || 5001;
const IS_PRODUCTION = process.env.NODE_ENV === "production";

const allowedOrigins = [
  "https://geospatial-ap-frontend.onrender.com",
  "http://localhost:5173",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

app.use(express.json());

// Add session support for SAML (only needed in production)
if (IS_PRODUCTION) {
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "saml-session-secret",
      resave: false,
      saveUninitialized: true,
      cookie: { secure: true },
    })
  );

  // Initialize passport for SAML
  app.use(passport.initialize());
  app.use(passport.session());
}

app.use("/api", tileRoutes);
app.use("/", authRoutes);
app.use("/", samlRoutes); // Add SAML routes

app.listen(PORT, () => {
  console.log("Server running on port", PORT);
  if (IS_PRODUCTION) {
    console.log("SAML authentication enabled");
  } else {
    console.log("Running in development mode, SAML auth disabled");
  }
});
