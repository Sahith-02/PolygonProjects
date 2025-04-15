import express from "express";
import cors from "cors";
import session from "express-session";
import passport from "passport";
import { Strategy as SamlStrategy } from "passport-saml";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import authRouter from "./Routes/auth.route.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 5001;

// 1. Load OneLogin metadata
const metadataPath = path.join(__dirname, "config", "onelogin_metadata.xml");
if (!fs.existsSync(metadataPath)) {
  console.error("Missing OneLogin metadata at:", metadataPath);
  process.exit(1);
}

// 2. SAML Configuration (must match OneLogin exactly)
const samlConfig = {
  callbackUrl:
    "https://geospatial-ap-backend.onrender.com/api/auth/saml/callback",
  entryPoint:
    "https://polygongeospatial.onelogin.com/trust/saml2/http-post/sso/247a0219-6e0e-4d42-9efe-982727b9d9f4",
  issuer:
    "https://app.onelogin.com/saml/metadata/247a0219-6e0e-4d42-9efe-982727b9d9f4",
  cert: fs.readFileSync(metadataPath, "utf8"),
  signatureAlgorithm: "sha256",
  digestAlgorithm: "sha256",
  acceptedClockSkewMs: 60000,
  wantAuthnResponseSigned: false,
  wantAssertionsSigned: false,
  identifierFormat: "urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress",
  disableRequestedAuthnContext: true,
  authnRequestBinding: "HTTP-POST",
  decryptionPvk: null,
  privateKey: null,
};

// 3. CORS Configuration
const allowedOrigins = [
  "https://geospatial-ap-frontend.onrender.com",
  "http://localhost:5173",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn(`Blocked by CORS: ${origin}`);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// 4. Session Configuration
app.use(
  session({
    secret: process.env.SESSION_SECRET || "PolygonGeospatial@10",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  })
);

// 5. Enhanced SAML Strategy with validation
passport.use(
  new SamlStrategy(samlConfig, (profile, done) => {
    try {
      if (!profile?.nameID) {
        throw new Error("No nameID in SAML response");
      }

      // Validate required claims
      if (!profile.issuer || profile.issuer !== samlConfig.issuer) {
        throw new Error("Invalid SAML issuer");
      }

      const user = {
        id: profile.nameID,
        email: profile.nameID,
        displayName: profile.nameID,
        sessionIndex: profile.sessionIndex,
        issuer: profile.issuer,
      };

      console.log("SAML User Profile:", user);
      done(null, user);
    } catch (err) {
      console.error("SAML Profile Error:", err);
      done(err);
    }
  })
);

// 6. Serialization/Deserialization
passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

// 7. Middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(passport.initialize());
app.use(passport.session());

// 8. Request logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  if (req.body?.SAMLResponse) {
    console.log(
      "SAML Response (truncated):",
      req.body.SAMLResponse.substring(0, 100) + "..."
    );
  }
  next();
});

// 9. Routes
app.use("/api", authRouter);

// 10. Status endpoint
app.get("/api/status", (req, res) => {
  res.json({
    status: "online",
    time: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    saml: {
      issuer: samlConfig.issuer,
      initialized: !!passport._strategy("saml"),
    },
  });
});

// 11. Error handling
app.use((err, req, res, next) => {
  console.error("Global Error:", err);

  if (err.message.includes("SAML")) {
    res.status(400).json({
      error: "SAML Authentication Failed",
      details: process.env.NODE_ENV === "production" ? null : err.message,
    });
  } else {
    res.status(500).json({
      error: "Internal Server Error",
      details: process.env.NODE_ENV === "production" ? null : err.stack,
    });
  }
});

// 12. Server startup
app.listen(PORT, () => {
  console.log(`
  Server running on port ${PORT}
  Environment: ${process.env.NODE_ENV || "development"}
  SAML Configuration:
    - Issuer: ${samlConfig.issuer}
    - Callback: ${samlConfig.callbackUrl}
    - Entry Point: ${samlConfig.entryPoint}
  Current Time: ${new Date()}
  `);
});

export default app;
