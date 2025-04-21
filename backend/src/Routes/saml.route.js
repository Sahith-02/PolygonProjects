import express from "express";
import passport from "passport";
import { Strategy as SamlStrategy } from "passport-saml";
import path from "path";
import { fileURLToPath } from "url";
import jwt from "jsonwebtoken";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret";
const IS_PRODUCTION = process.env.NODE_ENV === "production";
const FRONTEND_URL = "https://geospatial-ap-frontend.onrender.com";

// Skip SAML in development mode
if (IS_PRODUCTION) {
  // Load certificates from files
  const spPrivateKey = fs.readFileSync(
    path.join(__dirname, "saml-sp.key"),
    "utf8"
  );
  const spCertificate = fs.readFileSync(
    path.join(__dirname, "saml-sp.crt"),
    "utf8"
  );

  // IDP certificate (you can keep this hardcoded or load from file)
  const idpCert = `-----BEGIN CERTIFICATE-----
MIICqzCCAZMCBgGWSJt8fjANBgkqhkiG9w0BAQsFADAZMRcwFQYDVQQDDA4yVVVP
MTRQSjFHLVNUQTAeFw0yNTA0MTgxMTEyNTFaFw0zNTA0MTgxMTE0MzFaMBkxFzAV
BgNVBAMMDjJVVU8xNFBKMUctU1RBMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIB
CgKCAQEA6Xz+jVxL6AwLRHQgTKiBhabhubBBKKQK1mdP5EtNuR/MVo4BtskEZDTU
bzvVvvPqB8ufUIxUUu3zgxp3z8FHc1b6i9I82knC2BTPupWOMr52wh3Onhp3F/lh
K4RzTE88sMlwmnkMMUavrQKAkwtsuXNQdwKRQlpuwfdPRujH8ZoCCafOo9c1MLCH
NZvbe4uiaK8UQJKJaiZ4gQ8Ss6upDbacQWJcY5IrIzeB3hRDqKAnt2zYMs/V42QU
LzpHU1sDkjicFNdPxdGjnHkeEi6YQORBywc2+llM7Jv0zVrBbrpBF3/ZJjfszepM
76ZG8tMBtfiU3xzwKUTfMNFdJnOT6QIDAQABMA0GCSqGSIb3DQEBCwUAA4IBAQBm
qkcsmgghXk1Yq6ASW9SVDRApkCepm8z69AkF/myUVJAMNgzKmEAq6nTd7kI84Z0J
3lqoyrYSv7HNUhmwvPWBU5g2sLmqlNQU7cH0DAO3yHv5Q/aplI8ZBN1vpEyCNQcs
7CyHNRcp6yhnfHq5dHtQAjyarlmfDgqi/KItlmCtCnn0iViv3ccIpXRK5hbHXCAi
d2rqf7qpmv9n3nrvQ5U9s7aKDz6qIs6DWK4JQcVbbZ4aB27/8J92GKUE0ifBUkPN
9Vkkul52Q2fBcQls1o6QLUzUUnIaKKQMIBMBB3SQAkMfbwbXuKDHVWRLqbDtzRYK
HZP3t2G8KLhk6LfUbTmO
-----END CERTIFICATE-----`;

  // Create SAML strategy with better debugging
  const samlOptions = {
    callbackUrl:
      "https://geospatial-ap-backend.onrender.com/api/auth/saml/callback",
    entryPoint:
      "https://idp.eu.safenetid.com/auth/realms/2UUO14PJ1G-STA/protocol/saml",
    issuer: "https://idp.eu.safenetid.com/auth/realms/2UUO14PJ1G-STA",
    cert: idpCert, // IDP's public certificate
    privateKey: spPrivateKey, // Your SP's private key
    decryptionPvk: spPrivateKey, // For decrypting encrypted assertions
    signatureAlgorithm: "sha256",
    digestAlgorithm: "sha256",
    identifierFormat: "urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress",
    validateInResponseTo: false,
    disableRequestedAuthnContext: true,
    acceptedClockSkewMs: 5000,
    forceAuthn: false,
    passive: false,
    wantAssertionsSigned: true,
    wantAuthnResponseSigned: true,
    wantMessageSigned: true,
    // Additional security options
    authnRequestBinding: "HTTP-Redirect",
    logoutUrl:
      "https://idp.eu.safenetid.com/auth/realms/2UUO14PJ1G-STA/protocol/saml/logout",
    additionalParams: {},
    // Your SP's public certificate (for metadata)
    serviceProviderCertificate: spCertificate,
  };

  console.log("SAML Strategy options:", JSON.stringify(samlOptions, null, 2));

  const samlStrategy = new SamlStrategy(samlOptions, (profile, done) => {
    console.log(
      "SAML Authentication success, profile:",
      JSON.stringify(profile, null, 2)
    );

    // Verify required claims
    if (!profile.nameID) {
      return done(new Error("No nameID in SAML response"));
    }

    return done(null, {
      username: profile.nameID || profile.email || "samluser",
      email: profile.email,
      id: profile.nameID,
      samlUser: true,
    });
  });

  // Configure Passport
  passport.use(samlStrategy);

  passport.serializeUser((user, done) => {
    done(null, user);
  });

  passport.deserializeUser((user, done) => {
    done(null, user);
  });

  // Routes for SAML authentication
  router.get("/api/auth/saml", (req, res, next) => {
    console.log("Starting SAML authentication redirect");
    passport.authenticate("saml", {
      successRedirect: "/",
      failureRedirect: "/api/auth/saml/failure",
    })(req, res, next);
  });

  // Debug middleware for SAML callback
  router.use("/api/auth/saml/callback", (req, res, next) => {
    console.log("SAML Callback received:");
    console.log("Body:", req.body);
    console.log("Headers:", req.headers);
    next();
  });

  router.post("/api/auth/saml/callback", (req, res, next) => {
    console.log("Processing SAML callback");

    passport.authenticate("saml", (err, user, info) => {
      console.log("SAML authenticate callback triggered");

      if (err) {
        console.error("SAML Auth Error:", err);
        return res.redirect(
          `${FRONTEND_URL}/?error=saml&message=${encodeURIComponent(
            err.message
          )}`
        );
      }

      if (!user) {
        console.error("No user from SAML:", info);
        return res.redirect(`${FRONTEND_URL}/?error=nouser`);
      }

      // Generate JWT token
      const token = jwt.sign(
        {
          username: user.username,
          email: user.email,
          id: user.id,
        },
        JWT_SECRET,
        { expiresIn: "10h" }
      );

      console.log("Generated token for user:", user.username);
      return res.redirect(
        `${FRONTEND_URL}/?token=${encodeURIComponent(token)}`
      );
    })(req, res, next);
  });

  router.get("/api/auth/saml/metadata", (req, res) => {
    try {
      res.type("application/xml");
      const metadata = samlStrategy.generateServiceProviderMetadata(
        spCertificate, // Your SP's public cert
        spPrivateKey // Your SP's private key
      );
      console.log("Generated SAML metadata");
      res.send(metadata);
    } catch (err) {
      console.error("Error generating metadata:", err);
      res.status(500).send("Error generating metadata");
    }
  });

  router.get("/api/auth/saml/failure", (req, res) => {
    console.log("SAML authentication failed");
    res.redirect(`${FRONTEND_URL}/?error=saml`);
  });

  // SAML logout
  router.get("/api/auth/saml/logout", (req, res) => {
    console.log("SAML logout requested");
    req.logout();
    res.redirect(
      "https://idp.eu.safenetid.com/auth/realms/2UUO14PJ1G-STA/protocol/saml/logout"
    );
  });
} else {
  // In development mode, just add a debug endpoint
  router.get("/api/auth/saml", (req, res) => {
    res.status(200).json({
      message: "SAML auth is disabled in development mode",
      info: "Use username/password login instead",
    });
  });
}

export default router;
