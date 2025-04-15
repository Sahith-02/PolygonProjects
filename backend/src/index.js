import express from "express";
import cors from "cors";
import session from "express-session";
import passport from "passport";
import { Strategy as SamlStrategy } from "passport-saml";
import authRouter from "./Routes/auth.route.js";

const app = express();
const PORT = process.env.PORT || 5001;

// SAML Configuration
const samlConfig = {
  callbackUrl:
    "https://geospatial-ap-backend.onrender.com/api/auth/saml/callback",
  entryPoint:
    "https://polygongeospatial.onelogin.com/trust/saml2/http-post/sso/247a0219-6e0e-4d42-9efe-982727b9d9f4",
  issuer:
    "https://app.onelogin.com/saml/metadata/247a0219-6e0e-4d42-9efe-982727b9d9f4",
  cert: `-----BEGIN CERTIFICATE-----
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
  signatureAlgorithm: "sha1",
  digestAlgorithm: "sha1",
  acceptedClockSkewMs: 300000,
  wantAssertionsSigned: false,
  wantAuthnResponseSigned: false,
};

// CORS Configuration
const allowedOrigins = [
  "https://geospatial-ap-frontend.onrender.com",
  "http://localhost:5173",
];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Session Configuration
app.use(
  session({
    secret: "PolygonGeospatial@10",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);

// Passport SAML Strategy (ONLY PLACE THIS EXISTS)
passport.use(
  new SamlStrategy(samlConfig, (profile, done) => {
    if (!profile?.nameID) {
      return done(new Error("No nameID in SAML response"));
    }
    done(null, {
      id: profile.nameID,
      email: profile.nameID,
      displayName: profile.nameID,
    });
  })
);

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

// Initialize passport
app.use(passport.initialize());
app.use(passport.session());

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api", authRouter);

// Status endpoint
app.get("/api/status", (req, res) => {
  res.json({
    status: "online",
    timestamp: new Date().toISOString(),
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error("Global error:", err);
  res.status(500).json({ error: err.message });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`SAML configured for issuer: ${samlConfig.issuer}`);
});
