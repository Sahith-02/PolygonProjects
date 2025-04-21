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

  // Create SAML strategy with better debugging
  const samlOptions = {
    callbackUrl:
      "https://geospatial-ap-backend.onrender.com/api/auth/saml/callback",
    entryPoint:
      "https://polygongeospatial.onelogin.com/trust/saml2/http-post/sso/247a0219-6e0e-4d42-9efe-982727b9d9f4",
    issuer: "https://geospatial-ap-backend.onrender.com",
    cert: idpCert, // IDP's public certificate
    privateKey: spPrivateKey, // Your SP's private key
    decryptionPvk: spPrivateKey, // For decrypting encrypted assertions
    signatureAlgorithm: "sha1",
    digestAlgorithm: "sha1",
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
