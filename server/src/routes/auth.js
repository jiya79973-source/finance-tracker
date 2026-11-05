import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import requireAuth from "../middleware/auth.js";

const router = Router();

function createToken(userId) {
  return jwt.sign({}, process.env.JWT_SECRET, { subject: userId, expiresIn: "7d" });
}

function publicUser(user) {
  return { id: user._id, name: user.name, email: user.email };
}

router.post("/register", async (request, response, next) => {
  try {
    const body = request.body && typeof request.body === "object" && !Array.isArray(request.body) ? request.body : {};
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";
    if (!name || name.length > 60 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 || password.length < 8 || password.length > 72) {
      return response.status(400).json({ message: "Enter a name, valid email, and password between 8 and 72 characters." });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email, passwordHash });
    return response.status(201).json({ token: createToken(user.id), user: publicUser(user) });
  } catch (error) {
    if (error.code === 11000) return response.status(409).json({ message: "An account with this email already exists." });
    return next(error);
  }
});

router.post("/login", async (request, response, next) => {
  try {
    const body = request.body && typeof request.body === "object" && !Array.isArray(request.body) ? request.body : {};
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";
    if (!email || !password) return response.status(400).json({ message: "Enter your email and password." });

    const user = await User.findOne({ email }).select("+passwordHash");
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return response.status(401).json({ message: "Email or password is incorrect." });
    }
    return response.json({ token: createToken(user.id), user: publicUser(user) });
  } catch (error) {
    return next(error);
  }
});

router.get("/me", requireAuth, async (request, response, next) => {
  try {
    const user = await User.findById(request.userId);
    if (!user) return response.status(401).json({ message: "Your account could not be found. Please sign in again." });
    return response.json({ user: publicUser(user) });
  } catch (error) {
    return next(error);
  }
});

export default router;
