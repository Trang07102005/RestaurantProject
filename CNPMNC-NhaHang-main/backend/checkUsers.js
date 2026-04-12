import mongoose from "mongoose";
import User from "./models/User.js";

const uri = "mongodb+srv://thanh209:thanh209@cluster0.mxtt2dr.mongodb.net/restaurant";

async function main() {
  await mongoose.connect(uri);
  const users = await User.find({}, "email");
  console.log("Danh sách email trong database:");
  users.forEach(u => console.log(u.email));
  mongoose.disconnect();
}

main();
