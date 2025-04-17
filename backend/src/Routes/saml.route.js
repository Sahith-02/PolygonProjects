import express from "express";
import passport from "passport";
import { Strategy as SamlStrategy } from "passport-saml";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import jwt from "jsonwebtoken";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret";
const IS_PRODUCTION = process.env.NODE_ENV === "production";

// Skip SAML in development mode
if (IS_PRODUCTION) {
  // Load certificate
  const cert = `-----BEGIN CERTIFICATE-----
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

  // SAML Strategy configuration
  const samlStrategy = new SamlStrategy(
    {
      callbackUrl:
        "https://geospatial-ap-backend.onrender.com/api/auth/saml/callback",
      entryPoint:
        "https://polygongeospatial.onelogin.com/trust/saml2/http-post/sso/247a0219-6e0e-4d42-9efe-982727b9d9f4",
      issuer: "https://geospatial-ap-backend.onrender.com",
      cert: cert,
      identifierFormat:
        "urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress",
      validateInResponseTo: false,
      disableRequestedAuthnContext: true,
    },
    (profile, done) => {
      // This function is called after successful SAML auth
      return done(null, {
        username: profile.nameID || profile.email || "samluser",
        email: profile.email,
        id: profile.nameID,
        samlUser: true,
      });
    }
  );

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
    passport.authenticate("saml", {
      successRedirect: "/",
      failureRedirect: "/api/auth/saml/failure",
    })(req, res, next);
  });

  router.post("/api/auth/saml/callback", (req, res, next) => {
    passport.authenticate("saml", (err, user) => {
      if (err) {
        console.error("SAML Auth Error:", err);
        return res.redirect(
          "https://geospatial-ap-frontend.onrender.com/login?error=saml"
        );
      }

      if (!user) {
        return res.redirect(
          "https://geospatial-ap-frontend.onrender.com/login?error=nouser"
        );
      }

      // Generate JWT token
      const token = jwt.sign({ username: user.username }, JWT_SECRET, {
        expiresIn: "10h",
      });

      // Redirect to frontend with token
      res.redirect(
        `https://geospatial-ap-frontend.onrender.com/saml/callback?token=${token}`
      );
    })(req, res, next);
  });

  router.get("/api/auth/saml/metadata", (req, res) => {
    res.type("application/xml");
    res.send(samlStrategy.generateServiceProviderMetadata());
  });

  router.get("/api/auth/saml/failure", (req, res) => {
    res.redirect(
      "https://geospatial-ap-frontend.onrender.com/login?error=saml"
    );
  });

  // SAML logout
  router.get("/api/auth/saml/logout", (req, res) => {
    res.redirect(
      "https://polygongeospatial.onelogin.com/trust/saml2/http-redirect/slo/3865085"
    );
  });
}

export default router;
