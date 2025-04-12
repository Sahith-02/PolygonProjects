import express from "express";
import session from "express-session";
import cors from "cors";
import passport from "passport";
import authRoutes from "./Routes/auth.route.js";
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

app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use(express.urlencoded({ extended: true })); // Needed for SAML POST callbacks

// Configure SAML authentication
configureSaml(app);
setupSamlRoutes(app);

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

