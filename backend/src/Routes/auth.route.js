import express from "express";
import passport from "passport";
import jwt from "jsonwebtoken";

const router = express.Router();

// Environment configuration
const JWT_SECRET = "PolygonGeospatial@10";
const USERS = [{ username: "admin", password: "admin1" }];

// Local login endpoint
router.post("/login", (req, res) => {
  const { username, password } = req.body;

  const user = USERS.find(
    (u) => u.username === username && u.password === password
  );

  if (!user) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: "10h" });

  res.json({ token });
});

// SAML authentication initiation
router.get(
  "/auth/saml",
  (req, res, next) => {
    if (req.query.returnTo) {
      req.session.returnTo = req.query.returnTo;
      console.log("Setting returnTo URL:", req.query.returnTo);
    }
    next();
  },
  passport.authenticate("saml", {
    failureRedirect: "/api/auth/error",
    failureFlash: true,
  })
);

// SAML callback handler
router.post(
  "/auth/saml/callback",
  (req, res, next) => {
    console.log("SAML callback received");
    if (req.body && req.body.SAMLResponse) {
      console.log("SAML Response length:", req.body.SAMLResponse.length);
    }
    next();
  },
  passport.authenticate("saml", {
    failureRedirect: "/api/auth/error",
    failureFlash: true,
  }),
  (req, res) => {
    try {
      const token = jwt.sign(
        {
          id: req.user.id,
          email: req.user.email,
          name: req.user.displayName || req.user.email,
        },
        JWT_SECRET,
        { expiresIn: "10h" }
      );

      const redirectUrl =
        req.session.returnTo ||
        "https://geospatial-ap-frontend.onrender.com/auth-callback";

      delete req.session.returnTo;

      res.redirect(`${redirectUrl}?token=${token}`);
    } catch (error) {
      console.error("Token generation error:", error);
      res.redirect("/api/auth/error?reason=token_error");
    }
  }
);

// Authentication status check
router.get("/check-auth", (req, res) => {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const token = authHeader.split(" ")[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      return res.json({ authenticated: true, user: decoded });
    } catch (err) {
      console.log("JWT verification failed:", err.message);
      if (req.isAuthenticated && req.isAuthenticated()) {
        return res.json({ authenticated: true, user: req.user });
      }
    }
  } else if (req.isAuthenticated && req.isAuthenticated()) {
    return res.json({ authenticated: true, user: req.user });
  }

  return res.json({ authenticated: false });
});

// Logout endpoint
router.post("/logout", (req, res) => {
  if (req.logout) {
    req.logout(function (err) {
      if (err) {
        console.log("Logout error:", err);
        return res.status(500).json({ success: false, error: err.message });
      }
      res.json({ success: true });
    });
  } else {
    res.json({ success: true });
  }
});

// Error handler for auth routes
router.get("/auth/error", (req, res) => {
  const reason = req.query.reason || "unknown";
  console.error("Authentication failed:", reason);

  res.status(400).json({
    error: "Authentication Failed",
    reason: reason,
    message: "Authentication process failed. Please try again.",
    timestamp: new Date().toISOString(),
  });
});

export default router;

