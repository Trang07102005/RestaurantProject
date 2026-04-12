import React, { useEffect, useState } from "react";
import axios from "axios";
import { Save, X } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const API_URL = "http://localhost:2095/api/payments";
const ORDER_URL = "http://localhost:2095/api/orders";

const PaymentModal = ({ order, onClose, onSuccess }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    order: "",
    method: "",
    amount: "",
    paidAt: new Date().toISOString().substring(0, 10),
    customerCash: "",
    changeAmount: "",
  });

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await axios.get(`${ORDER_URL}?status=served`);
        setOrders(res.data || []);
      } catch (err) {
        console.error("Lỗi lấy order:", err);
        toast.error("Không thể tải danh sách đơn hàng!");
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  useEffect(() => {
    if (order) {
      setForm({
        order: order._id || "",
        method: "",
        amount: order.totalAmount || 0,
        paidAt: new Date().toISOString().substring(0, 10),
        customerCash: "",
        changeAmount: "",
      });
    }
  }, [order]);

  const handleMethodChange = (method) => {
    setForm((prev) => ({ ...prev, method }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => {
      let newForm = { ...prev, [name]: value };
      if (name === "customerCash") {
        const change = Number(value) - Number(order?.totalAmount || 0);
        newForm.changeAmount = change >= 0 ? change : 0;
      }
      return newForm;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!form.order || !form.method) {
        toast.warning("Vui lòng chọn phương thức thanh toán!");
        return;
      }

      if (form.method === "cash") {
        if (Number(form.customerCash) < Number(order?.totalAmount || 0)) {
          toast.error("💸 Tiền khách đưa không đủ!");
          return;
        }
      }

      await axios.post(API_URL, {
        order: form.order,
        method: form.method,
        amount: form.amount,
        status: "completed",
        paidAt: form.paidAt,
      });

      await axios.put(`${ORDER_URL}/${form.order}`, { status: "paid" });

      toast.success("✅ Thanh toán thành công!");
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("❌ Lỗi khi xử lý thanh toán!");
    }
  };

  const selectedOrder =
    orders.find((o) => o._id === form.order) || order || null;

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-xl w-[400px] text-center shadow-lg">
          <p className="text-gray-600">Đang tải dữ liệu đơn hàng...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <ToastContainer position="top-right" autoClose={2000} hideProgressBar />
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl w-[700px]  shadow-2xl overflow-hidden  animate-fade-in">
          {/* Header gradient */}
          <div className="bg-gradient-to-r from-green-500 to-green-600 px-6 py-4 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-white">
              Thanh Toán Đơn Hàng #{selectedOrder?._id?.slice(-6) || ""}
            </h2>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition cursor-pointer"
            >
              <X size={22} />
            </button>
          </div>

          {/* Nội dung modal */}
          <div className="p-6 bg-white">
            {/* Phương thức thanh toán */}
            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chọn phương thức thanh toán:
              </label>
              <div className="flex gap-3">
                {["cash", "card", "transfer"].map((m) => (
                  <label
                    key={m}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer transition-all ${
                      form.method === m
                        ? "border-green-500 bg-green-50 text-green-700"
                        : "border-gray-300 hover:bg-gray-100 text-gray-700"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={form.method === m}
                      onChange={() => handleMethodChange(m)}
                      className="accent-green-600"
                    />
                    {m === "cash"
                      ? "💵 Tiền mặt"
                      : m === "card"
                      ? "💳 Thẻ"
                      : "🏦 Chuyển khoản"}
                  </label>
                ))}
              </div>
            </div>

            {/* Hiển thị theo phương thức */}
            {form.method === "cash" && (
              <div className="bg-green-50 border border-green-200 p-4 rounded-lg mb-4">
                <p className="text-gray-700 mb-2">
                  Tổng tiền Order:{" "}
                  <span className="font-semibold text-green-700">
                    {(order?.totalAmount || 0).toLocaleString()}₫
                  </span>
                </p>

                <label className="block text-sm text-gray-700 mb-1">
                  Tiền khách đưa
                </label>
                <input
                  type="number"
                  name="customerCash"
                  value={form.customerCash}
                  onChange={handleInputChange}
                  className="w-full p-2 rounded border border-gray-300 focus:border-green-500 focus:ring-green-500 outline-none mb-2"
                />

                <p className="text-gray-700">
                  Tiền thối lại:{" "}
                  <span className="font-semibold text-green-600">
                    {form.changeAmount
                      ? form.changeAmount.toLocaleString()
                      : 0}
                    ₫
                  </span>
                </p>
              </div>
            )}

            {form.method === "transfer" && (
              <div className="text-center bg-green-50 border border-green-200 p-4 rounded-lg mb-4">
                <p className="text-gray-700 mb-2">
                  Quét mã QR để chuyển khoản tổng tiền:
                </p>
                <p className="text-xl font-semibold text-green-700 mb-2">
                  {(order?.totalAmount || 0).toLocaleString()}₫
                </p>
                <img
                  src="/assets/qr-bank.png"
                  alt="QR chuyển khoản"
                  className="mx-auto w-48 h-48 rounded-lg border border-green-300"
                />
              </div>
            )}

            {form.method === "card" && (
              <div className="text-center bg-green-50 border border-green-200 p-4 rounded-lg mb-4">
                <p className="text-gray-700">
                  Vui lòng quẹt thẻ qua máy POS để hoàn tất thanh toán.
                </p>
              </div>
            )}

            {/* Nút hành động */}
            <div className="flex justify-end gap-3 pt-3 border-t border-gray-200">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={handleSubmit}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white font-medium shadow cursor-pointer"
              >
                <Save size={18} /> Xác nhận thanh toán
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PaymentModal;
