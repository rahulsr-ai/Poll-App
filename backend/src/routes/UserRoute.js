import express from "express";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();
const UserRouter = express.Router();

// 1️⃣ Create User
UserRouter.post("/create/users", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // ✅ Validate inputs
    if (!(username && email && password)) {
      return res.status(400).json({ error: "Please provide all fields" });
    }

    const saltRounds = 10;

    // ✅ Hash password properly using await
    const hashPassword = await bcrypt.hash(password, saltRounds);

    const isUser = await prisma.user.findUnique({
      where: {
        email: email,
      },
    });

    if (isUser) {
      return res
        .status(400)
        .json({ error: "User already exists or invalid data" });
    }

    // ✅ Create user in database
    const user = await prisma.user.create({
      data: {
        name: username,
        email: email,
        password: hashPassword,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Account created successfully!",
      user: user,
    });
  } catch (err) {
    console.error(err); // 🔥 Terminal me exact error dikhne ke liye
    return res
      .status(400)
      .json({ error: "User already exists or invalid data", success: false });
  }
});

UserRouter.post("/user/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // ✅ Validate inputs
    if (!(email && password)) {
      return res
        .status(400)
        .json({ error: "Please provide all fields", success: false });
    }

    const isUser = await prisma.user.findUnique({
      where: {
        email: email,
      },
    });

    // CHECK EMAIL FIRST
    if (!isUser) {
      return res
        .status(400)
        .json({ error: "Invalid credentials", success: false });
    }

    // CHECK PASSWORD
    const isMatch = await bcrypt.compare(password, isUser.password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ error: "Invalid credentials", success: false });
    }

    return res.status(200).json({
      success: true,
      message: "User login successfully",
      user: isUser,
    });
  } catch (err) {
    console.error(err); // 🔥 Terminal me exact error dikhne ke liye
    return res
      .status(400)
      .json({ error: "Invalid credentials", success: false });
  }
});

export default UserRouter;
