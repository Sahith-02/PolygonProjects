import express from 'express';
import cors from 'cors';
import session from 'express-session';
import passport from 'passport';
import { Strategy as SamlStrategy } from 'passport-saml';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';


const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 5001;

const certPaths = [
  path.join(__dirname, "config", "saml-cert.pem"),
  path.join(__dirname, "saml-cert.pem"),
  path.join(process.cwd(), "config", "saml-cert.pem"),
];
let samlCert;
for (const certPath of certPaths) {
  try {
    samlCert = fs.readFileSync(certPath, "utf8");
    console.log(`Found SAML certificate at: ${certPath}`);
    break;
  } catch (err) {
    continue;
  }
}
if (!samlCert) {
  if (process.env.SAML_CERT) {
    console.log("Using SAML certificate from environment variable");
    samlCert = process.env.SAML_CERT;
  } else {
    throw new Error(
      "SAML certificate not found. Please either:\n" +
        "1. Place saml-cert.pem in ./config or ./ directory\n" +
        "2. Set SAML_CERT environment variable\n" +
        "Checked paths:\n" +
        certPaths.join("\n")
    );
  }
}

// Load SAML config from environment
const samlConfig = {
  callbackUrl: process.env.SAML_CALLBACK_URL || "https://geospatial-ap-backend.onrender.com/api/auth/saml/callback",
  entryPoint: process.env.SAML_ENTRY_POINT || "https://polygongeospatial.onelogin.com/trust/saml2/http-post/sso/247a0219-6e0e-4d42-9efe-982727b9d9f4",
  issuer: process.env.SAML_ISSUER || "https://app.onelogin.com/saml/metadata/247a0219-6e0e-4d42-9efe-982727b9d9f4",
  cert: samlCert,
  signatureAlgorithm: 'sha256',
  digestAlgorithm: 'sha256',
  acceptedClockSkewMs: 60000,
  wantAuthnResponseSigned: false,
  wantAssertionsSigned: false
};

// Enhanced CORS
app.use(cors({
  origin: [
    "https://geospatial-ap-frontend.onrender.com",
    "http://localhost:5173"
  ],
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS']
}));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-strong-secret-here',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 24 * 60 * 60 * 1000
  }
}));

// SAML Strategy with enhanced error handling
passport.use(new SamlStrategy(samlConfig, 
  (profile, done) => {
    try {
      if (!profile?.nameID) {
        throw new Error('No nameID in SAML response');
      }
      
      const user = {
        id: profile.nameID,
        email: profile.nameID,
        displayName: profile.nameID,
        sessionIndex: profile.sessionIndex
      };
      
      console.log('SAML Authentication Success:', user);
      return done(null, user);
    } catch (err) {
      console.error('SAML Profile Error:', err);
      return done(err);
    }
  }
));

// Passport serialization
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(passport.initialize());
app.use(passport.session());

// Import routes with error handling
let authRouter;
try {
  const modulePath = new URL('./Routes/auth.route.js', import.meta.url).pathname;
  authRouter = (await import(modulePath)).default;
} catch (err) {
  console.error('Failed to load auth routes:', err);
  process.exit(1);
}

// Routes
app.use('/api', authRouter);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({ 
    error: 'Internal Server Error',
    details: process.env.NODE_ENV === 'development' ? err.message : null
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('SAML Config:', {
    issuer: samlConfig.issuer,
    callbackUrl: samlConfig.callbackUrl
  });
});