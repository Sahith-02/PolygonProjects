import express from "express";
import cors from "cors";
import session from "express-session";
import passport from "passport";
import { Strategy as SamlStrategy } from "passport-saml";
import jwt from "jsonwebtoken";
import { config } from "./config.js";

const app = express();

const PORT = process.env.PORT || 5001;

// Configure CORS with more permissive settings for troubleshooting
const allowedOrigins = [
  "https://geospatial-ap-frontend.onrender.com",
  "http://localhost:5173",
  "http://localhost:3000",
  "https://polygongeospatial.onelogin.com",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.log(`Origin ${origin} not allowed by CORS`);
        callback(null, true);
      }
    },
    credentials: true,
    methods: ["GET", "POST", "OPTIONS", "PUT", "DELETE"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Cache-Control",
    ],
  })
);

// Body parser middleware - IMPORTANT: Make sure this comes before passport initialization
// Increased limit for larger SAML responses
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Setup session with more secure configuration
app.use(
  session({
    secret: config.JWT_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: process.env.NODE_ENV === "production", // true in production
      httpOnly: true,
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  })
);

// Users for local auth
const USERS = [{ username: "admin", password: "admin1" }];

// Configure Passport SAML with improved error handling
passport.use(
  new SamlStrategy(
    {
      callbackUrl: config.SAML.callbackUrl,
      entryPoint: config.SAML.entryPoint,
      issuer: config.SAML.issuer,
      cert: config.SAML.cert,
      audience: config.SAML.audience,
      signatureAlgorithm: config.SAML.signatureAlgorithm,
      digestAlgorithm: config.SAML.digestAlgorithm,
      acceptedClockSkewMs: config.SAML.acceptedClockSkewMs,
      wantAssertionsSigned: config.SAML.wantAssertionsSigned,
      authnRequestBinding: config.SAML.authnRequestBinding,
      disableRequestedAuthnContext: config.SAML.disableRequestedAuthnContext,
      identifierFormat: config.SAML.identifierFormat,
      validateInResponseTo: config.SAML.validateInResponseTo,
      wantAuthnResponseSigned: config.SAML.wantAuthnResponseSigned,
      forceAuthn: config.SAML.forceAuthn,
      privateKey: config.SAML.privateKey,
      decryptionPvk: config.SAML.decryptionPvk,
    },
    (profile, done) => {
      console.log("SAML Profile received:", JSON.stringify(profile, null, 2));
      if (!profile || !profile.nameID) {
        console.error("Invalid SAML profile:", profile);
        return done(new Error("No nameID in SAML response"));
      }

      // Create user object from SAML profile
      const user = {
        id: profile.nameID,
        email: profile.nameID,
        displayName: profile.nameID || profile.email || profile.name,
        // Add any other attributes from the profile that you need
        attributes: profile.attributes || {},
      };

      return done(null, user);
    }
  )
);

passport.serializeUser((user, done) => {
  try {
    done(null, JSON.stringify(user));
  } catch (err) {
    console.error("Serialization error:", err);
    done(err);
  }
});

passport.deserializeUser((serialized, done) => {
  try {
    const user = JSON.parse(serialized);
    done(null, user);
  } catch (err) {
    console.error("Deserialization error:", err);
    done(err);
  }
});

// IMPORTANT: Initialize passport after session middleware and body parser
app.use(passport.initialize());
app.use(passport.session());

// Enable pre-flight for all routes
app.options("*", cors());

// Login route - updated with proper headers
app.post("/api/login", (req, res) => {
  const { username, password } = req.body;

  const user = USERS.find(
    (u) => u.username === username && u.password === password
  );

  if (!user) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const token = jwt.sign({ username }, config.JWT_SECRET, { expiresIn: "10h" });

  res.setHeader("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.json({ token });
});

// Handle root route
app.get("/", (req, res) => {
  res.status(200).json({
    status: "online",
    service: "Geospatial AP Backend",
    timestamp: new Date().toISOString(),
  });
});

// Status endpoint with improved debugging info
app.get("/api/status", (req, res) => {
  res.status(200).json({
    status: "online",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    samlConfig: {
      entryPoint: config.SAML.entryPoint,
      issuer: config.SAML.issuer,
      callbackUrl: config.SAML.callbackUrl,
      audience: config.SAML.audience,
      signatureAlgorithm: config.SAML.signatureAlgorithm,
      digestAlgorithm: config.SAML.digestAlgorithm,
    },
  });
});

// SAML routes with improved error handling and detailed logging
app.get(
  "/api/auth/saml",
  (req, res, next) => {
    // Store returnTo URL in session if provided
    if (req.query.returnTo) {
      req.session.returnTo = req.query.returnTo;
      console.log("Setting returnTo URL in session:", req.query.returnTo);
    }
    console.log("SAML Auth Request - Headers:", req.headers);
    console.log("SAML Auth Request - Query:", req.query);
    next();
  },
  passport.authenticate("saml", {
    failureRedirect: "/api/auth/error",
    failureFlash: true,
  })
);

// Enhanced logging for SAML callback
app.post(
  "/api/auth/saml/callback",
  (req, res, next) => {
    // Enhanced logging for better debugging
    console.log("SAML Callback - Headers:", req.headers);
    console.log("SAML Callback - Body keys:", Object.keys(req.body || {}));

    if (req.body && req.body.SAMLResponse) {
      console.log(
        "SAML Response received (length):",
        req.body.SAMLResponse.length
      );
      // Log first part of the response to check format
      const samlResponseB64 = req.body.SAMLResponse;
      console.log(
        "SAML Response start:",
        samlResponseB64.substring(0, 100) + "..."
      );

      // Verify content type
      console.log("Content-Type:", req.headers["content-type"]);
    } else {
      console.log("No SAMLResponse found in request body");
    }
    next();
  },
  passport.authenticate("saml", {
    failureRedirect: "/api/auth/error?reason=passport_authentication_failed",
    failureFlash: true,
  }),
  (req, res) => {
    console.log("SAML Authentication successful, user:", req.user);
    try {
      const token = jwt.sign(
        {
          id: req.user.id,
          email: req.user.email,
          name: req.user.displayName || req.user.email,
        },
        config.JWT_SECRET,
        { expiresIn: "10h" }
      );

      // Use stored returnTo or fall back to default
      const redirectUrl =
        req.session.returnTo ||
        "https://geospatial-ap-frontend.onrender.com/auth-callback";
      delete req.session.returnTo;

      console.log("Redirecting with token to:", redirectUrl);
      res.redirect(`${redirectUrl}?token=${token}`);
    } catch (error) {
      console.error("Token generation error:", error);
      res.redirect("/api/auth/error?reason=token_error");
    }
  }
);

// Improved SAML error handling route with detailed logging
app.get("/api/auth/error", (req, res) => {
  const reason = req.query.reason || "unknown";
  console.error("SAML Authentication failed:", reason);

  res.status(400).json({
    error: "Authentication Failed",
    reason: reason,
    message:
      "SAML authentication process failed. Please try again or contact support.",
    timestamp: new Date().toISOString(),
    supportInfo:
      "Check server logs for more details about this authentication failure.",
  });
});

// Auth check route
app.get("/api/check-auth", (req, res) => {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const token = authHeader.split(" ")[1];
    try {
      const decoded = jwt.verify(token, config.JWT_SECRET);
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

// Logout route
app.post("/api/logout", (req, res) => {
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

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Enhanced error handling middleware with more details
app.use((err, req, res, next) => {
  console.error("Error:", err);

  // Special handling for SAML errors to get more details
  if (err && err.message) {
    if (err.message.includes("SAML")) {
      console.error("SAML Error Details:", {
        name: err.name,
        message: err.message,
        stack: err.stack,
        cause: err.cause ? JSON.stringify(err.cause) : "No cause provided",
      });
    }

    // Check for signature issues specifically
    if (err.message.includes("signature")) {
      console.error("Signature validation error:", err.message);
      console.error(
        "This may indicate a mismatch between the certificate in your code and the one used by OneLogin"
      );
    }
  }

  res.status(400).json({
    error: "Request Failed",
    message: err.message || "An unknown error occurred",
    details: process.env.NODE_ENV === "production" ? null : err.message,
    stack: process.env.NODE_ENV === "production" ? null : err.stack,
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`SAML Config:`);
  console.log(`- Issuer: ${config.SAML.issuer}`);
  console.log(`- Callback: ${config.SAML.callbackUrl}`);
  console.log(`- Entry Point: ${config.SAML.entryPoint}`);
  console.log(`- Audience: ${config.SAML.audience}`);
});

export default app;
