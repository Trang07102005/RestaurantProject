import React, { useEffect, useState } from "react";
import axios from "axios";
import { UtensilsCrossed, DollarSign, CreditCard, Users, Loader2 } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
const CashierDashboard = () => {
  const [stats, setStats] = useState({
    occupiedTables: 0,
    pendingPayments: 0,
    completedPayments: 0,
    totalRevenue: 0,
  });
  const [paymentMethods, setPaymentMethods] = useState({
    cash: 0,
    card: 0,
    transfer: 0,
  });
  const COLORS = ["#34D399", "#3B82F6", "#FBBF24"];
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Lấy danh sách payments (populate order.table)
        const resPayments = await axios.get("http://localhost:2095/api/payments?page=1&limit=1000");
        const paymentsData = Array.isArray(resPayments.data.payments)
          ? resPayments.data.payments
          : [];

        // Lấy danh sách bàn
        const resTables = await axios.get("http://localhost:2095/api/tables");
        const tables = Array.isArray(resTables.data) ? resTables.data : [];
        const occupiedTables = tables.filter(t => t.status === "occupied").length;

        // Thống kê payments
        const completedPayments = paymentsData.filter(p => p.status === "completed");
        const pendingPayments = paymentsData.filter(p => p.status === "pending");
        const totalRevenue = completedPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

        // Thống kê phương thức thanh toán
        const paymentMethodsData = { cash: 0, card: 0, transfer: 0 };
        completedPayments.forEach(p => {
          if (p.method) paymentMethodsData[p.method] += p.amount || 0;
        });

        setStats({
          occupiedTables,
          pendingPayments: pendingPayments.length,
          completedPayments: completedPayments.length,
          totalRevenue,
        });
        setPayments(paymentsData);
        setPaymentMethods(paymentMethodsData);

      } catch (err) {
        console.error("Lỗi khi tải dữ liệu cashier:", err);
        setPayments([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const STAT_CONFIG = [
    { title: "Bàn Có Khách", icon: UtensilsCrossed, color: "from-amber-400 via-orange-400 to-red-400", key: "occupiedTables" },
    { title: "Đơn Chờ Thanh Toán", icon: CreditCard, color: "from-sky-400 via-blue-400 to-indigo-400", key: "pendingPayments" },
    { title: "Đơn Đã Thanh Toán", icon: DollarSign, color: "from-emerald-400 via-lime-400 to-green-400", key: "completedPayments" },
    { title: "Tổng Doanh Thu", icon: Users, color: "from-pink-400 via-rose-400 to-red-400", key: "totalRevenue" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[70vh] text-gray-500">
        <Loader2 className="w-6 h-6 animate-spin mr-2" /> Đang tải dữ liệu...
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-thin mb-10 tracking-wide">👋 Xin chào, Thu Ngân</h1>

      {/* Thẻ thống kê */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {STAT_CONFIG.map(({ title, icon: Icon, color, key }) => (
          <div key={key} className={`bg-gradient-to-br ${color} text-white rounded-2xl p-6 shadow-md flex flex-col items-start justify-between transition-transform transform hover:scale-[1.03] duration-300 cursor-pointer`}>
            <div className="flex items-center justify-between w-full mb-3">
              <div className="bg-white/20 rounded-xl p-2">
                <Icon size={24} />
              </div>
              <span className="text-3xl font-semibold">{stats[key]?.toLocaleString("vi-VN") ?? 0}</span>
            </div>
            <p className="text-sm text-white/90">{title}</p>
          </div>
        ))}
      </div>

      {/* Thống kê theo phương thức thanh toán */}
      <div className="mt-10 bg-white p-6 rounded-2xl shadow-md border border-gray-100">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">💳 Thống kê theo phương thức thanh toán</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-gray-700">
          {["cash", "card", "transfer"].map(method => (
            <div key={method} className="p-4 bg-gray-50 rounded-lg shadow-sm flex justify-between items-center">
              <span className="capitalize">{method}</span>
              <span className="font-semibold text-green-600">{paymentMethods[method]?.toLocaleString("vi-VN") ?? 0} ₫</span>
            </div>
          ))}
        </div>
      </div>

      {/* Danh sách thanh toán */}
      <div className="mt-10 bg-white p-6 rounded-2xl shadow-md border border-gray-100">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">🧾 Danh Sách Thanh Toán</h2>

        {payments.length === 0 ? (
          <p className="text-gray-500 italic">Hiện không có thanh toán nào.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-left border-t border-gray-200">
              <thead>
                <tr className="text-gray-600 uppercase text-xs bg-gray-50">
                  <th className="py-3 px-4">Mã Hóa Đơn</th>
                  <th className="py-3 px-4">Bàn</th>
                  <th className="py-3 px-4">Trạng Thái</th>
                  <th className="py-3 px-4">Tổng Tiền</th>
                  <th className="py-3 px-4">Thời Gian Thanh Toán</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {payments.map((p) => (
                  <tr key={p._id} className="hover:bg-gray-50 transition">
                    <td className="py-3 px-4 font-medium text-gray-800">{p._id}</td>
                    <td className="py-3 px-4 text-gray-700">
                      Bàn {p.order?.table?.tableNumber ?? "?"}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                        p.status === "completed" ? "bg-green-100 text-green-600" : "bg-yellow-100 text-yellow-600"
                      }`}>
                        {p.status === "completed" ? "Đã Thanh Toán" : "Chờ Thanh Toán"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-800 font-semibold">{p.amount?.toLocaleString("vi-VN") ?? 0} ₫</td>
                    <td className="py-3 px-4 text-gray-500">{p.paidAt ? new Date(p.paidAt).toLocaleString("vi-VN") : "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default CashierDashboard;
