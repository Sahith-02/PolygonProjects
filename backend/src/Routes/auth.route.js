import express from "express";
import jwt from "jsonwebtoken";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret";
const USERS = [{ username: "admin", password: "AdminDemo@1234" }];

router.post("/api/login", (req, res) => {
  const { username, password } = req.body;

  const user = USERS.find(
    (u) => u.username === username && u.password === password
  );

  if (!user) return res.status(401).json({ message: "Invalid credentials" });

  const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: "10h" });

  res.json({ token });
});

router.get("/api/check-auth", (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.json({ authenticated: false });

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    res.json({ authenticated: true, user: decoded });
  } catch {
    res.json({ authenticated: false });
  }
});

router.post("/api/logout", (req, res) => {
  res.json({ success: true }); // JWT is stateless, client clears token
});

export default router;
