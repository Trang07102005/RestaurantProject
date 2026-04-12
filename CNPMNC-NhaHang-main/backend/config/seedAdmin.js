import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import User from '../models/User.js';
import Role from '../models/Role.js';
import dotenv from 'dotenv';
import dbConnect from './connectDb.js';

dotenv.config();
const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://thanh209:thanh209@cluster0.mxtt2dr.mongodb.net/restaurant"; // sửa DB

const seedAdmin = async () => {
  try {
    await dbConnect(MONGO_URI);
    console.log("Connected DB");

    // 1. Tìm role Admin
    let adminRole = await Role.findOne({ name: "Admin" });

    if (!adminRole) {
      adminRole = await Role.create({ name: "Admin" });
      console.log("Created Admin role");
    }

    // 2. Check nếu đã có admin
    const existingAdmin = await User.findOne({ email: "admin@gmail.com" });
    if (existingAdmin) {
      console.log("Admin already exists");
      process.exit();
    }

    // 3. Hash password
    const hashedPassword = await bcrypt.hash("123456", 10);

    // 4. Tạo admin
    const admin = new User({
      role: adminRole._id,
      name: "Admin",
      email: "admin@gmail.com",
      password: hashedPassword
    });

    await admin.save();

    console.log("Admin created successfully");
    process.exit();

  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

seedAdmin();