import express from "express";
import passport from "passport";
import jwt from "jsonwebtoken";

const router = express.Router();
const JWT_SECRET = "PolygonGeospatial@10";

// Remove all passport.serializeUser/deserializeUser and passport.use configurations
// These should ONLY exist in index.js

// Login endpoint for username/password
router.post("/login", (req, res) => {
  const { username, password } = req.body;
  const USERS = [{ username: "admin", password: "admin1" }];

  const user = USERS.find(
    (u) => u.username === username && u.password === password
  );
  if (!user) return res.status(401).json({ message: "Invalid credentials" });

  const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: "10h" });
  res.json({ token });
});

// SAML initiation endpoint
router.get(
  "/auth/saml",
  (req, res, next) => {
    if (req.query.returnTo) {
      req.session.returnTo = req.query.returnTo;
      console.log("Setting returnTo:", req.query.returnTo);
    }
    next();
  },
  passport.authenticate("saml")
);

// SAML callback endpoint
router.post(
  "/auth/saml/callback",
  passport.authenticate("saml", { failureRedirect: "/auth/error" }),
  (req, res) => {
    try {
      if (!req.user) throw new Error("No user from SAML");

      const token = jwt.sign(
        {
          id: req.user.id,
          email: req.user.email,
          name: req.user.displayName,
        },
        JWT_SECRET,
        { expiresIn: "10h" }
      );

      const returnTo =
        req.session.returnTo ||
        "https://geospatial-ap-frontend.onrender.com/auth-callback";

      delete req.session.returnTo;

      // Critical redirect headers
      res.setHeader("Access-Control-Allow-Origin", req.headers.origin || "*");
      res.setHeader("Access-Control-Allow-Credentials", "true");
      res.setHeader("Cache-Control", "no-store");

      const redirectUrl = `${returnTo}?token=${encodeURIComponent(token)}`;
      console.log("Redirecting to:", redirectUrl);

      res.redirect(redirectUrl);
    } catch (error) {
      console.error("Callback error:", error);
      res.redirect("/auth/error?reason=callback_error");
    }
  }
);

// Error handling
router.get("/auth/error", (req, res) => {
  console.error("Auth error:", req.query.reason);
  res.status(400).json({
    error: "Authentication failed",
    reason: req.query.reason,
  });
});

// Auth check endpoint
router.get("/check-auth", (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.split(" ")[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      return res.json({ authenticated: true, user: decoded });
    } catch (err) {
      console.error("JWT verify error:", err);
    }
  }
  res.json({ authenticated: false });
});

export default router;
