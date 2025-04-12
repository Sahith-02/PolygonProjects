// saml-middleware.js
import { Strategy as SamlStrategy } from "passport-saml";
import passport from "passport";
import path from "path";
import fs from "fs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret";

// Only enable SAML in production
const isSamlEnabled = process.env.NODE_ENV === "production";

export const configureSaml = (app) => {
  if (!isSamlEnabled) {
    console.log("SAML auth disabled - not in production mode");
    return;
  }

  // Configure passport with SAML strategy
  passport.use(
    new SamlStrategy(
      {
        path: "/api/auth/saml/callback",
        entryPoint: process.env.SAML_ENTRY_POINT, // From OneLogin
        issuer: process.env.SAML_ISSUER || "polygonprojects-saml", // Your entity ID
        cert: process.env.SAML_CERT, // X.509 certificate from OneLogin
        validateInResponseTo: true,
        disableRequestedAuthnContext: true,
      },
      (profile, done) => {
        // Transform OneLogin profile to user object
        return done(null, {
          username:
            profile.nameID ||
            profile.email ||
            profile[
              "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"
            ],
          email:
            profile.email ||
            profile[
              "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"
            ],
          name:
            profile.displayName ||
            profile[
              "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"
            ],
        });
      }
    )
  );

  // Serialize/deserialize user for session management
  passport.serializeUser((user, done) => {
    done(null, user);
  });

  passport.deserializeUser((user, done) => {
    done(null, user);
  });

  // Initialize passport middleware
  app.use(passport.initialize());
};

// Routes for SAML authentication
export const setupSamlRoutes = (app) => {
  if (!isSamlEnabled) {
    return;
  }

  // Initiate SAML authentication
  app.get("/api/auth/saml", (req, res, next) => {
    const { returnUrl } = req.query;
    if (returnUrl) {
      req.session = req.session || {};
      req.session.returnUrl = returnUrl;
    }

    passport.authenticate("saml", {
      failureRedirect: "/",
      failureFlash: true,
    })(req, res, next);
  });

  // Handle SAML callback
  app.post(
    "/api/auth/saml/callback",
    passport.authenticate("saml", { failureRedirect: "/", failureFlash: true }),
    (req, res) => {
      if (!req.user) {
        return res.status(401).send("Authentication failed");
      }

      // Generate JWT token, similar to your existing login
      const token = jwt.sign(
        {
          username: req.user.username,
          email: req.user.email,
          name: req.user.name,
        },
        JWT_SECRET,
        { expiresIn: "10h" }
      );

      // Redirect to frontend with token
      const frontendUrl = "https://indgeos.onrender.com";
      const returnUrl = req.session?.returnUrl || "/saml-success";

      res.redirect(`${frontendUrl}${returnUrl}?token=${token}`);
    }
  );

  // Metadata endpoint for OneLogin configuration
  app.get("/api/auth/saml/metadata", (req, res) => {
    const strategy = passport._strategies.saml;
    if (strategy) {
      res.type("application/xml");
      res.send(strategy.generateServiceProviderMetadata());
    } else {
      res.status(500).send("SAML strategy not initialized");
    }
  });
};
