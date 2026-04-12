import React, { useEffect, useState } from "react";
import axios from "axios";
import { Search, Trash2, Printer, Merge, Split, CreditCard } from "lucide-react";
import { toast } from "react-toastify";
import PaymentModal from "../../components/Cashier/modal/PaymentModal";
import OrderDetailModal from "../../components/Cashier/modal/OrderDetailModal";
import MergeModal from "../../components/Cashier/modal/MergeModal";

const API_URL = "http://localhost:2095/api/payments";
const ORDER_URL = "http://localhost:2095/api/orders";

const AdminPaymentManager = () => {
  const [payments, setPayments] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [pendingOrders, setPendingOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOrderDetail, setSelectedOrderDetail] = useState(null);
  const [isOrderDetailOpen, setIsOrderDetailOpen] = useState(false);
  const [ordersToMerge, setOrdersToMerge] = useState([]);
  const [orderToSplit, setOrderToSplit] = useState(null);
  const [isMergeModalOpen, setIsMergeModalOpen] = useState(false);
  // 🟩 Lấy danh sách payment
  const fetchPayments = async (p = page, l = limit) => {
    try {
      const res = await axios.get(`${API_URL}?page=${p}&limit=${l}`);
      const data = res.data || {};
      setPayments(Array.isArray(data.payments) ? data.payments : []);
      setPage(data.page || 1);
      setPages(data.pages || 1);
      setLimit(data.limit || l);
      setTotal(data.total || 0);
    } catch (err) {
      console.error("Lỗi khi lấy payment:", err);
    }
  };

  // 🟦 Lấy danh sách order cần thanh toán
  const fetchPendingOrders = async () => {
    try {
      const res = await axios.get(ORDER_URL);
      const needPayment = (res.data || []).filter((o) => o.status === "served");
      setPendingOrders(needPayment);
    } catch (err) {
      console.error("Lỗi khi lấy orders:", err);
    }
  };

  const fetchOrderDetail = async (orderId) => {
    try {
      const res = await axios.get(`${ORDER_URL}/${orderId}`);
      setSelectedOrderDetail([res.data]);
      setIsOrderDetailOpen(true);
    } catch (err) {
      console.error("Lỗi khi lấy chi tiết order:", err);
    }
  };

  useEffect(() => {
    fetchPayments(1, limit);
    fetchPendingOrders();
  }, []);

  const handleOpenModal = (order = null, payment = null) => {
    setSelectedOrder(order);
    setSelectedPayment(payment);
    setIsModalOpen(true);
  };

  // Deleting payments is not allowed. Remove/delete action on frontend.
  const handleDelete = (id) => {
    toast?.warning?.("Xóa hóa đơn không được phép");
  };

  const handlePrint = async (paymentId) => {
    try {
      const res = await axios.get(`${API_URL}/${paymentId}`);
      const p = res.data;
      const order = p.order || {};

      const items = [];
      if (order.items) items.push(...order.items);
      if (order.addedItems) items.push(...order.addedItems);

      const html = `
        <html>
        <head>
          <title>Hóa đơn ${p._id}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .header { text-align: center; margin-bottom: 12px }
            table { width: 100%; border-collapse: collapse; }
            th, td { padding: 6px 8px; border-bottom: 1px solid #ddd; }
            .right { text-align: right }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>Nhà hàng</h2>
            <div>Hóa đơn: ${p._id}</div>
            <div>Order: ${order._id || "-"} | Bàn: ${
        order.table?.tableNumber || order.tableNumber || "-"
      }</div>
            <div>Ngày: ${new Date(p.paidAt).toLocaleString("vi-VN")}</div>
          </div>
          <table>
            <thead>
              <tr><th>Sản phẩm</th><th class="right">SL</th><th class="right">Đơn giá</th><th class="right">Thành</th></tr>
            </thead>
            <tbody>
              ${items
                .map((it) => {
                  const name = it.food?.name || "Món đã xóa";
                  const qty = it.quantity || 0;
                  const price = it.food?.price || 0;
                  const line = price * qty || 0;
                  return `<tr><td>${name}</td><td class="right">${qty}</td><td class="right">${price.toLocaleString(
                    "vi-VN"
                  )}₫</td><td class="right">${line.toLocaleString(
                    "vi-VN"
                  )}₫</td></tr>`;
                })
                .join("")}
            </tbody>
          </table>
          <div style="margin-top:12px; text-align:right">
            <div>Thành tiền: ${p.subtotal?.toLocaleString("vi-VN") || 0}₫</div>
            <div>Thuế (${p.taxPercent || 8}%): ${
        p.taxAmount?.toLocaleString("vi-VN") || 0
      }₫</div>
            <div style="font-weight:bold; font-size:1.1em">Tổng: ${
              p.amount?.toLocaleString("vi-VN") || 0
            }₫</div>
            <div>Phương thức: ${p.method || "-"}</div>
          </div>
          <script>window.print();</script>
        </body></html>
      `;

      const w = window.open("", "_blank", "width=600,height=800");
      w.document.write(html);
      w.document.close();
    } catch (err) {
      console.error("Lỗi khi in hóa đơn", err);
    }
  };

  return (
    <div className="min-h-screen bg-white rounded-xl text-gray-900 p-8 shadow-lg animate-fade-in">
      {/* --- Tiêu đề --- */}
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-wide flex items-center gap-3">
          Quản lý Thanh Toán
        </h1>
        <div className="mt-2 flex flex-wrap gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setOrderToSplit(order);
              setIsSplitModalOpen(true);
            }}
            className="flex-none min-w-[160px] px-4 py-2 bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200 transition flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer"
          >
            <Split size={16} /> Tách hóa đơn
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              if ((pendingOrders || []).length < 2) {
                toast.warning("Cần ít nhất 2 đơn đang chờ thanh toán để gộp.");
                return;
              }
              // open merge modal — selection handled inside modal
              setOrdersToMerge([]);
              setIsMergeModalOpen(true);
            }}
            className="flex-none min-w-[160px] px-4 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer"
          >
            <Merge size={16} /> Ghép hóa đơn
          </button>
        </div>
        {/* Pagination controls moved to page bottom */}
      </div>

      {/* --- Đơn hàng cần thanh toán --- */}
      <section className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold tracking-wide text-green-600 flex items-center gap-3">
            <span className="inline-block w-2 h-8 bg-gradient-to-b from-green-400 to-green-600 rounded-full shadow-lg shadow-green-300/40"></span>
            Đơn hàng cần thanh toán
          </h2>
        </div>

        {pendingOrders.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-7">
            {pendingOrders.map((order) => (
              <div
                key={order._id}
                onClick={() => handleOpenModal(order)}
                className="group relative cursor-pointer rounded-2xl overflow-hidden border border-gray-300 bg-white shadow-md hover:shadow-green-300/30 hover:border-green-400 transition-all duration-300 hover:-translate-y-1"
              >
                {/* Overlay hover */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-gradient-to-tr from-green-100/20 via-transparent to-green-200/20 blur-2xl transition-all duration-500"></div>
                {/* Nội dung */}
                <div className="relative z-10 p-5 flex flex-col justify-between h-full">
                  <div className="mb-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Bàn{" "}
                        <span className="text-green-600 font-bold text-xl drop-shadow-[0_0_4px_rgba(34,197,94,0.5)]">
                          {order.table?.tableNumber || "?"}
                        </span>
                      </h3>
                      <span className="px-2 py-1 text-[10px] uppercase bg-green-100 text-green-600 rounded-md font-medium tracking-wider">
                        Đã phục vụ
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      Mã Order:{" "}
                      <span className="font-mono text-gray-700">
                        {order._id.slice(-6).toUpperCase()}
                      </span>
                    </p>

                    <p className="text-sm text-gray-700 mt-2">
                      Tổng tiền:{" "}
                      <span className="text-green-600 font-semibold text-lg">
                        {order?.totalAmount?.toLocaleString() || "0"}₫
                      </span>
                    </p>

                    <div className="mt-2 text-gray-700 text-sm max-h-32 overflow-y-auto pr-1">
                      {(order.items || []).map((item, i) => (
                        <p key={`item-${i}`} className="flex justify-between">
                          <span>
                            {item.food?.name || "Món đã xóa"} x {item.quantity}
                          </span>
                          <span className="text-green-600">
                            {(
                              item.food?.price * item.quantity || 0
                            ).toLocaleString()}
                            ₫
                          </span>
                        </p>
                      ))}
                      {(order.addedItems || []).map((item, i) => (
                        <p
                          key={`added-${i}`}
                          className="flex justify-between text-sm text-gray-400"
                        >
                          <span>
                            {item.food?.name || "Món đã xóa"} x {item.quantity}{" "}
                            (món thêm)
                          </span>
                          <span className="text-green-600">
                            {(
                              item.food?.price * item.quantity || 0
                            ).toLocaleString()}
                            ₫
                          </span>
                        </p>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-xs text-gray-500 border-t border-gray-300 pt-3 mt-auto">
                    <p>
                      {order.createdAt
                        ? new Date(order.createdAt).toLocaleString("vi-VN")
                        : ""}
                    </p>
                    <span className="text-gray-400/80 group-hover:text-green-600 transition-colors duration-300">
                      Thanh toán →
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <CreditCard size={64} className="mb-4 opacity-30" />
            <p className="text-lg font-medium">Không có đơn hàng</p>
            <p className="text-sm">Chưa có đơn hàng nào cần thanh toán</p>
          </div>
        )}
      </section>

      {/* --- Lịch sử Thanh Toán --- */}
      <section className="mt-12">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold tracking-wide text-blue-600 flex items-center gap-2">
            <span className="inline-block w-1.5 h-6 bg-blue-400 rounded-full"></span>
            Lịch sử Thanh Toán
          </h2>
        </div>

        <div className="overflow-x-auto bg-white rounded-2xl border border-gray-300 shadow-lg">
          <table className="min-w-full text-sm text-gray-900">
            <thead className="bg-gray-100 text-xs uppercase font-semibold tracking-wider">
              <tr>
                <th className="px-4 py-3 text-left">#</th>
                <th className="px-4 py-3 text-left">Mã Order</th>
                <th className="px-4 py-3 text-left">Phương thức</th>
                <th className="px-4 py-3 text-right">Số tiền</th>
                <th className="px-4 py-3 text-center">Trạng thái</th>
                <th className="px-4 py-3 text-left">Ngày thanh toán</th>
                <th className="px-4 py-3 text-center">Hành động</th>
              </tr>
            </thead>

            <tbody>
              {payments.length > 0 ? (
                payments.map((p, i) => (
                  <tr
                    key={p._id}
                    className="border-t border-gray-200 hover:bg-gray-50 transition-all duration-200 group"
                  >
                    <td className="px-4 py-3 font-medium text-gray-500">
                      {i + 1}
                    </td>
                    <td className="px-4 py-3 font-mono text-gray-700">
                      {p.order?._id || "-"}
                    </td>
                    <td className="px-4 py-3 capitalize text-gray-800">
                      {p.method || "-"}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-green-600">
                      {p?.amount?.toLocaleString() || "0"}₫
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium
                      ${
                        p.status === "completed"
                          ? "bg-green-100 text-green-600 border border-green-200"
                          : p.status === "failed"
                          ? "bg-red-100 text-red-600 border border-red-200"
                          : "bg-yellow-100 text-yellow-600 border border-yellow-200"
                      }`}
                      >
                        {p.status || "pending"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {new Date(p.paidAt).toLocaleDateString("vi-VN", {
                        timeZone: "Asia/Ho_Chi_Minh",
                      })}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex justify-center gap-3 opacity-80 group-hover:opacity-100 transition">
                        <button
                          onClick={() => fetchOrderDetail(p.order?._id)}
                          className="p-1.5 rounded bg-blue-100 hover:bg-blue-200 text-blue-600 transition-all duration-200 hover:shadow-lg cursor-pointer"
                          title="Xem chi tiết đơn hàng"
                        >
                          <Search size={16} />
                        </button>

                        <button
                          onClick={() => handlePrint(p._id)}
                          className="p-1.5 rounded bg-indigo-100 hover:bg-indigo-200 text-indigo-600 transition-all duration-200 hover:shadow-lg cursor-pointer"
                          title="In hóa đơn"
                        >
                          <Printer size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="7"
                    className="text-center py-8 text-gray-400 italic tracking-wide"
                  >
                    Chưa có thanh toán nào.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {isModalOpen && (
        <PaymentModal
          order={selectedOrder}
          payment={selectedPayment}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedOrder(null);
            setSelectedPayment(null);
          }}
          onSuccess={() => {
            fetchPayments();
            fetchPendingOrders();
          }}
        />
      )}

      {isOrderDetailOpen && (
        <OrderDetailModal
          orders={selectedOrderDetail}
          onClose={() => {
            setIsOrderDetailOpen(false);
            setSelectedOrderDetail(null);
          }}
        />
      )}

      {isMergeModalOpen && (
        <MergeModal
          pendingOrders={pendingOrders}
          onClose={() => setIsMergeModalOpen(false)}
          onMerged={() => {
            fetchPayments();
            fetchPendingOrders();
          }}
        />
      )}

      {/* Pagination controls (Chef-style) - placed at page bottom */}
      <div className="mt-6">
        <div className="flex items-center justify-between p-3 border-t bg-white">
          <div className="text-sm text-gray-600">
            Hiển thị{" "}
            <span className="font-semibold">
              {Math.min((page - 1) * limit + 1, total || 0)}
            </span>{" "}
            -{" "}
            <span className="font-semibold">
              {Math.min(page * limit, total || 0)}
            </span>{" "}
            trên <span className="font-semibold">{total || 0}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (page !== 1) {
                  setPage(1);
                  fetchPayments(1, limit);
                }
              }}
              disabled={page === 1}
              className="px-3 py-1 rounded-md bg-white border text-sm disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
            >
              {"<<"}
            </button>

            <button
              onClick={() => {
                if (page > 1) {
                  const np = Math.max(1, page - 1);
                  setPage(np);
                  fetchPayments(np, limit);
                }
              }}
              disabled={page === 1}
              className="px-3 py-1 rounded-md bg-white border text-sm disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
            >
              Prev
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: pages })
                .slice(Math.max(0, page - 3), Math.min(pages, page + 2))
                .map((_, idx) => {
                  const pageNum = idx + Math.max(1, page - 2);
                  return (
                    <button
                      key={pageNum}
                      onClick={() => {
                        setPage(pageNum);
                        fetchPayments(pageNum, limit);
                      }}
                      className={`px-3 py-1 rounded-md text-sm cursor-pointer ${
                        pageNum === page
                          ? "bg-gray-900 text-white"
                          : "bg-white border"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
            </div>

            <button
              onClick={() => {
                if (page < pages) {
                  const np = Math.min(pages, page + 1);
                  setPage(np);
                  fetchPayments(np, limit);
                }
              }}
              disabled={page === pages}
              className="px-3 py-1 rounded-md bg-white border text-sm disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
            >
              Next
            </button>

            <button
              onClick={() => {
                if (page !== pages) {
                  setPage(pages);
                  fetchPayments(pages, limit);
                }
              }}
              disabled={page === pages}
              className="px-3 py-1 rounded-md bg-white border text-sm disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
            >
              {">>"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPaymentManager;
