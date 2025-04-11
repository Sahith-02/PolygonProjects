import express from "express";
import passport from "passport";
import { Strategy as SamlStrategy } from "passport-saml";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();
const USERS = [{ username: "admin", password: "admin1" }]; // Updated static credentials

// SAML Configuration
const samlConfig = {
  path: "/api/auth/saml/callback",
  entryPoint:
    "https://polygongeospatial.onelogin.com/trust/saml2/http-post/sso/7b8d43fc-88fe-47c0-92b9-88df7983e913",
  issuer:
    process.env.NODE_ENV === "production"
      ? "https://polygonprojects.onrender.com"
      : "http://localhost:5001",
  cert:
    process.env.SAML_CERT ||
    fs.readFileSync(
      path.join(__dirname, "..", "certs", "onelogin.pem"),
      "utf8"
    ),
  validateInResponseTo: false,
  disableRequestedAuthnContext: true,
};

// Set callback URL based on environment
samlConfig.callbackUrl =
  process.env.NODE_ENV === "production"
    ? "https://polygonprojects.onrender.com/api/auth/saml/callback"
    : "http://localhost:5001/api/auth/saml/callback";

passport.use(
  "saml",
  new SamlStrategy(samlConfig, (profile, done) => {
    return done(null, {
      id: profile.nameID || profile.name_id,
      email: profile.email || profile.NameID,
      displayName: profile.displayName || profile.username || "SAML User",
    });
  })
);

// Serialization/deserialization remains the same
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

// Routes remain the same but will work in both environments
router.get("/api/test", (req, res) => {
  res.json({ message: "Auth router is working" });
});

router.get(
  "/api/auth/saml",
  passport.authenticate("saml", {
    failureRedirect: "/login",
  })
);

router.post(
  "/api/auth/saml/callback",
  passport.authenticate("saml", { failureRedirect: "/login" }),
  (req, res) => {
    req.session.user = req.user;
    const redirectUrl =
      process.env.NODE_ENV === "production"
        ? "https://indgeos.onrender.com/home"
        : "http://localhost:5173/home";
    res.redirect(redirectUrl);
  }
);

router.get("/api/check-auth", (req, res) => {
  res.json({ authenticated: !!req.session.user });
});

router.post("/api/login", (req, res) => {
  const { username, password } = req.body;
  const user = USERS.find(
    (u) => u.username === username && u.password === password
  );

  if (user) {
    req.session.user = { username };
    res.json({ success: true });
  } else {
    res.status(401).json({ message: "Invalid credentials" });
  }
});

router.post("/api/logout", (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

export default router;
