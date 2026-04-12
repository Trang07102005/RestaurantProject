import React, { useEffect, useState } from "react";
import axios from "axios";
import { Plus, Pen, Trash2, Crown } from "lucide-react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import TableModal from "../../components/Cashier/modal/TableModal";
import ReservationModal from "../../components/Cashier/modal/ReservationModal";

const CashierReservation = () => {
  const [tables, setTables] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [openTableModal, setOpenTableModal] = useState(false);
  const [openReservationModal, setOpenReservationModal] = useState(false);
  const [editData, setEditData] = useState(null);

  const fetchTables = async () => {
    const res = await axios.get("http://localhost:2095/api/tables");
    setTables(res.data);
  };

  const fetchReservations = async (tableId) => {
    try {
      const res = await axios.get(
        `http://localhost:2095/api/reservations/byTable/${tableId}`
      );
      setReservations(res.data);
    } catch (err) {
      if (err.response && err.response.status === 404) setReservations([]);
      else console.error("Lỗi khi tải danh sách đặt bàn:", err);
    }
  };

  useEffect(() => {
    fetchTables();
  }, []);

  const handleSelectTable = (table) => {
    setSelectedTable(table);
    fetchReservations(table._id);
  };

  const handleOpenTableModal = (table = null) => {
    setEditData(table);
    setOpenTableModal(true);
  };

  const handleOpenReservationModal = (reservation = null) => {
    setEditData(reservation);
    setOpenReservationModal(true);
  };

  return (
    <div className="p-6 text-gray-900 bg-transparent min-h-screen ">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-100px)] ">
        {/* -------- DANH SÁCH BÀN -------- */}
        <div className="bg-white shadow-lg p-6 rounded-2xl border border-gray-200 custom-scroll flex flex-col overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-gray-900 tracking-wide">
              Danh sách bàn
            </h2>

          </div>

          {/* Nhóm bàn theo tầng */}
          <div className="space-y-10">
            {Array.isArray(tables) && tables.length > 0 ? (
              Object.entries(
                tables.reduce((acc, t) => {
                  const floor = t.floor || 1;
                  acc[floor] = acc[floor] || [];
                  acc[floor].push(t);
                  return acc;
                }, {})
              )
                .sort((a, b) => b[0] - a[0])
                .map(([floor, floorTables]) => (
                  <div key={floor}>
                    <h3 className="text-lg font-semibold mb-4 text-gray-700 flex items-center gap-2">
                      <span className="text-xl">🏢</span> Tầng {floor}
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
                      {floorTables.map((table) => {
                        const statusColor =
                          table.status === "available"
                            ? "bg-green-400/80 text-white"
                            : table.status === "occupied"
                            ? "bg-red-400/80 text-white"
                            : "bg-yellow-400/80 text-white";

                        const shape =
                          {
                            2: "w-16 h-16 rounded-lg",
                            4: "w-20 h-20 rounded-full",
                            6: "w-24 h-24 rounded-full",
                            8: "w-28 h-28 rounded-full",
                            10: "w-32 h-20 rounded-xl",
                          }[table.seats] || "w-20 h-20 rounded-md";

                        const vipClass = table.isVIP
                          ? "border-4 border-fuchsia-500 shadow-[0_0_20px_#D946EF]"
                          : "";

                        return (
                          <div
                            key={table._id}
                            onClick={() => handleSelectTable(table)}
                            title={`Chọn bàn ${table.tableNumber}`}
                            className="group cursor-pointer relative flex flex-col items-center"
                          >
                            <div
                              className={`flex items-center justify-center font-bold text-lg ${statusColor} ${shape} ${vipClass} transition-all duration-300 hover:scale-110 hover:shadow-lg`}
                            >
                              {table.tableNumber}
                              {table.isVIP && (
                                <Crown
                                  size={16}
                                  className="absolute -top-2 right-8 text-yellow-500 drop-shadow-md"
                                />
                              )}
                            </div>
                            <div className="mt-2 text-sm text-gray-700 text-center">
                              {table.location || "—"}
                              <div className="text-xs text-gray-500 mt-0.5">
                                {table.seats} ghế ·{" "}
                                <span
                                  className={
                                    table.status === "available"
                                      ? "text-green-500"
                                      : table.status === "occupied"
                                      ? "text-red-500"
                                      : "text-yellow-500"
                                  }
                                >
                                  {table.status}
                                </span>
                              </div>
                            </div>

                            
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
            ) : (
              <p className="text-gray-400 italic text-center mt-6">
                — Chưa có bàn nào trong hệ thống —
              </p>
            )}
          </div>
        </div>

        {/* -------- DANH SÁCH ĐẶT BÀN -------- */}
        <div className="bg-white shadow-lg p-6 rounded-2xl border border-gray-200 flex flex-col overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold tracking-wide text-gray-900">
              {selectedTable
                ? `Đặt bàn - Bàn ${selectedTable.tableNumber}`
                : "Chọn bàn để xem đặt chỗ"}
            </h2>

            {selectedTable && (
              <button
                onClick={() => handleOpenReservationModal()}
                title="Tạo đặt chỗ mới cho bàn này"
                className="px-4 py-2 flex items-center gap-x-2 text-white text-sm font-semibold tracking-wide
                 bg-green-500 rounded-lg cursor-pointer
                 shadow-md shadow-green-300/40
                 transition transform hover:scale-105 hover:bg-green-400 hover:shadow-lg hover:shadow-green-400/50"
              >
                <Plus size={18} /> Thêm lịch đặt bàn
              </button>
            )}
          </div>

          {selectedTable ? (
            Array.isArray(reservations) && reservations.length > 0 ? (
              <div className="grid sm:grid-cols-2 xl:grid-cols-2 gap-4">
                {reservations.map((r) => (
                  <div
                    key={r._id}
                    className="p-4 border border-gray-200 rounded-xl  hover:scale-105 ease-in shadow-sm hover:shadow-md hover:bg-white transition-all bg-gray-50"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {r.customerName || r.user?.name || "Khách ẩn danh"}
                        </h3>
                        <p className="text-sm text-gray-500">
                          📞 {r.customerPhone || r.user?.phone || "N/A"}
                        </p>
                        <p className="text-sm text-gray-500">
                          🕐 {new Date(r.reservationTime).toLocaleString("vi-VN")}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-1 rounded-md text-xs font-semibold ${
                          r.status === "confirmed"
                            ? "bg-green-100 text-green-600"
                            : r.status === "pending"
                            ? "bg-yellow-100 text-yellow-600"
                            : "bg-red-100 text-red-600"
                        }`}
                      >
                        {r.status}
                      </span>
                    </div>

                    <div className="mt-2 text-sm text-gray-600 space-y-1">
                      <p>
                        👥 Số khách: <b>{r.guests} người</b>
                      </p>
                      {r.arrivalTime && (
                        <p className="text-green-600 font-medium">
                          ✅ Đã đến lúc: {new Date(r.arrivalTime).toLocaleTimeString("vi-VN")}
                        </p>
                      )}
                      {r.order && (
                        <p className="text-blue-600">
                          🍽️ Đã order (ID: {r.order._id?.slice(-6) || r.order.toString().slice(-6)})
                        </p>
                      )}
                      {r.note && (
                        <p className="mt-1 italic text-gray-500">📝 {r.note}</p>
                      )}
                    </div>

                    <div className="flex justify-end gap-2 mt-4 flex-wrap">
                      {r.status === "pending" && (
                        <button
                          onClick={async () => {
                            try {
                              await axios.patch(
                                `http://localhost:2095/api/reservations/${r._id}/status`,
                                { status: "confirmed" }
                              );
                              await fetchReservations(selectedTable._id);
                              await fetchTables();
                            } catch (err) {
                              console.error(err);
                              alert(err.response?.data?.message || "Có lỗi xảy ra");
                            }
                          }}
                          title="Xác nhận khách đã tới"
                          className="px-3 py-2 flex items-center gap-2 text-sm font-medium
                                   bg-green-500 rounded-md text-white shadow-md shadow-green-300/40
                                   hover:bg-green-400 hover:shadow-lg hover:shadow-green-400/50 transition transform hover:scale-105 cursor-pointer"
                        >
                          ✅ Khách đã tới
                        </button>
                      )}
                      <button
                        onClick={() => handleOpenReservationModal(r)}
                        title="Chỉnh sửa đặt chỗ"
                        className="px-3 py-2 flex items-center gap-2 text-sm font-medium
                                 bg-yellow-400 rounded-md text-black shadow-md shadow-yellow-300/40
                                 hover:bg-yellow-300 hover:shadow-lg hover:shadow-yellow-400/50 transition transform hover:scale-105 cursor-pointer"
                      >
                        <Pen size={16} />
                      </button>
                      <button
                        onClick={() =>
                          axios
                            .delete(
                              `http://localhost:2095/api/reservations/${r._id}`
                            )
                            .then(() => {
                              fetchReservations(selectedTable._id);
                              fetchTables();
                            })
                        }
                        title="Hủy đặt chỗ"
                        className="px-3 py-2 flex items-center gap-2 text-sm font-medium
                                 bg-red-500 rounded-md text-white shadow-md shadow-red-300/40
                                 hover:bg-red-400 hover:shadow-lg hover:shadow-red-400/50 transition transform hover:scale-105 cursor-pointer"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 italic text-center mt-10">
                — Chưa có lịch đặt cho bàn này —
              </p>
            )
          ) : (
            <p className="text-gray-400 italic text-center mt-10">
              — Vui lòng chọn một bàn để xem danh sách đặt chỗ —
            </p>
          )}
        </div>
      </div>

      {/* -------- MODALS -------- */}
      {openTableModal && (
        <TableModal
          onClose={() => setOpenTableModal(false)}
          refresh={fetchTables}
          editData={editData}
        />
      )}
      {openReservationModal && selectedTable && (
        <ReservationModal
          onClose={() => setOpenReservationModal(false)}
          refresh={() => fetchReservations(selectedTable._id)}
          editData={editData}
          tableId={selectedTable._id}
        />
      )}
      
      {/* Toast Container */}
      <ToastContainer />
    </div>
  );
};

export default CashierReservation;
