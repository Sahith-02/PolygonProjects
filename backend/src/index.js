import express from "express";
import cors from "cors";
import session from "express-session";
import path from "path";
import { fileURLToPath } from "url";
import passport from "passport";
import { Strategy as SamlStrategy } from "passport-saml";
import jwt from "jsonwebtoken";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 5001;

// Environment variables
const {
  JWT_SECRET = "your-strong-secret-here",
  SAML_CALLBACK_URL = "https://geospatial-ap-backend.onrender.com/api/auth/saml/callback",
  SAML_ENTRY_POINT = "https://polygongeospatial.onelogin.com/trust/saml2/http-post/sso/247a0219-6e0e-4d42-9efe-98272",
  SAML_ISSUER = "https://geospatial-ap-backend.onrender.com",
  SAML_CERT = `-----BEGIN CERTIFICATE-----
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
-----END CERTIFICATE-----`,
  SESSION_SECRET = "your-session-secret",
} = process.env;

// Users for local auth
const USERS = [{ username: "admin", password: "admin1" }];

// Configure CORS
const allowedOrigins = [
  "https://geospatial-ap-frontend.onrender.com",
  "http://localhost:5173",
];

app.use(
  cors({
    origin: [
      "https://geospatial-ap-frontend.onrender.com",
      "http://localhost:5173",
    ],
    credentials: true,
    methods: "GET,POST",
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Setup session
app.use(
  session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: true, // Must be true in production
      httpOnly: true,
      sameSite: "none",
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);

// Configure Passport SAML
passport.use(
  new SamlStrategy(
    {
      callbackUrl: SAML_CALLBACK_URL,
      entryPoint: SAML_ENTRY_POINT,
      issuer: SAML_ISSUER,
      cert: SAML_CERT,
      signatureAlgorithm: "sha1",
      disableRequestedAuthnContext: true,
    },
    (profile, done) => {
      try {
        return done(null, {
          id: profile.nameID,
          email: profile.nameID,
          displayName: profile.nameID,
        });
      } catch (err) {
        return done(err);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

app.use(passport.initialize());
app.use(passport.session());
app.use(express.json());

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

  const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: "10h" });

  res.setHeader("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.json({ token });
});

// Add this with your other routes in index.js
app.get("/api/status", (req, res) => {
  res.status(200).json({
    status: "online",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});

// SAML routes
app.get(
  "/api/auth/saml",
  (req, res, next) => {
    if (req.query.returnTo) {
      req.session.returnTo = req.query.returnTo;
    }
    next();
  },
  passport.authenticate("saml", {
    failureRedirect: "/login",
    failureFlash: true,
  })
);

app.post(
  "/api/auth/saml/callback",
  passport.authenticate("saml", {
    failureRedirect: "/login",
    failureFlash: true,
  }),
  (req, res) => {
    try {
      const token = jwt.sign(
        {
          id: req.user.id,
          email: req.user.email,
        },
        JWT_SECRET,
        { expiresIn: "1h" }
      );

      const redirectUrl =
        req.session.returnTo ||
        "https://geospatial-ap-frontend.onrender.com/auth-callback";

      res.redirect(`${redirectUrl}?token=${token}`);
    } catch (err) {
      console.error("SAML callback error:", err);
      res.redirect("/login?error=saml_failed");
    }
  }
);

// Auth check route
app.get("/api/check-auth", (req, res) => {
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

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Add this at the end of your middleware setup
app.use((err, req, res, next) => {
  console.error("Server error:", err);
  res.status(500).json({
    message: "Server error occurred",
    error: process.env.NODE_ENV === "production" ? null : err.message,
  });
});
// Start the server
// At the end of index.js
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`SAML Config:`);
  console.log(`- Issuer: ${SAML_ISSUER}`);
  console.log(`- Callback: ${SAML_CALLBACK_URL}`);
  console.log(`- Entry Point: ${SAML_ENTRY_POINT}`);
});

export default app;
