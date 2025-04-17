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

// Define allowed origins
const allowedOrigins = [
  "https://geospatial-ap-frontend.onrender.com",
  "http://localhost:5173",
  "https://polygongeospatial.onelogin.com",
  "https://app.onelogin.com",
];

// Configure CORS with proper settings for SAML
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) === -1) {
        console.log("Origin rejected by CORS:", origin);
        return callback(null, true); // Allow all origins in production for SAML
      }
      return callback(null, true);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Important for SAML POST responses

// Add session support for SAML (needed in production)
if (IS_PRODUCTION) {
  // Update your session configuration
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "saml-session-secret",
      resave: false,
      saveUninitialized: true,
      cookie: {
        secure: IS_PRODUCTION, // true in production if using HTTPS
        sameSite: "none", // Add this line to allow cross-site cookies
        maxAge: 24 * 60 * 60 * 1000,
      },
    })
  );

  // Initialize passport for SAML
  app.use(passport.initialize());
  app.use(passport.session());
}

app.use("/api", tileRoutes);
app.use("/", authRoutes);
app.use("/", samlRoutes); // Add SAML routes

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Error:", err.stack);
  res.status(500).json({
    error: "Internal Server Error",
    message: err.message,
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
});

app.listen(PORT, () => {
  console.log("Server running on port", PORT);
  if (IS_PRODUCTION) {
    console.log("SAML authentication enabled");
  } else {
    console.log("Running in development mode, SAML auth disabled");
  }
});
