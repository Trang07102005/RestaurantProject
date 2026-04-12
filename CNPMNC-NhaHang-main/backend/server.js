import express from "express";
import dbConnect from "./config/connectDb.js";
import dotenv from "dotenv";
import route from "./routes/index.js";
import cors from "cors";
import axios from "axios";

// Kết nối database
dotenv.config(); // load biến từ .env
dbConnect(process.env.MONGO_URI);

const app = express();
const port = process.env.PORT;
app.use(express.json());
// ✅ Cho (port 5173) truy cập
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

// Middleware để parse JSON
app.use(express.json());

// Test route
app.get("/", (req, res) => {
  res.send("Server is running");
});

// Route
route(app);

// ✅ AUTO-CANCEL OVERDUE RESERVATIONS (Chạy mỗi 5 phút)
setInterval(async () => {
  try {
    const response = await axios.post(`http://localhost:${port}/api/reservations/auto-cancel-overdue`);
    if (response.data.cancelled?.length > 0) {
      console.log(`[Auto-Cancel] Đã hủy ${response.data.cancelled.length} đặt chỗ quá hạn`);
    }
  } catch (err) {
    console.error("[Auto-Cancel] Lỗi:", err.message);
  }
}, 5 * 60 * 1000); // 5 phút

app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
  console.log(`⏰ Auto-cancel job started (runs every 5 minutes)`);
});
