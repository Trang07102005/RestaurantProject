import React, { useEffect, useState } from "react";
import axios from "axios";
import { ShoppingCart, Users, DollarSign, UtensilsCrossed } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

// ===================== CONFIG =====================
const STAT_CONFIG = [
  {
    title: "Tổng Đơn Hàng",
    icon: ShoppingCart,
    color: "from-purple-500 via-fuchsia-500 to-pink-500",
    key: "orders",
  },
  {
    title: "Tổng Người Dùng",
    icon: Users,
    color: "from-sky-500 via-blue-500 to-indigo-500",
    key: "users",
  },
  {
    title: "Tổng Số Món Ăn",
    icon: UtensilsCrossed,
    color: "from-yellow-400 via-orange-400 to-red-400",
    key: "foods", // key mới
  },
  {
    title: "Tổng Doanh Thu",
    icon: DollarSign,
    color: "from-emerald-500 via-lime-400 to-green-500",
    key: "revenue",
  },
];

// Màu PieChart
const PIE_COLORS = [
  "#f43f5e",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#f43f5e",
  "#f97316",
  "#22c55e",
];

const LoadingSkeleton = () => (
  <div className="animate-pulse">
    <div className="h-8 bg-gray-300 rounded w-3/4 mb-4"></div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="h-32 bg-gray-300 rounded-2xl"></div>
      ))}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="h-96 bg-gray-300 rounded-2xl"></div>
      <div className="h-96 bg-gray-300 rounded-2xl"></div>
    </div>
  </div>
);

// ===================== CARD =====================
const AnimatedBorder = ({ children, color }) => (
  <div className="relative group">
    <div
      className={`absolute -inset-[2px] rounded-2xl bg-gradient-to-r ${color} opacity-80 blur-sm animate-border-spin`}
    />
    <div
      className={`relative rounded-2xl p-6 bg-gradient-to-br ${color} bg-opacity-20 backdrop-blur-sm`}
    >
      {children}
    </div>
  </div>
);

const StatCard = ({ title, value, icon: Icon, color }) => (
  <AnimatedBorder color={color}>
    <div className="flex items-center justify-between">
      <div>
        <h3 className="text-white font-semibold tracking-wide">{title}</h3>
        <p className="text-2xl font-bold text-white mt-2">
          {Number(value || 0).toLocaleString("vi-VN")}
          {title.includes("Doanh Thu") && " ₫"}
        </p>
      </div>
      <div className={`p-4 rounded-full bg-gradient-to-tr ${color} shadow-xl `}>
        <Icon className="text-white w-8 h-8" />
      </div>
    </div>
  </AnimatedBorder>
);

const formatChartData = (data, filter, type = "user") => {
  if (!data) return [];

  const today = new Date();

  if (filter === "day") {
    // 24 giờ trong ngày hôm nay
    return Array.from({ length: 24 }, (_, hour) => {
      const item = data.find((d) => Number(d._id) === hour); // backend trả { _id: 0-23, count }
      return {
        day: `${hour}h`,
        ...(type === "user"
          ? { newUser: item?.count || 0 }
          : { orders: item?.count || 0, revenue: item?.total || 0 }),
      };
    });
  }

  if (filter === "week") {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() - (6 - i));
      return d.toISOString().split("T")[0];
    });

    return last7Days.map((dateStr) => {
      const item = data.find((d) => d._id === dateStr); // backend trả { _id: 'YYYY-MM-DD', count/total }
      const d = new Date(dateStr);
      const dayLabel = d.toLocaleDateString("vi-VN", {
        weekday: "short",
        day: "numeric",
        month: "numeric",
      });
      return {
        day: dayLabel,
        ...(type === "user"
          ? { newUser: item?.count || 0 }
          : { orders: item?.count || 0, revenue: item?.total || 0 }),
      };
    });
  }

  if (filter === "month") {
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() - (29 - i));
      return d.toISOString().split("T")[0];
    });

    return last30Days.map((dateStr) => {
      const item = data.find((d) => d._id === dateStr);
      const d = new Date(dateStr);
      const dayLabel = `Ngày ${d.getDate()}`;
      return {
        day: dayLabel,
        ...(type === "user"
          ? { newUser: item?.count || 0 }
          : { orders: item?.count || 0, revenue: item?.total || 0 }),
      };
    });
  }

  return [];
};

// ===================== MAIN COMPONENT =====================
const AdminDashboardManager = () => {
  const [totals, setTotals] = useState({
    users: 0,
    orders: 0,
    revenue: 0,
    foods: 0,
  });
  const [userData, setUserData] = useState([]);
  const [orderData, setOrderData] = useState([]);
  const [topFoods, setTopFoods] = useState([]);
  const [revenueFilter, setRevenueFilter] = useState("week");
  const [userFilter, setUserFilter] = useState("week");
  const [loading, setLoading] = useState(true);

  // --- Fetch tổng quan ---
  useEffect(() => {
    const fetchTotals = async () => {
      setLoading(true);
      try {
        const res = await axios.get("http://localhost:2095/api/admin/stats");
        setTotals({
          users: res.data.totalUsers || 0,
          orders: res.data.totalOrders || 0,
          revenue: res.data.totalRevenue || 0,
          foods: res.data.totalFoods || 0, // thêm dòng này
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchTotals();
  }, []);

  // --- Fetch chart người dùng ---
  useEffect(() => {
    const fetchUserChart = async () => {
      try {
        const res = await axios.get(
          `http://localhost:2095/api/admin/dashboard?range=${userFilter}`
        );
        setUserData(res.data.userStats || []);
      } catch (err) {
        console.error(err);
      }
    };
    fetchUserChart();
  }, [userFilter]);

  // --- Fetch chart doanh thu ---
  useEffect(() => {
    const fetchOrderChart = async () => {
      try {
        const res = await axios.get(
          `http://localhost:2095/api/admin/dashboard?range=${revenueFilter}`
        );
        setOrderData(res.data.orderStats || []);
      } catch (err) {
        console.error(err);
      }
    };
    fetchOrderChart();
  }, [revenueFilter]);

  // --- Fetch top món ăn ---
  useEffect(() => {
    const fetchTopFoods = async () => {
      try {
        const res = await axios.get(
          "http://localhost:2095/api/orders/top-foods"
        );
        setTopFoods(res.data || []);
      } catch (err) {
        console.error(err);
      }
    };
    fetchTopFoods();
  }, []);

  const filteredUserData = formatChartData(userData, userFilter, "user");
  const filteredOrderData = formatChartData(orderData, revenueFilter, "order");

  if (loading) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="min-h-screen animate-fade-in bg-[#FFFFFF] rounded-xl text-black p-10">
      <h1 className="text-3xl font-thin mb-10 tracking-wide">
        {" "}
        Admin Dashboard
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
        {STAT_CONFIG.map((stat) => (
          <StatCard
            key={stat.key}
            title={stat.title}
            value={totals[stat.key]}
            icon={stat.icon}
            color={stat.color}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        {/* Doanh thu */}
        <div className="relative group p-[2px] rounded-2xl">
          <div className="bg-[#ffffff] p-6 rounded-2xl shadow-[0_0_12px_#787878] ">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                {" "}
                <span className="text-black font-thin">Doanh Thu</span>
              </h2>
              <div className="flex gap-2">
                {["day", "week", "month"].map((key) => (
                  <button
                    key={key}
                    onClick={() => setRevenueFilter(key)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition cursor-pointer ${
                      revenueFilter === key
                        ? "bg-emerald-500/30 text-emerald-800 border border-emerald-400/50"
                        : "bg-slate-200 text-black hover:bg-slate-400"
                    }`}
                  >
                    {key === "day"
                      ? "Hôm nay"
                      : key === "week"
                      ? "7 ngày"
                      : "30 ngày"}
                  </button>
                ))}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={filteredOrderData}>
                <CartesianGrid horizontal vertical={false} stroke="#334155" />
                <XAxis
                  dataKey="day"
                  tick={{ fill: "#000000", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "#000000", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    border: "1px solid #334155",
                    borderRadius: "8px",
                    color: "#fff",
                  }}
                  formatter={(v) => v.toLocaleString("vi-VN") + " ₫"}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  name="Doanh thu"
                  stroke="#22c55e"
                  strokeWidth={3}
                  dot={{ r: 4, fill: "#22c55e" }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Người dùng */}
        <div className="relative group  p-[2px] rounded-2xl">
          <div className="bg-[#ffffff] p-6 rounded-2xl shadow-[0_0_12px_#787878]">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                {" "}
                <span className="text-black font-thin">Người Dùng</span>
              </h2>
              <div className="flex gap-2">
                {["day", "week", "month"].map((key) => (
                  <button
                    key={key}
                    onClick={() => setUserFilter(key)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition cursor-pointer ${
                      userFilter === key
                        ? "bg-pink-500/30 text-pink-700 border border-pink-800"
                        : "bg-slate-200 text-black hover:bg-slate-400"
                    }`}
                  >
                    {key === "day"
                      ? "Hôm nay"
                      : key === "week"
                      ? "7 ngày"
                      : "30 ngày"}
                  </button>
                ))}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={filteredUserData}>
                <CartesianGrid vertical={false} stroke="#334155" />
                <XAxis
                  dataKey="day"
                  tick={{ fill: "#000000", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "#000000", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    border: "1px solid #334155",
                    borderRadius: "10px",
                    color: "#fff",
                    padding: "8px 12px",
                  }}
                  itemStyle={{ color: "#fff", fontSize: 13 }}
                  labelStyle={{ color: "#94a3b8", fontSize: 12 }}
                  cursor={{ stroke: "#475569", strokeWidth: 1 }}
                />
                <defs>
                  <linearGradient id="userGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.9} />
                    <stop offset="95%" stopColor="#be123c" stopOpacity={0.3} />
                  </linearGradient>
                </defs>
                <Bar
                  dataKey="newUser"
                  name="Người mới"
                  fill="url(#userGradient)"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Container lớn cho PieChart và danh sách món */}
      <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* PieChart - Món Ăn Bán Chạy */}
        <div className="relative group rounded-2xl p-[2px] transition-all duration-300 hover:shadow-[0_0_25px_rgba(251,191,36,0.4)]">
          <div
            className="bg-white dark:from-[#1e293b]/90 dark:to-[#0f172a]/90 
                  p-6 rounded-2xl shadow-2xl border border-slate-300/50 dark:border-slate-700/80 
                  backdrop-blur-lg transition-all duration-300 group-hover:scale-[1.01] group-hover:shadow-yellow-400/20"
          >
            {/* Title */}
            <h2 className="text-2xl font-semibold mb-6 text-gray-800 dark:text-white flex items-center gap-2">
              🍽️ Món Ăn Bán Chạy
            </h2>

            {/* Chart */}
            <ResponsiveContainer width="100%" height={380}>
              <PieChart>
                <Pie
                  data={topFoods}
                  dataKey="totalSold"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={130}
                  innerRadius={60}
                  paddingAngle={4}
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name} (${(percent * 100).toFixed(0)}%)`
                  }
                >
                  {topFoods.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={PIE_COLORS[index % PIE_COLORS.length]}
                      stroke="#fff"
                      strokeWidth={2}
                      className="transition-transform duration-300 hover:scale-105 cursor-pointer"
                    />
                  ))}
                </Pie>

                {/* Tooltip */}
                <Tooltip
                  formatter={(value) => `${value} món`}
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    border: "1px solid #cbd5e1",
                    borderRadius: "8px",
                    color: "#1e293b",
                    padding: "10px 14px",
                  }}
                />

                {/* Legend */}
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  wrapperStyle={{
                    color: "#1e293b",
                    fontSize: "14px",
                  }}
                  iconType="circle"
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Danh sách món ăn và số lượng + giá */}
        <div
          className="bg-white dark:from-[#1b2437]/95 dark:to-[#111827]/90 
                p-6 rounded-2xl shadow-2xl border border-slate-300/40 dark:border-slate-700/70 
                backdrop-blur-md overflow-y-auto max-h-[440px] transition-all duration-300 group"
        >
          <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2 text-gray-800 dark:text-white">
            📋 Chi Tiết Số Lượng Món
          </h2>

          <ul className="divide-y divide-slate-200 dark:divide-slate-700">
            {topFoods.map((food, index) => (
              <li
                key={food._id || index}
                className="flex items-center gap-4 py-3 px-3 rounded-xl 
                   hover:bg-white/60 dark:hover:bg-[#2a334b]/80 
                   transition-all duration-200 group/item relative"
              >
                {/* Hiệu ứng ánh sáng hover */}
                <div
                  className="absolute inset-0 opacity-0 group-hover/item:opacity-100 
                        bg-gradient-to-r from-pink-500/10 via-orange-400/10 to-yellow-400/10 
                        rounded-xl blur-[2px] transition-all duration-300"
                ></div>

                {/* Ảnh món ăn */}
                <img
                  src={food.image}
                  alt={food.name}
                  className="w-14 h-14 rounded-xl object-cover flex-shrink-0 shadow-md 
                     ring-2 ring-transparent group-hover/item:ring-yellow-400/50 transition-all duration-300 z-[1]"
                />

                {/* Tên và giá món */}
                <div className="flex-1 flex flex-col z-[1]">
                  <span className="text-gray-900 dark:text-white font-medium text-sm md:text-base">
                    {food.name}
                  </span>
                  <span className="text-gray-500 dark:text-gray-400 text-xs md:text-sm">
                    Giá: {Number(food.price || 0).toLocaleString("vi-VN")} ₫
                  </span>
                </div>

                {/* Số lượng đã bán */}
                <span className="text-red-600 dark:text-emerald-400 font-semibold text-xl md:text-base z-[1]">
                  🛒 {food.totalSold}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardManager;
