import express from "express";
import session from "express-session";
import cors from "cors";
import passport from "passport";
import authRoutes from "./Routes/auth.route.js";

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configure CORS based on environment
const corsOptions = {
  credentials: true,
  origin:
    process.env.NODE_ENV === "production"
      ? ["https://indgeos.onrender.com"]
      : "http://localhost:5173",
};
app.use(cors(corsOptions));

// Session configuration
app.use(
  session({
    secret: process.env.SESSION_SECRET || "local-dev-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 2 * 60 * 60 * 1000,
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

// Routes
app.get("/", (req, res) => {
  res.send("Geospatial backend is running");
});

app.use("/", authRoutes);

// Error handling
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(500).json({ error: err.message });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

