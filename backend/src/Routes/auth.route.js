import express from "express";
import passport from "passport";
import jwt from "jsonwebtoken";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "PolygonGeospatial@10";

router.get(
  "/auth/saml",
  (req, res, next) => {
    // Store returnTo URL if provided
    if (req.query.returnTo) {
      req.session.returnTo = req.query.returnTo;
      console.log("Storing returnTo URL:", req.query.returnTo);
    }
    next();
  },
  passport.authenticate("saml", {
    failureRedirect: "/api/auth/error",
    additionalParams: {
      SigAlg: "http://www.w3.org/2001/04/xmldsig-more#rsa-sha256",
    },
  })
);

// SAML Callback Route with Enhanced Error Handling
router.post(
  "/auth/saml/callback",
  (req, res, next) => {
    if (!req.body?.SAMLResponse) {
      console.error("No SAMLResponse received");
      return res.status(400).json({ error: "Missing SAML response" });
    }
    console.log(
      "Received SAML response, length:",
      req.body.SAMLResponse.length
    );
    next();
  },

  passport.authenticate("saml", {
    failureRedirect: "/api/auth/error",
    failureFlash: true,
  }),

  async (req, res) => {
    try {
      if (!req.user) throw new Error("No user from SAML");

      const token = jwt.sign(
        {
          id: req.user.id,
          email: req.user.email,
          name: req.user.displayName,
        },
        JWT_SECRET,
        { expiresIn: "10h" }
      );

      const returnTo =
        req.session.returnTo ||
        "https://geospatial-ap-frontend.onrender.com/auth-callback";

      delete req.session.returnTo;

      // Critical security headers
      res.setHeader("Access-Control-Allow-Origin", req.headers.origin || "*");
      res.setHeader("Access-Control-Allow-Credentials", "true");
      res.setHeader("Cache-Control", "no-store");

      const redirectUrl = `${returnTo}?token=${encodeURIComponent(token)}`;
      console.log("Successful authentication, redirecting to:", redirectUrl);

      return res.redirect(redirectUrl);
    } catch (error) {
      console.error("Callback processing error:", error);
      return res.status(500).json({
        error: "Authentication failed",
        details: process.env.NODE_ENV === "development" ? error.message : null,
      });
    }
  }
);

// Error route
router.get("/auth/error", (req, res) => {
  const error = req.flash("error")[0] || "Unknown authentication error";
  console.error("SAML Authentication Error:", error);
  res.status(401).json({ error });
});

export default router;
