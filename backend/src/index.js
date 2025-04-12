import express from "express";
import cors from "cors";
import authRoutes from "./Routes/auth.route.js";
import tileRoutes from "./Routes/tiles.route.js";
import path from "path";
import MBTiles from "@mapbox/mbtiles";
import session from "express-session";
import {
  configureSaml,
  setupSamlRoutes,
} from "../middleware/saml-middleware.js";

const app = express();
const PORT = process.env.PORT || 5001;

const allowedOrigins = [
  "https://indgeos.onrender.com",
  "http://localhost:5173",
];

app.use(
  cors({
    origin: ["https://indgeos.onrender.com", "http://localhost:5173"],
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// Session middleware is needed for SAML
app.use(
  session({
    secret: process.env.SESSION_SECRET || "session-secret",
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Needed for SAML POST callbacks

// Configure SAML authentication
configureSaml(app);
setupSamlRoutes(app);

app.use("/api", tileRoutes);
app.use("/", authRoutes);

app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
