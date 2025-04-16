import express from "express";
import jwt from "jsonwebtoken";
import passport from "passport";
import { Strategy as SamlStrategy } from "passport-saml";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { config } from "./config.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const router = express.Router();

// Configure Passport SAML Strategy using values from config.js
passport.use(
  new SamlStrategy(
    {
      callbackUrl: config.SAML.callbackUrl,
      entryPoint: config.SAML.entryPoint,
      issuer: config.SAML.issuer,
      cert: config.SAML.cert,
      disableRequestedAuthnContext: config.SAML.disableRequestedAuthnContext,
      audience: config.SAML.audience,
      signatureAlgorithm: config.SAML.signatureAlgorithm,
      digestAlgorithm: config.SAML.digestAlgorithm,
      identifierFormat: config.SAML.identifierFormat,
      acceptedClockSkewMs: config.SAML.acceptedClockSkewMs,
      validateInResponseTo: config.SAML.validateInResponseTo,
      wantAuthnResponseSigned: config.SAML.wantAssertionsSigned,
      wantAssertionsSigned: config.SAML.wantAssertionsSigned,
      authnRequestBinding: config.SAML.authnRequestBinding,
      decryptionPvk: config.SAML.decryptionPvk,
      privateKey: config.SAML.privateKey,
      forceAuthn: config.SAML.forceAuthn,
    },
    (profile, done) => {
      // Log the profile for debugging
      console.log(
        "Auth route SAML profile received:",
        JSON.stringify(profile, null, 2)
      );

      // This function gets called when SAML authentication succeeds
      if (!profile || !profile.nameID) {
        console.error("Invalid SAML profile received:", profile);
        return done(new Error("Invalid SAML profile: No nameID in response"));
      }

      return done(null, {
        id: profile.nameID,
        email: profile.nameID,
        displayName: profile.nameID || profile.email || profile.name,
      });
    }
  )
);

// Fallback for local development
const USERS = [{ username: "admin", password: "admin1" }];

// Passport session setup
passport.serializeUser((user, done) => {
  done(null, JSON.stringify(user));
});

passport.deserializeUser((serialized, done) => {
  try {
    const user = JSON.parse(serialized);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

router.use(passport.initialize());

// Login endpoint for username/password auth
router.post("/login", (req, res) => {
  const { username, password } = req.body;

  const user = USERS.find(
    (u) => u.username === username && u.password === password
  );

  if (!user) return res.status(401).json({ message: "Invalid credentials" });

  const token = jwt.sign({ username }, config.JWT_SECRET, { expiresIn: "10h" });

  res.json({ token });
});

// SAML authentication initiation endpoint with better debugging
router.get(
  "/auth/saml",
  (req, res, next) => {
    if (req.query.returnTo) {
      req.session.returnTo = req.query.returnTo;
      console.log("Setting returnTo:", req.query.returnTo);
    }
    console.log("Router SAML auth request - Headers:", req.headers);
    console.log("Router SAML auth request - Query:", req.query);
    next();
  },
  passport.authenticate("saml", {
    failureRedirect: "/api/auth/error",
    failureFlash: true,
  })
);

// SAML callback endpoint with enhanced error handling and debugging
router.post(
  "/auth/saml/callback",
  (req, res, next) => {
    // Enhanced debug logging for SAML callback
    console.log(
      "SAML callback received with body keys:",
      Object.keys(req.body || {})
    );

    if (req.body && req.body.SAMLResponse) {
      console.log("SAML Response length:", req.body.SAMLResponse.length);
      // Additional debug info
      console.log("Content-Type:", req.headers["content-type"]);
      console.log("Accept header:", req.headers["accept"]);
    } else {
      console.log("No SAMLResponse in body");
    }
    next();
  },
  passport.authenticate("saml", {
    failureRedirect: "/api/auth/error",
    failureFlash: true,
  }),
  (req, res) => {
    // Generate JWT token from SAML profile
    console.log("SAML auth successful, user:", req.user);

    try {
      if (!req.user) {
        throw new Error("No user data received from SAML authentication");
      }

      const token = jwt.sign(
        {
          id: req.user.id,
          email: req.user.email,
          name: req.user.displayName,
        },
        config.JWT_SECRET,
        { expiresIn: "10h" }
      );

      // Get redirect URL from session or use default
      let returnTo =
        req.session.returnTo ||
        "https://geospatial-ap-frontend.onrender.com/auth-callback";
      delete req.session.returnTo;

      // Ensure returnTo is properly formatted
      if (!returnTo.includes("http")) {
        returnTo = `https://geospatial-ap-frontend.onrender.com${returnTo}`;
      }

      // Make sure token is properly URL encoded
      const encodedToken = encodeURIComponent(token);
      const redirectUrl = `${returnTo}?token=${encodedToken}`;

      console.log("Redirecting to:", redirectUrl);

      // Set appropriate CORS headers
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Credentials", "true");

      // Perform redirect
      res.redirect(303, redirectUrl);
    } catch (error) {
      console.error("JWT token generation error:", error);
      res.redirect("/api/auth/error?reason=token_generation_failed");
    }
  }
);

// New route for handling authentication errors with more detailed error messages
router.get("/auth/error", (req, res) => {
  const reason = req.query.reason || "unknown";
  console.error("Router SAML Authentication failed:", reason);

  // Set CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Credentials", "true");

  res.status(400).json({
    error: "Authentication Failed",
    reason: reason,
    message:
      "SAML authentication process failed. Please try again or contact support.",
    timestamp: new Date().toISOString(),
    help: "Check the server logs for more detailed error information.",
  });
});

// Check auth endpoint (supports both JWT and session)
router.get("/check-auth", (req, res) => {
  // Check for JWT token
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const token = authHeader.split(" ")[1];

    try {
      const decoded = jwt.verify(token, config.JWT_SECRET);
      return res.json({ authenticated: true, user: decoded });
    } catch (err) {
      console.error("JWT verification failed:", err.message);
      // JWT failed, check session
      if (req.isAuthenticated && req.isAuthenticated()) {
        return res.json({ authenticated: true, user: req.user });
      }
    }
  } else if (req.isAuthenticated && req.isAuthenticated()) {
    // Check for passport session
    return res.json({ authenticated: true, user: req.user });
  }

  // No valid authentication found
  return res.json({ authenticated: false });
});

// Logout endpoint
router.post("/logout", (req, res) => {
  if (req.logout) {
    req.logout(function (err) {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ success: false, error: err.message });
      }
      res.json({ success: true });
    });
  } else {
    res.json({ success: true });
  }
});

export default router;
