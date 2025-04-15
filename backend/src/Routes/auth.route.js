import express from "express";
import jwt from "jsonwebtoken";
import passport from "passport";
import { Strategy as SamlStrategy } from "passport-saml";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const router = express.Router();

// Environment variables - ensure these match exactly with OneLogin configuration
const JWT_SECRET = "PolygonGeospatial@10";
const SAML_CALLBACK_URL =
  "https://geospatial-ap-backend.onrender.com/api/auth/saml/callback";
const SAML_ENTRY_POINT =
  "https://polygongeospatial.onelogin.com/trust/saml2/http-post/sso/247a0219-6e0e-4d42-9efe-982727b9d9f4";
const SAML_ISSUER =
  "https://app.onelogin.com/saml/metadata/247a0219-6e0e-4d42-9efe-982727b9d9f4";

// The certificate from OneLogin exactly as provided
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

// Configure Passport SAML Strategy with updated parameters
passport.use(
  new SamlStrategy(
    {
      callbackUrl: SAML_CALLBACK_URL,
      entryPoint: SAML_ENTRY_POINT,
      issuer: SAML_ISSUER,
      cert: SAML_CERT,
      disableRequestedAuthnContext: true,
      audience: "https://geospatial-ap-backend.onrender.com",
      // Match OneLogin configuration - Using SHA-1
      signatureAlgorithm: "sha1",
      digestAlgorithm: "sha1",
      identifierFormat: null,
      acceptedClockSkewMs: 300000, // 5 minutes clock skew
      validateInResponseTo: false,
      wantAuthnResponseSigned: false,
      wantAssertionsSigned: false,
      authnRequestBinding: "HTTP-POST",
      decryptionPvk: null,
      privateKey: null,
      forceAuthn: false,
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

  const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: "10h" });

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

// SAML callback endpoint with enhanced error handling
router.post(
  "/auth/saml/callback",
  (req, res, next) => {
    // Debug logging
    console.log("SAML Callback - Headers:", req.headers);
    console.log("SAML Callback - Body keys:", Object.keys(req.body || {}));

    if (req.body?.SAMLResponse) {
      console.log(
        "Received SAMLResponse (truncated):",
        req.body.SAMLResponse.substring(0, 100) + "..."
      );
    }
    next();
  },
  passport.authenticate("saml", {
    failureRedirect: "/api/auth/error",
    failureFlash: true,
  }),
  (req, res) => {
    try {
      console.log("SAML Authentication successful, user:", req.user);

      if (!req.user) {
        throw new Error("No user data received from SAML");
      }

      const token = jwt.sign(
        {
          id: req.user.id,
          email: req.user.email,
          name: req.user.displayName,
        },
        JWT_SECRET,
        { expiresIn: "10h" }
      );

      // Get redirect URL from session or use default
      const returnTo =
        req.session.returnTo ||
        "https://geospatial-ap-frontend.onrender.com/auth-callback";

      // Remove sensitive session data
      delete req.session.returnTo;

      // **************** CRITICAL SECTION START ****************
      // Set CORS headers
      res.setHeader("Access-Control-Allow-Origin", req.headers.origin || "*");
      res.setHeader("Access-Control-Allow-Credentials", "true");
      res.setHeader("Cache-Control", "no-store");

      // URL encode the token
      const encodedToken = encodeURIComponent(token);
      const redirectUrl = `${returnTo}?token=${encodedToken}`;

      console.log(`Final Redirect URL: ${redirectUrl}`);
      // **************** CRITICAL SECTION END ****************

      // Perform the redirect
      res.redirect(redirectUrl);
    } catch (error) {
      console.error("SAML Callback Error:", error);
      res.redirect(
        `/api/auth/error?reason=${encodeURIComponent(error.message)}`
      );
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
      const decoded = jwt.verify(token, JWT_SECRET);
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
