import express from "express";
import cors from "cors";
import session from "express-session";
import passport from "passport";
import { Strategy as SamlStrategy } from "passport-saml";
import authRouter from "./Routes/auth.route.js"; // Import the auth router

const app = express();
const PORT = process.env.PORT || 5001;

// Environment Configuration
const config = {
  JWT_SECRET: "PolygonGeospatial@10",
  SAML: {
    callbackUrl:
      process.env.SAML_CALLBACK_URL ||
      "https://geospatial-ap-backend.onrender.com/api/auth/saml/callback",
    entryPoint:
      process.env.SAML_ENTRY_POINT ||
      "https://polygongeospatial.onelogin.com/trust/saml2/http-post/sso/247a0219-6e0e-4d42-9efe-982727b9d9f4",
    issuer:
      process.env.SAML_ISSUER ||
      "https://app.onelogin.com/saml/metadata/247a0219-6e0e-4d42-9efe-982727b9d9f4",
    cert:
      process.env.SAML_CERT ||
      `-----BEGIN CERTIFICATE-----
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
    audience: "https://geospatial-ap-backend.onrender.com",
    signatureAlgorithm: "sha256",
    digestAlgorithm: "sha256",
    acceptedClockSkewMs: 300000,
    wantAssertionsSigned: true,
    authnRequestBinding: "HTTP-POST",
    disableRequestedAuthnContext: true,
    identifierFormat: null,
    validateInResponseTo: false,
  },
};

// CORS Configuration
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
        callback(null, true); // Still allow for troubleshooting
      }
    },
    credentials: true,
    methods: ["GET", "POST", "OPTIONS", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  })
);

// Session Configuration
app.use(
  session({
    secret: "PolygonGeospatial@100",
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);

// Body Parsers
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true, limit: "5mb" }));

// Passport Configuration
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
      wantAuthnResponseSigned: true,
      forceAuthn: false,
      providerName: "OneLogin",
      decryptionPvk: null,
      privateKey: null,
    },
    (profile, done) => {
      console.log("SAML Profile received:", JSON.stringify(profile, null, 2));
      if (!profile || !profile.nameID) {
        console.error("Invalid SAML profile:", profile);
        return done(new Error("No nameID in SAML response"));
      }

      const user = {
        id: profile.nameID,
        email: profile.nameID,
        displayName: profile.nameID || profile.email || profile.name,
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

app.use(passport.initialize());
app.use(passport.session());

// Mount auth routes
app.use("/api", authRouter);

// Enable pre-flight for all routes
app.options("*", cors());

// Basic status endpoint
app.get("/", (req, res) => {
  res.status(200).json({
    status: "online",
    service: "Geospatial AP Backend",
    timestamp: new Date().toISOString(),
  });
});

// Error Handling
app.use((err, req, res, next) => {
  console.error("Error:", err);

  if (err && err.message) {
    if (err.message.includes("SAML")) {
      console.error("SAML Error Details:", {
        name: err.name,
        message: err.message,
        stack: err.stack,
        cause: err.cause ? JSON.stringify(err.cause) : "No cause provided",
      });
    }

    if (err.message.includes("signature")) {
      console.error("Signature validation error:", err.message);
      console.error("This may indicate a certificate mismatch with OneLogin");
    }
  }

  res.status(400).json({
    error: "Request Failed",
    message: err.message || "An unknown error occurred",
    details: process.env.NODE_ENV === "production" ? null : err.message,
    stack: process.env.NODE_ENV === "production" ? null : err.stack,
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`SAML Config:`);
  console.log(`- Issuer: ${config.SAML.issuer}`);
  console.log(`- Callback: ${config.SAML.callbackUrl}`);
  console.log(`- Entry Point: ${config.SAML.entryPoint}`);
  console.log(`- Audience: ${config.SAML.audience}`);
  console.log(`- Cert: ${config.SAML.cert.substring(0, 50)}...`);
});

export default app;
