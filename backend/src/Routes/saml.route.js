// import express from "express";
// import passport from "passport";
// import { Strategy as SamlStrategy } from "passport-saml";
// import path from "path";
// import { fileURLToPath } from "url";
// import jwt from "jsonwebtoken";
// import fs from "fs";

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// const router = express.Router();
// const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret";
// const IS_PRODUCTION = process.env.NODE_ENV === "production";
// const FRONTEND_URL = "https://geospatial-ap-frontend.onrender.com";

// // Skip SAML in development mode
// if (IS_PRODUCTION) {
//   // Load certificates from files
//   const spPrivateKey = fs.readFileSync(
//     path.join(__dirname, "saml-sp.key"),
//     "utf8"
//   );
//   const spCertificate = fs.readFileSync(
//     path.join(__dirname, "saml-sp.crt"),
//     "utf8"
//   );

//   // IDP certificate (you can keep this hardcoded or load from file)
//   const idpCert = `-----BEGIN CERTIFICATE-----
// MIID6DCCAtCgAwIBAgIUCptxODq6booyevMhXoQw0YXgQvkwDQYJKoZIhvcNAQEF
// BQAwSTEUMBIGA1UECgwLdm5ydmppZXQuaW4xFTATBgNVBAsMDE9uZUxvZ2luIElk
// UDEaMBgGA1UEAwwRT25lTG9naW4gQWNjb3VudCAwHhcNMjUwNDExMDYzMTQ3WhcN
// MzAwNDExMDYzMTQ3WjBJMRQwEgYDVQQKDAt2bnJ2amlldC5pbjEVMBMGA1UECwwM
// T25lTG9naW4gSWRQMRowGAYDVQQDDBFPbmVMb2dpbiBBY2NvdW50IDCCASIwDQYJ
// KoZIhvcNAQEBBQADggEPADCCAQoCggEBAKEAsd3pASIWblyV1QOig9cdS+oumZ21
// U4EuApcSGEcQgzeAVoy4z5QY0B/U+06OK+VbtRos3yHoiL80bzCFMuSv8lWB44rt
// AwJw3p2j0hQxTieOls7A0PhBXDley2NoArqaprE1prXnnfAf19JoK5NCeRk/dN/+
// hBBTQOYaoWWgdpJT8XF8mQfAaeLIOqxQ++74ZHe9fGSlJwW35K0R+uKEua5OdrVS
// jDvfdtbXIAT2png7Bdc2VT5gaf0s4RtEsS6dpFTPr9Bpj4eOTBroU+meZ2mefhkp
// TGaWiM6grLgalCDBN3R79RQ2v4N0ZMnhYR3121eMilDEMCOCAimaBlkCAwEAAaOB
// xzCBxDAMBgNVHRMBAf8EAjAAMB0GA1UdDgQWBBSc9C4HdMHJpluHAucuvu4GCyzV
// lTCBhAYDVR0jBH0we4AUnPQuB3TByaZbhwLnLr7uBgss1ZWhTaRLMEkxFDASBgNV
// BAoMC3ZucnZqaWV0LmluMRUwEwYDVQQLDAxPbmVMb2dpbiBJZFAxGjAYBgNVBAMM
// EU9uZUxvZ2luIEFjY291bnQgghQKm3E4OrpuijJ68yFehDDRheBC+TAOBgNVHQ8B
// Af8EBAMCB4AwDQYJKoZIhvcNAQEFBQADggEBAFHLRs0lI8qNrx/x42jwmLGLv5TR
// IIimDl9tClFfZHiubAAeZi+JhghpSQ7+fVWpOuJNTQr+50wUOUusBw71up4WE4Tc
// y7Ji9C7Myr7FcLCEoqli5ovj0U9kUpUQKAhqPVUgftuvE2YKCBQK3IqSah1Bx4SH
// irFYhqJUa7/tyFKv4BAXfnz94eqYBTYiRLjPX/OoEl1O0OeZ8W8DbgTuQtOlEd1a
// ejA9oXNr6cB+nqMq4G9UDPWbKuerMEITAL0SoxkKLNgq/MuGsxOIrmP3dB0g1oWq
// BKLOXLDuRH3aNklG+dbkHVDI/YBq/XRsO1OuoY3ficFxoEbZNEE7axAo0zE=
// -----END CERTIFICATE-----`;

//   // Create SAML strategy with better debugging
//   const samlOptions = {
//     callbackUrl:
//       "https://geospatial-ap-backend.onrender.com/api/auth/saml/callback",
//     entryPoint:
//       "https://polygongeospatial.onelogin.com/trust/saml2/http-post/sso/247a0219-6e0e-4d42-9efe-982727b9d9f4",
//     issuer: "https://geospatial-ap-backend.onrender.com",
//     cert: idpCert, // IDP's public certificate
//     // privateKey: spPrivateKey, // Your SP's private key
//     // decryptionPvk: spPrivateKey, // For decrypting encrypted assertions
//     signatureAlgorithm: "sha1",
//     digestAlgorithm: "sha1",
//     identifierFormat: "urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress",
//     validateInResponseTo: false,
//     disableRequestedAuthnContext: true,
//     acceptedClockSkewMs: 5000,
//     forceAuthn: false,
//     passive: false,
//     wantAssertionsSigned: true,
//     wantAuthnResponseSigned: true,
//     wantMessageSigned: true,
//     // Additional security options
//     authnRequestBinding: "HTTP-Redirect",
//     // logoutUrl:
//     //   "https://idp.eu.safenetid.com/auth/realms/2UUO14PJ1G-STA/protocol/saml/logout",
//     additionalParams: {},
//     // Your SP's public certificate (for metadata)
//     serviceProviderCertificate: spCertificate,
//   };

//   console.log("SAML Strategy options:", JSON.stringify(samlOptions, null, 2));

//   const samlStrategy = new SamlStrategy(samlOptions, (profile, done) => {
//     console.log(
//       "SAML Authentication success, profile:",
//       JSON.stringify(profile, null, 2)
//     );

//     // Verify required claims
//     if (!profile.nameID) {
//       return done(new Error("No nameID in SAML response"));
//     }

//     return done(null, {
//       username: profile.nameID || profile.email || "samluser",
//       email: profile.email,
//       id: profile.nameID,
//       samlUser: true,
//     });
//   });

//   // Configure Passport
//   passport.use(samlStrategy);

//   passport.serializeUser((user, done) => {
//     done(null, user);
//   });

//   passport.deserializeUser((user, done) => {
//     done(null, user);
//   });

//   // Routes for SAML authentication
//   router.get("/api/auth/saml", (req, res, next) => {
//     console.log("Starting SAML authentication redirect");
//     passport.authenticate("saml", {
//       successRedirect: "/",
//       failureRedirect: "/api/auth/saml/failure",
//     })(req, res, next);
//   });

//   // Debug middleware for SAML callback
//   router.use("/api/auth/saml/callback", (req, res, next) => {
//     console.log("SAML Callback received:");
//     console.log("Body:", req.body);
//     console.log("Headers:", req.headers);
//     next();
//   });

//   router.post("/api/auth/saml/callback", (req, res, next) => {
//     console.log("Processing SAML callback");

//     passport.authenticate("saml", (err, user, info) => {
//       console.log("SAML authenticate callback triggered");

//       if (err) {
//         console.error("SAML Auth Error:", err);
//         return res.redirect(
//           `${FRONTEND_URL}/?error=saml&message=${encodeURIComponent(
//             err.message
//           )}`
//         );
//       }

//       if (!user) {
//         console.error("No user from SAML:", info);
//         return res.redirect(`${FRONTEND_URL}/?error=nouser`);
//       }

//       // Generate JWT token
//       const token = jwt.sign(
//         {
//           username: user.username,
//           email: user.email,
//           id: user.id,
//         },
//         JWT_SECRET,
//         { expiresIn: "10h" }
//       );

//       console.log("Generated token for user:", user.username);
//       return res.redirect(
//         `${FRONTEND_URL}/?token=${encodeURIComponent(token)}`
//       );
//     })(req, res, next);
//   });

//   router.get("/api/auth/saml/metadata", (req, res) => {
//     try {
//       res.type("application/xml");
//       const metadata = samlStrategy.generateServiceProviderMetadata(
//         spCertificate, // Your SP's public cert
//         spPrivateKey // Your SP's private key
//       );
//       console.log("Generated SAML metadata");
//       res.send(metadata);
//     } catch (err) {
//       console.error("Error generating metadata:", err);
//       res.status(500).send("Error generating metadata");
//     }
//   });

//   router.get("/api/auth/saml/failure", (req, res) => {
//     console.log("SAML authentication failed");
//     res.redirect(`${FRONTEND_URL}/?error=saml`);
//   });

//   // SAML logout
//   router.get("/api/auth/saml/logout", (req, res) => {
//     console.log("SAML logout requested");
//     req.logout();
//     res.redirect(
//       "https://idp.eu.safenetid.com/auth/realms/2UUO14PJ1G-STA/protocol/saml/logout"
//     );
//   });
// } else {
//   // In development mode, just add a debug endpoint
//   router.get("/api/auth/saml", (req, res) => {
//     res.status(200).json({
//       message: "SAML auth is disabled in development mode",
//       info: "Use username/password login instead",
//     });
//   });
// }

// export default router;


// import express from "express";
// import passport from "passport";
// import { Strategy as SamlStrategy } from "passport-saml";
// import path from "path";
// import { fileURLToPath } from "url";
// import jwt from "jsonwebtoken";

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// const router = express.Router();
// const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret";
// const IS_PRODUCTION = process.env.NODE_ENV === "production";
// const FRONTEND_URL = "https://geospatial-ap-frontend.onrender.com";

// // Skip SAML in development mode
// if (IS_PRODUCTION) {
//   // Load certificate
//   const cert = `-----BEGIN CERTIFICATE-----
// MIID6DCCAtCgAwIBAgIUCptxODq6booyevMhXoQw0YXgQvkwDQYJKoZIhvcNAQEF
// BQAwSTEUMBIGA1UECgwLdm5ydmppZXQuaW4xFTATBgNVBAsMDE9uZUxvZ2luIElk
// UDEaMBgGA1UEAwwRT25lTG9naW4gQWNjb3VudCAwHhcNMjUwNDExMDYzMTQ3WhcN
// MzAwNDExMDYzMTQ3WjBJMRQwEgYDVQQKDAt2bnJ2amlldC5pbjEVMBMGA1UECwwM
// T25lTG9naW4gSWRQMRowGAYDVQQDDBFPbmVMb2dpbiBBY2NvdW50IDCCASIwDQYJ
// KoZIhvcNAQEBBQADggEPADCCAQoCggEBAKEAsd3pASIWblyV1QOig9cdS+oumZ21
// U4EuApcSGEcQgzeAVoy4z5QY0B/U+06OK+VbtRos3yHoiL80bzCFMuSv8lWB44rt
// AwJw3p2j0hQxTieOls7A0PhBXDley2NoArqaprE1prXnnfAf19JoK5NCeRk/dN/+
// hBBTQOYaoWWgdpJT8XF8mQfAaeLIOqxQ++74ZHe9fGSlJwW35K0R+uKEua5OdrVS
// jDvfdtbXIAT2png7Bdc2VT5gaf0s4RtEsS6dpFTPr9Bpj4eOTBroU+meZ2mefhkp
// TGaWiM6grLgalCDBN3R79RQ2v4N0ZMnhYR3121eMilDEMCOCAimaBlkCAwEAAaOB
// xzCBxDAMBgNVHRMBAf8EAjAAMB0GA1UdDgQWBBSc9C4HdMHJpluHAucuvu4GCyzV
// lTCBhAYDVR0jBH0we4AUnPQuB3TByaZbhwLnLr7uBgss1ZWhTaRLMEkxFDASBgNV
// BAoMC3ZucnZqaWV0LmluMRUwEwYDVQQLDAxPbmVMb2dpbiBJZFAxGjAYBgNVBAMM
// EU9uZUxvZ2luIEFjY291bnQgghQKm3E4OrpuijJ68yFehDDRheBC+TAOBgNVHQ8B
// Af8EBAMCB4AwDQYJKoZIhvcNAQEFBQADggEBAFHLRs0lI8qNrx/x42jwmLGLv5TR
// IIimDl9tClFfZHiubAAeZi+JhghpSQ7+fVWpOuJNTQr+50wUOUusBw71up4WE4Tc
// y7Ji9C7Myr7FcLCEoqli5ovj0U9kUpUQKAhqPVUgftuvE2YKCBQK3IqSah1Bx4SH
// irFYhqJUa7/tyFKv4BAXfnz94eqYBTYiRLjPX/OoEl1O0OeZ8W8DbgTuQtOlEd1a
// ejA9oXNr6cB+nqMq4G9UDPWbKuerMEITAL0SoxkKLNgq/MuGsxOIrmP3dB0g1oWq
// BKLOXLDuRH3aNklG+dbkHVDI/YBq/XRsO1OuoY3ficFxoEbZNEE7axAo0zE=
// -----END CERTIFICATE-----`;

//   // Create SAML strategy with better debugging
//   const samlOptions = {
//     callbackUrl:
//       "https://geospatial-ap-backend.onrender.com/api/auth/saml/callback",
//     entryPoint:
//       "https://polygongeospatial.onelogin.com/trust/saml2/http-post/sso/247a0219-6e0e-4d42-9efe-982727b9d9f4",
//     issuer: "https://geospatial-ap-backend.onrender.com",
//     cert: cert,
//     identifierFormat: "urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress",
//     validateInResponseTo: false,
//     disableRequestedAuthnContext: true,
//     acceptedClockSkewMs: 5000, // Allow for clock skew between IdP and SP
//     forceAuthn: false,
//     passive: false,
//   };

//   console.log("SAML Strategy options:", JSON.stringify(samlOptions, null, 2));

//   const samlStrategy = new SamlStrategy(samlOptions, (profile, done) => {
//     console.log(
//       "SAML Authentication success, profile:",
//       JSON.stringify(profile, null, 2)
//     );
//     // This function is called after successful SAML auth
//     return done(null, {
//       username: profile.nameID || profile.email || "samluser",
//       email: profile.email,
//       id: profile.nameID,
//       samlUser: true,
//     });
//   });

//   // Configure Passport
//   passport.use(samlStrategy);

//   passport.serializeUser((user, done) => {
//     done(null, user);
//   });

//   passport.deserializeUser((user, done) => {
//     done(null, user);
//   });

//   // Routes for SAML authentication
//   router.get("/api/auth/saml", (req, res, next) => {
//     console.log("Starting SAML authentication redirect");
//     passport.authenticate("saml", {
//       successRedirect: "/",
//       failureRedirect: "/api/auth/saml/failure",
//     })(req, res, next);
//   });

//   // Debug middleware for SAML callback
//   router.use("/api/auth/saml/callback", (req, res, next) => {
//     console.log("SAML Callback received:");
//     console.log("Body:", req.body);
//     console.log("Headers:", req.headers);
//     next();
//   });

//   router.post("/api/auth/saml/callback", (req, res, next) => {
//     console.log("Processing SAML callback");

//     passport.authenticate("saml", (err, user, info) => {
//       console.log("SAML authenticate callback triggered");

//       if (err) {
//         console.error("SAML Auth Error:", err);
//         return res.redirect(
//           `${FRONTEND_URL}/?error=saml&message=${encodeURIComponent(
//             err.message
//           )}`
//         );
//       }

//       if (!user) {
//         console.error("No user from SAML:", info);
//         return res.redirect(`${FRONTEND_URL}/?error=nouser`);
//       }

//       // Generate JWT token
//       const token = jwt.sign({ username: user.username }, JWT_SECRET, {
//         expiresIn: "10h",
//       });
//       console.log("Generated token for user:", user.username);

//       // CHANGED: Redirect to login page with token instead of callback page
//       return res.redirect(
//         `${FRONTEND_URL}/?token=${encodeURIComponent(token)}`
//       );
//     })(req, res, next);
//   });

//   router.get("/api/auth/saml/metadata", (req, res) => {
//     try {
//       res.type("application/xml");
//       const metadata = samlStrategy.generateServiceProviderMetadata();
//       console.log("Generated SAML metadata");
//       res.send(metadata);
//     } catch (err) {
//       console.error("Error generating metadata:", err);
//       res.status(500).send("Error generating metadata");
//     }
//   });

//   router.get("/api/auth/saml/failure", (req, res) => {
//     console.log("SAML authentication failed");
//     res.redirect(`${FRONTEND_URL}/?error=saml`);
//   });

//   // SAML logout
//   router.get("/api/auth/saml/logout", (req, res) => {
//     console.log("SAML logout requested");
//     res.redirect(
//       "https://polygongeospatial.onelogin.com/trust/saml2/http-redirect/slo/3865085"
//     );
//   });
// } else {
//   // In development mode, just add a debug endpoint
//   router.get("/api/auth/saml", (req, res) => {
//     res.status(200).json({
//       message: "SAML auth is disabled in development mode",
//       info: "Use username/password login instead",
//     });
//   });
// }

// export default router;



import express from "express";
import passport from "passport";
import { Strategy as SamlStrategy } from "passport-saml";
import path from "path";
import { fileURLToPath } from "url";
import jwt from "jsonwebtoken";
//  import path from "path";
// import { fileURLToPath } from "url";
// import jwt from "jsonwebtoken";
import fs from "fs"

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret";
const IS_PRODUCTION = process.env.NODE_ENV === "production";
const FRONTEND_URL = "https://geospatial-ap-frontend.onrender.com";

// Skip SAML in development mode
if (IS_PRODUCTION) {
  // Load certificate - UPDATED with new certificate from Thalles IDP
  const cert = `-----BEGIN CERTIFICATE-----
MIID2TCCAsGgAwIBAgIUdosvx2UV1AnK3kJFpjnytpstam4wDQYJKoZIhvcNAQEL
BQAwgZQxCzAJBgNVBAYTAmluMRIwEAYDVQQIDAl0ZWxhbmdhbmExEjAQBgNVBAcM
CWh5ZGVyYWJhZDEbMBkGA1UECgwScG9seWdvbiBnZW9zcGF0aWFsMQswCQYDVQQL
DAJpdDENMAsGA1UEAwwEc2FtbDEkMCIGCSqGSIb3DQEJARYVZGV2b3BzQHBvbHln
b25nZW8uY29tMB4XDTI1MDQyMTA1NDUzMVoXDTI2MDQyMTA1NDUzMVowgZQxCzAJ
BgNVBAYTAmluMRIwEAYDVQQIDAl0ZWxhbmdhbmExEjAQBgNVBAcMCWh5ZGVyYWJh
ZDEbMBkGA1UECgwScG9seWdvbiBnZW9zcGF0aWFsMQswCQYDVQQLDAJpdDENMAsG
A1UEAwwEc2FtbDEkMCIGCSqGSIb3DQEJARYVZGV2b3BzQHBvbHlnb25nZW8uY29t
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAwFvQDk9X9nf2YBz/tUSN
qI5ofULZSziMhjGcxYiC1rQr6Ji8q79gQuNXIBranSPpKI5OHUeO8giiYNYD7sUR
+TPO19NJiPCQjmyoBYzd748NzEBoJb0OGKufr3fFWi3Q/DV5j4ig8xLQclaAw1HM
ZYwDQdNjBTEfeDCubIaJvWCJ6o46J0AzifJ3OOdpwjv+0AVq8WXcZifTIdIO+BGB
nETOyJYuqddfnsmqA1xNeMeh9yqZwvkBnXJghpdfPqzPXOeKaeB4O94kk9twr6j5
RQhsRm9tTiIlYpdzmgdl9X+0kq8h+/F7f9HU/cm8y70rfTu4X9RBVQrkIXONOTPJ
IwIDAQABoyEwHzAdBgNVHQ4EFgQU7Szp1mU1qgggQe+YbyyVfmT8DJYwDQYJKoZI
hvcNAQELBQADggEBAE//6W8P/fHYSSNoSCDgBwHctb3G8tksCJCso4xa4dd/cTWl
hz55u3RsmnN73F7OUEMzieHAxQ9lPY+Jd1HRb/Iq5okOommCWktuW8oNsf0DN3K7
UZsUkM+qQcPp1l76dhLp9+8atVpDwlCVut+Gx2a+nVMpE854ywzwy/qGdfBBaUc8
clP0Mh1rIWrtN1Cx0qE0I0MU5ped7OetzuHkCt3YlmCW/kPuBLlgq0webNO8iwOS
+oyaD7BDEyaBJgATJO8Zpg4YQ7YHvGh7xVaq5b0F9FrwBQcqQ/tTzgUscO9tXbHs
aoM+L9wZt6sqbmS5Z+PKoa5zRYF5l3zBL6236b0=
-----END CERTIFICATE-----`;

  const spPrivateKey = fs.readFileSync(
    path.join(__dirname, "saml-sp.key"),
    "utf8"
  );
  // Create SAML strategy with better debugging
  const samlOptions = {
    callbackUrl:
      "https://geospatial-ap-backend.onrender.com/api/auth/saml/callback",
    // UPDATED with new SingleSignOnService URL from Thalles IDP
    entryPoint:
      "https://idp.eu.safenetid.com/auth/realms/2UUO14PJ1G-STA/protocol/saml",
    // UPDATED with new Issuer/Entity ID from Thalles IDP
    issuer: "https://idp.eu.safenetid.com/auth/realms/2UUO14PJ1G-STA",
    cert: cert,
    identifierFormat: "urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress",
    validateInResponseTo: false,
    disableRequestedAuthnContext: true,
    acceptedClockSkewMs: 5000, // Allow for clock skew between IdP and SP
    forceAuthn: false,
    passive: false,
    privateKey: spPrivateKey,
  };

  console.log("SAML Strategy options:", JSON.stringify(samlOptions, null, 2));

  const samlStrategy = new SamlStrategy(samlOptions, (profile, done) => {
    console.log(
      "SAML Authentication success, profile:",
      JSON.stringify(profile, null, 2)
    );
    // This function is called after successful SAML auth
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
      const token = jwt.sign({ username: user.username }, JWT_SECRET, {
        expiresIn: "10h",
      });
      console.log("Generated token for user:", user.username);

      // CHANGED: Redirect to login page with token instead of callback page
      return res.redirect(
        `${FRONTEND_URL}/?token=${encodeURIComponent(token)}`
      );
    })(req, res, next);
  });

  router.get("/api/auth/saml/metadata", (req, res) => {
    try {
      res.type("application/xml");
      const metadata = samlStrategy.generateServiceProviderMetadata();
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
    // NOTE: You may need to update this logout URL with the correct one from Thalles IDP
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