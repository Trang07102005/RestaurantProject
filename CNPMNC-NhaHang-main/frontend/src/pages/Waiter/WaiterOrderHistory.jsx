import React, { useEffect, useState } from "react";
import axios from "axios";

const WaiterOrderHistory = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [activeStatus, setActiveStatus] = useState("all");

  // 3 ô tìm kiếm
  const [searchOrderId, setSearchOrderId] = useState("");
  const [searchTable, setSearchTable] = useState("");
  const [searchFoodName, setSearchFoodName] = useState("");

  const [loading, setLoading] = useState(false);

  const statuses = [
    "all",
    "pending",
    "preparing",
    "ready",
    "served",
    "canceled",
  ];

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await axios.get("http://localhost:2095/api/orders");
      setOrders(res.data);
      setFilteredOrders(res.data);
    } catch (err) {
      console.error("Lỗi fetch orders:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // ========================
  // 🔎 Lọc tất cả dữ liệu
  // ========================
  useEffect(() => {
    let result = [...orders];

    // Lọc theo nút trạng thái
    if (activeStatus !== "all") {
      result = result.filter((o) => o.status === activeStatus);
    }

    // Lọc theo ID Order
    if (searchOrderId.trim() !== "") {
      result = result.filter((o) =>
        o._id.toLowerCase().includes(searchOrderId.toLowerCase())
      );
    }

    // Lọc theo số bàn
    if (searchTable.trim() !== "") {
      result = result.filter((o) =>
        String(o.table?.tableNumber || "")
          .toLowerCase()
          .includes(searchTable.toLowerCase())
      );
    }

    // 🔥 Lọc theo tên món (NEW)
    if (searchFoodName.trim() !== "") {
      result = result.filter((o) =>
        o.items?.some((item) =>
          item.food?.name?.toLowerCase().includes(searchFoodName.toLowerCase())
        )
      );
    }

    setFilteredOrders(result);
  }, [activeStatus, searchOrderId, searchTable, searchFoodName, orders]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Lịch sử Orders</h1>

      {/* 3 ô tìm kiếm */}
      <div className="grid md:grid-cols-3 gap-4 mb-6 bg-white p-5 rounded-xl shadow-sm border border-gray-100">
        {/* Tìm ID Order */}
        <input
          type="text"
          placeholder="🔍 Tìm ID Order..."
          title="Tìm kiếm theo mã order"
          className="h-11 px-4 rounded-lg border border-gray-200 bg-white shadow-sm hover:shadow text-gray-700
        focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none transition-all duration-200 placeholder:text-gray-400 cursor-text"
          value={searchOrderId}
          onChange={(e) => setSearchOrderId(e.target.value)}
        />

        {/* Tìm số bàn */}
        <input
          type="text"
          placeholder="🍽️ Tìm theo số bàn..."
          title="Tìm kiếm theo số bàn"
          className="h-11 px-4 rounded-lg border border-gray-200 bg-white shadow-sm hover:shadow text-gray-700
        focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none transition-all duration-200 placeholder:text-gray-400 cursor-text"
          value={searchTable}
          onChange={(e) => setSearchTable(e.target.value)}
        />

        {/* Tìm theo tên món */}
        <input
          type="text"
          placeholder="🍜 Tìm theo tên món..."
          title="Tìm kiếm theo tên món ăn"
          className="h-11 px-4 rounded-lg border border-gray-200 bg-white shadow-sm hover:shadow text-gray-700
        focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none transition-all duration-200 placeholder:text-gray-400 cursor-text"
          value={searchFoodName}
          onChange={(e) => setSearchFoodName(e.target.value)}
        />
      </div>

      <div className="bg-white p-9 rounded-xl">
        {/* Nút filter trạng thái */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {statuses.map((status) => (
            <button
              key={status}
              onClick={() => setActiveStatus(status)}
              title={`Lọc theo trạng thái ${status}`}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-shadow duration-200 cursor-pointer ${
                activeStatus === status
                  ? "bg-gradient-to-r from-indigo-500 to-cyan-400 text-white shadow-lg"
                  : "bg-gray-100 text-gray-700 hover:shadow-md hover:bg-gray-200"
              }`}
            >
              {status.toUpperCase()}
            </button>
          ))}
        </div>

        {loading ? (
          <p>Đang tải...</p>
        ) : filteredOrders.length === 0 ? (
          <p>Không tìm thấy order nào.</p>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredOrders.map((order) => (
              <div
                key={order._id}
                className="p-5 border border-gray-200 rounded-xl shadow-sm bg-white hover:shadow-lg transition-shadow duration-300 flex flex-col gap-3"
              >
                {/* Header */}
                <div className="flex justify-between items-center">
                  <h2 className="font-semibold text-lg text-gray-800">
                    Order #{order._id.slice(-6)}
                  </h2>
                  <span
                    className={`px-3 py-1 text-xs font-semibold rounded-full ${
                      order.status === "pending"
                        ? "bg-yellow-100 text-yellow-800"
                        : order.status === "preparing"
                        ? "bg-blue-100 text-blue-800"
                        : order.status === "ready"
                        ? "bg-green-100 text-green-800"
                        : order.status === "served"
                        ? "bg-indigo-100 text-indigo-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {order.status.toUpperCase()}
                  </span>
                </div>

                <div className="flex flex-col gap-1 text-gray-600">
                  <p>
                    <strong>Bàn:</strong> {order.table?.tableNumber || "N/A"}
                  </p>
                  <p>
                    <strong>Khách:</strong>{" "}
                    {order.user
                      ? `${order.user.name} (${order.user.email})`
                      : "Khách hàng"}
                  </p>
                </div>

                {/* Danh sách món */}
                <div>
                  <strong>Món:</strong>
                  <ul className="mt-2 space-y-2">
                    {order.items?.map((item) => (
                      <li
                        key={item._id}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition"
                      >
                        <img
                          src={
                            item.food?.image ||
                            "https://via.placeholder.com/40x40?text=Food"
                          }
                          className="w-10 h-10 rounded-full object-cover border"
                        />
                        <div className="flex-1">
                          <p className="text-gray-800 font-medium">
                            {item.food?.name} x {item.quantity}
                          </p>
                          <p className="text-xs text-gray-500">{item.status}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>

                {order.orderNote && (
                  <p className="text-gray-500 text-sm mt-2">
                    <strong>Ghi chú:</strong> {order.orderNote}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default WaiterOrderHistory;
