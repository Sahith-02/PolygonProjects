import express from "express";
import jwt from "jsonwebtoken";
import passport from "passport";
import { Strategy as SamlStrategy } from "passport-saml";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const router = express.Router();

// Environment variables
const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret";
const SAML_CALLBACK_URL =
  process.env.SAML_CALLBACK_URL ||
  "https://polygonprojects.onrender.com/api/auth/saml/callback";
const SAML_ENTRY_POINT = process.env.SAML_ENTRY_POINT; // OneLogin SAML 2.0 Endpoint
const SAML_ISSUER =
  process.env.SAML_ISSUER || "https://polygonprojects.onrender.com";

// The certificate you provided
const SAML_CERT = `-----BEGIN CERTIFICATE-----
MIID6DCCAtCgAwIBAgIUCptxODq6booyevMhXoQw0YXgQvkwDQYJKoZIhvcNAQEF
BQAwSTEUMBIGA1UECgwLdm5ydmppZXQuaW4xFTATBgNVBAsMDE9uZUxvZ2luIElk
UDEaMBgGA1UEAwwRT25lTG9naW4gQWNjb3VudCAwHhcNMjUwNDExMDYzMTQ3WhcN
MzAwNDExMDYzMTQ3WjBJMRQwEgYDVQQKDAt2bnJ2amlldC5pbjEVMBMGA1UECwwM
T25lTG9naW4gSWRQMRowGAYDVQQDDBFPbmVMb2dpbiBBY2NvdW50IDCCASIwDQYJ
KoZIhvcNAQEBBQADggEPADCCAQoCggEBAKEAsd3pASIWblyV1QOig9cdS+oumZ21
U4EuApcSGEcQgzeAVoy4z5QY0B/U+06OK+VbtRos3yHoiL80bzCFMuSv8lWB44rt
AwJw3p2j0hQxTieOls7A0PhBXDley2NoArqaprE1prXnnfAf19JoK5NCeRk/dN/+
hBBTQOYaoWWgdpJT8XF8mQfAaeLIOqxQ++74ZHe9fGSlJwW35K0R+uKEua5OdrVS
jDvfdtbXIAT2png7Bdc2VT5gaf0s4RtEsS6dpFTPr9Bpj4eOTBroU+meZ2mefhkp
TGaWiM6grLgalCDBN3R79RQ2v4N0ZMnhYR3121eMilDEMCOCAimaBlkCAwEAAaOB
xzCBxDAMBgNVHRMBAf8EAjAAMB0GA1UdDgQWBBSc9C4HdMHJpluHAucuvu4GCyzV
lTCBhAYDVR0jBH0we4AUnPQuB3TByaZbhwLnLr7uBgss1ZWhTaRLMEkxFDASBgNV
BAoMC3ZucnZqaWV0LmluMRUwEwYDVQQLDAxPbmVMb2dpbiBJZFAxGjAYBgNVBAMM
EU9uZUxvZ2luIEFjY291bnQgghQKm3E4OrpuijJ68yFehDDRheBC+TAOBgNVHQ8B
Af8EBAMCB4AwDQYJKoZIhvcNAQEFBQADggEBAFHLRs0lI8qNrx/x42jwmLGLv5TR
IIimDl9tClFfZHiubAAeZi+JhghpSQ7+fVWpOuJNTQr+50wUOUusBw71up4WE4Tc
y7Ji9C7Myr7FcLCEoqli5ovj0U9kUpUQKAhqPVUgftuvE2YKCBQK3IqSah1Bx4SH
irFYhqJUa7/tyFKv4BAXfnz94eqYBTYiRLjPX/OoEl1O0OeZ8W8DbgTuQtOlEd1a
ejA9oXNr6cB+nqMq4G9UDPWbKuerMEITAL0SoxkKLNgq/MuGsxOIrmP3dB0g1oWq
BKLOXLDuRH3aNklG+dbkHVDI/YBq/XRsO1OuoY3ficFxoEbZNEE7axAo0zE=
-----END CERTIFICATE-----`;

// Fallback for local development
const USERS = [{ username: "admin", password: "admin1" }];

// Check if we're in production
const isProduction = process.env.NODE_ENV === "production";

// Only set up SAML in production
if (isProduction) {
  // Configure SAML Strategy
  const samlStrategy = new SamlStrategy(
    {
      callbackUrl: SAML_CALLBACK_URL,
      entryPoint: SAML_ENTRY_POINT,
      issuer: SAML_ISSUER,
      cert: SAML_CERT,
      disableRequestedAuthnContext: true,
    },
    (profile, done) => {
      // This function gets called when SAML authentication succeeds
      return done(null, {
        id: profile.nameID,
        email: profile.nameID,
        displayName: profile.nameID,
      });
    }
  );

  passport.use(samlStrategy);

  // Passport session setup
  passport.serializeUser((user, done) => {
    done(null, user);
  });

  passport.deserializeUser((user, done) => {
    done(null, user);
  });

  router.use(passport.initialize());
  router.use(passport.session());
}

// Maintain existing login endpoint for backward compatibility
router.post("/api/login", (req, res) => {
  const { username, password } = req.body;

  const user = USERS.find(
    (u) => u.username === username && u.password === password
  );

  if (!user) return res.status(401).json({ message: "Invalid credentials" });

  const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: "10h" });

  res.json({ token });
});

// Only add SAML routes in production
if (isProduction) {
  // SAML authentication initiation endpoint
  router.get(
    "/api/auth/saml",
    (req, res, next) => {
      if (req.query.returnTo) {
        req.session.returnTo = req.query.returnTo;
      }
      next();
    },
    passport.authenticate("saml", {
      failureRedirect: "/",
      failureFlash: true,
    })
  );

  // SAML callback endpoint
  router.post(
    "/api/auth/saml/callback",
    passport.authenticate("saml", {
      failureRedirect: "/",
      failureFlash: true,
    }),
    (req, res) => {
      // Generate JWT token from SAML profile
      const token = jwt.sign(
        {
          id: req.user.id,
          email: req.user.email,
          name: req.user.displayName,
        },
        JWT_SECRET,
        { expiresIn: "10h" }
      );

      // Redirect to frontend with token
      const redirectUrl =
        req.session.returnTo || "https://indgeos.onrender.com/auth-callback";
      delete req.session.returnTo;

      res.redirect(`${redirectUrl}?token=${token}`);
    }
  );
}

// Check auth endpoint (supports both JWT and session)
router.get("/api/check-auth", (req, res) => {
  // Check for JWT token
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const token = authHeader.split(" ")[1];

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      return res.json({ authenticated: true, user: decoded });
    } catch (err) {
      // JWT failed, check session if in production
      if (isProduction && req.isAuthenticated && req.isAuthenticated()) {
        return res.json({ authenticated: true, user: req.user });
      }
    }
  } else if (isProduction && req.isAuthenticated && req.isAuthenticated()) {
    // Check for passport session if in production
    return res.json({ authenticated: true, user: req.user });
  }

  // No valid authentication found
  return res.json({ authenticated: false });
});

// Logout endpoint
router.post("/api/logout", (req, res) => {
  if (isProduction && req.logout) {
    req.logout();
  }
  res.json({ success: true });
});

export default router;
