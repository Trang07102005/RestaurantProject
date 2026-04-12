import Role from '../models/Role.js';
import dotenv from 'dotenv';
import dbConnect from './connectDb.js';
dotenv.config();
const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://thanh209:thanh209@cluster0.mxtt2dr.mongodb.net/restaurant"; // sửa DB
const roles = ["Admin", "Waiter", "Cashier", "Manager", "Chef"];

const seedRoles = async () => {
  try {
    await dbConnect(MONGO_URI);
    console.log("Connected DB");

    for (const roleName of roles) {
      await Role.updateOne(
        { name: roleName },
        { $setOnInsert: { name: roleName } },
        { upsert: true }
      );
      console.log(`Ensured role: ${roleName}`);
    }

    console.log("Seeding roles done");
    process.exit();

  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

seedRoles();