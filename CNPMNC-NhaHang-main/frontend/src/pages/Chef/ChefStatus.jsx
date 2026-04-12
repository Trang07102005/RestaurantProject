import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import {
    Clock,
    Flame,
    CheckCircle2,
    Loader2,
    CookingPot,
    Utensils,
    RefreshCw,
    ChefHat,
    ArrowLeft,
    Search,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const API_BASE_URL = "http://localhost:2095/api/orders";

// UI Status
const STATUS_FILTERS = {
    ALL: "all",
    PENDING: "pending",
    COOKING: "cooking",
};

// Map Backend → UI
const mapBackendToUI = (backendStatus) => {
    if (!backendStatus) return STATUS_FILTERS.PENDING;
    const s = String(backendStatus).toLowerCase();
    if (s === 'cancel' || s === 'canceled' || s === 'cancelled') return 'cancelled';
    if (s === "pending") return STATUS_FILTERS.PENDING;
    // backend uses 'preparing' for cooking
    if (s === "preparing" || s === "cooking") return STATUS_FILTERS.COOKING;
    if (s === "ready" || s === "completed") return "completed";
    return STATUS_FILTERS.PENDING;
};

// Detect canceled-like statuses
const isCanceled = (status) => {
    if (!status) return false;
    const s = String(status).toLowerCase();
    return s === 'cancel' || s === 'canceled' || s === 'cancelled';
};

const ChefStatus = () => {
    const navigate = useNavigate();

    const [itemsList, setItemsList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState(null);
    const [currentFilter, setCurrentFilter] = useState(STATUS_FILTERS.ALL);

    // Search + Sort
    const [searchText, setSearchText] = useState("");
    const [sortOption, setSortOption] = useState("time_desc");
    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [searchInput, setSearchInput] = useState("");
    // Load API
    const fetchItems = useCallback(async () => {
        try {
            const res = await axios.get(API_BASE_URL);
            const orders = Array.isArray(res.data) ? res.data : [];

            // Flatten items and addedItems into a single list with context
            const flatList = orders.flatMap((o) => {
                const orderTime = o.createdAt || o.orderTime || null;
                const tableName = o.table ? (typeof o.table === 'object' ? (o.table.tableNumber ?? o.table.name ?? '') : o.table) : '';

                const items = (o.items || []).map((it) => ({
                    _id: it._id,
                    orderId: o._id,
                    orderTime,
                    tableName,
                    itemName: it.food?.name ?? it.food ?? it.name,
                    quantity: it.quantity ?? 1,
                    status: it.status ?? 'pending',
                }));

                const added = (o.addedItems || []).map((it) => ({
                    _id: it._id,
                    orderId: o._id,
                    orderTime,
                    tableName,
                    itemName: it.food?.name ?? it.food ?? it.name,
                    quantity: it.quantity ?? 1,
                    status: it.status ?? 'pending',
                }));

                return [...items, ...added];
            });

            setItemsList(flatList);
        } catch (err) {
            console.error("Lỗi tải dữ liệu:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchItems();
        const timer = setInterval(fetchItems, 15000);
        return () => clearInterval(timer);
    }, [fetchItems]);

    // Update Status
    const mapUIToBackend = (uiStatus) => {
        if (uiStatus === STATUS_FILTERS.COOKING) return 'preparing';
        if (uiStatus === 'completed') return 'ready';
        return 'pending';
    }

    const handleUpdateStatus = async (orderId, itemId, newStatus) => {
        setUpdatingId(itemId);
        try {
            const payload = { status: mapUIToBackend(newStatus) };
            await axios.patch(`${API_BASE_URL}/${orderId}/items/${itemId}`, payload);
            await fetchItems();
        } catch (err) {
            console.error("Update status error:", err);
            // Show server-provided message if available
            const serverMsg = err?.response?.data?.error || err?.response?.data?.message;
            const statusCode = err?.response?.status;
            if (serverMsg) {
                alert(`Lỗi server ${statusCode || ''}: ${serverMsg}`);
            } else if (err.message) {
                alert(`Lỗi: ${err.message}`);
            } else {
                alert('Không thể cập nhật trạng thái (lỗi không xác định).');
            }
        } finally {
            setUpdatingId(null);
        }
    };

    // FILTER
    // Exclude canceled items entirely.
    let visibleItems = itemsList.filter((i) => {
        if (isCanceled(i.status)) return false;
        const uiStatus = mapBackendToUI(i.status);
        if (currentFilter === STATUS_FILTERS.ALL) {
            // show actionable only (pending + cooking)
            return uiStatus === STATUS_FILTERS.PENDING || uiStatus === STATUS_FILTERS.COOKING;
        }
        return uiStatus === currentFilter;
    });

    // SEARCH
    if (searchText.trim() !== "") {
        const s = searchText.toLowerCase();
        visibleItems = visibleItems.filter(
            (i) =>
                (i.itemName || '').toString().toLowerCase().includes(s) ||
                String(i.tableName || '').toLowerCase().includes(s)
        );
    }

    // SORT
    visibleItems = [...visibleItems].sort((a, b) => {
        const tA = new Date(a.orderTime).getTime();
        const tB = new Date(b.orderTime).getTime();

        switch (sortOption) {
            case "time_desc":
                return tB - tA;
            case "time_asc":
                return tA - tB;
            case "name_asc":
                return a.itemName.localeCompare(b.itemName);
            case "name_desc":
                return b.itemName.localeCompare(a.itemName);
            case "status":
                const order = { pending: 1, cooking: 2, completed: 3 };
                return (
                    order[mapBackendToUI(a.status)] - order[mapBackendToUI(b.status)]
                );
            default:
                return 0;
        }
    });

    const totalPending = itemsList.filter(
        (i) => !isCanceled(i.status) && mapBackendToUI(i.status) === STATUS_FILTERS.PENDING
    ).length;

    const totalCooking = itemsList.filter(
        (i) => !isCanceled(i.status) && mapBackendToUI(i.status) === STATUS_FILTERS.COOKING
    ).length;

    // actionable = pending + cooking (used for "Tất cả" count)
    const totalActionable = itemsList.filter(
        (i) => {
            if (isCanceled(i.status)) return false;
            const s = mapBackendToUI(i.status);
            return s === STATUS_FILTERS.PENDING || s === STATUS_FILTERS.COOKING;
        }
    ).length;

    // Pagination calculations
    const totalItems = visibleItems.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

    // Reset to first page when filters/search/sort/pageSize change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchText, currentFilter, sortOption, pageSize]);

    // Clamp currentPage if needed
    useEffect(() => {
        if (currentPage > totalPages) setCurrentPage(totalPages);
    }, [totalPages]);

    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const pagedItems = visibleItems.slice(startIndex, endIndex);

    // UI
    if (loading && itemsList.length === 0) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-50 text-gray-500">
                <Loader2 className="w-8 h-8 animate-spin mr-3 text-orange-500" />
                <span className="text-lg">Đang tải dữ liệu...</span>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6 md:p-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate("/chef/dashboard")}
                        title="Quay lại Dashboard"
                        className="p-2 rounded-xl hover:bg-gray-200 transition text-gray-600 cursor-pointer"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </button>

                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-3 text-gray-800">
                            <ChefHat className="w-8 h-8 text-orange-500" />
                            Trạng Thái Món Ăn
                        </h1>
                        <p className="text-gray-500">Theo dõi & cập nhật quá trình nấu</p>
                    </div>
                </div>

                <button
                    onClick={async () => {
                        setLoading(true);

                        // Reset filter/search/pagination
                        setCurrentFilter(STATUS_FILTERS.ALL);
                        setSearchText("");
                        setSearchInput("");
                        setSortOption("time_desc");
                        setCurrentPage(1);

                        try {
                            await fetchItems(); // fetchItems đã return promise
                        } catch (err) {
                            console.error(err);
                        } finally {
                            setLoading(false);
                        }
                    }}
                    title="Làm mới dữ liệu"
                    className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-100 shadow-sm flex items-center gap-2 cursor-pointer"
                >
                    <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
                    Làm mới
                </button>


            </div>

            {/* Filter + Search + Sort */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
                {/* FILTER TRẠNG THÁI */}
                <div className="flex gap-3">
                    <button
                        onClick={() => setCurrentFilter(STATUS_FILTERS.ALL)}
                        title="Hiển thị tất cả món"
                        className={`px-5 py-2 rounded-full font-medium cursor-pointer ${currentFilter === STATUS_FILTERS.ALL
                            ? "bg-gray-900 text-white"
                            : "bg-white border text-gray-700"
                            }`}
                    >
                        Tất cả ({totalActionable})
                    </button>

                    <button
                        onClick={() => setCurrentFilter(STATUS_FILTERS.PENDING)}
                        title="Món đang chờ"
                        className={`px-5 py-2 rounded-full font-medium cursor-pointer ${currentFilter === STATUS_FILTERS.PENDING
                            ? "bg-red-600 text-white"
                            : "bg-white border text-red-600"
                            }`}
                    >
                        Đang chờ ({totalPending})
                    </button>

                    <button
                        onClick={() => setCurrentFilter(STATUS_FILTERS.COOKING)}
                        title="Món đang nấu"
                        className={`px-5 py-2 rounded-full font-medium cursor-pointer ${currentFilter === STATUS_FILTERS.COOKING
                            ? "bg-blue-600 text-white"
                            : "bg-white border text-blue-600"
                            }`}
                    >
                        Đang nấu ({totalCooking})
                    </button>
                </div>

                <div className="relative flex-1 flex gap-2">
                    <div className="relative flex-1">
                        <Search className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Tìm theo tên món hoặc bàn..."
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            className="pl-10 pr-4 py-2 w-full bg-white border rounded-xl shadow-sm focus:ring-2 focus:ring-orange-400"
                        />
                    </div>
                    <button
                        onClick={() => setSearchText(searchInput)}
                        title="Tìm kiếm món ăn"
                        className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl shadow-sm cursor-pointer"
                    >
                        Tìm kiếm
                    </button>
                </div>

                <select
                    value={sortOption}
                    onChange={(e) => setSortOption(e.target.value)}
                    title="Sắp xếp"
                    className="px-4 py-2 bg-white border rounded-xl shadow-sm cursor-pointer"
                >
                    <option value="time_desc">Thời gian: Mới → Cũ</option>
                    <option value="time_asc">Thời gian: Cũ → Mới</option>
                    <option value="name_asc">Tên món: A → Z</option>
                    <option value="name_desc">Tên món: Z → A</option>
                    <option value="status">Trạng thái</option>
                </select>


                {/* PAGE SIZE */}
                <select
                    value={pageSize}
                    onChange={(e) => setPageSize(Number(e.target.value))}
                    title="Số món mỗi trang"
                    className="px-3 py-2 bg-white border rounded-xl shadow-sm cursor-pointer"
                >
                    <option value={5}>5 / trang</option>
                    <option value={10}>10 / trang</option>
                    <option value={20}>20 / trang</option>
                </select>
            </div>

            {/* TABLE */}
            <div className="bg-white rounded-2xl shadow-xl border overflow-hidden">
                <div className="p-6 border-b flex items-center gap-3">
                    <div className="p-2 bg-orange-100 text-orange-600 rounded-lg">
                        <Utensils className="w-6 h-6" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-800">Danh sách món</h2>
                    <span className="px-3 py-1 bg-gray-100 rounded-full text-gray-600 text-sm">
                        {visibleItems.length} món
                    </span>
                </div>

                {pagedItems.length === 0 ? (
                    <div className="text-center py-20">
                        <CookingPot className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 text-lg">Không có món nào</p>
                        <p className="text-gray-400">Bếp đang trống, nghỉ thôi 🤣</p>
                    </div>
                ) : (
                    <table className="w-full">
                        <thead>
                            <tr className="bg-gray-50 text-left text-sm text-gray-500 uppercase border-b">
                                <th className="py-4 px-6">Thời gian</th>
                                <th className="py-4 px-6">Bàn</th>
                                <th className="py-4 px-6">Tên món</th>
                                <th className="py-4 px-6 text-center">SL</th>
                                <th className="py-4 px-6">Trạng thái</th>
                                <th className="py-4 px-6 text-right">Hành động</th>
                            </tr>
                        </thead>

                        <tbody className="divide-y">
                            {pagedItems.map((item) => {
                                const uiStatus = mapBackendToUI(item.status);
                                const isPending = uiStatus === STATUS_FILTERS.PENDING;
                                const isCooking = uiStatus === STATUS_FILTERS.COOKING;

                                return (
                                    <tr
                                        key={item._id}
                                        className={`transition ${isCooking ? "bg-blue-50/40" : "hover:bg-gray-50"
                                            }`}
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-gray-700">
                                                <Clock className="w-4 h-4" />
                                                {new Date(item.orderTime).toLocaleTimeString("vi-VN", {
                                                    hour: "2-digit",
                                                    minute: "2-digit",
                                                })}
                                            </div>
                                        </td>

                                        <td className="px-6 py-4">
                                            <span className="font-bold bg-gray-100 px-3 py-1 rounded-lg">
                                                {item.tableName}
                                            </span>
                                        </td>

                                        <td className="px-6 py-4 font-medium text-gray-800">
                                            {item.itemName}
                                        </td>

                                        <td className="px-6 py-4 text-center">
                                            <span className="text-lg font-bold text-orange-600 bg-orange-50 px-4 py-1 rounded-full">
                                                {item.quantity}
                                            </span>
                                        </td>

                                        <td className="px-6 py-4">
                                            {isPending && (
                                                <span className="px-3 py-1.5 bg-red-100 text-red-700 rounded-full font-semibold">
                                                    Đang chờ
                                                </span>
                                            )}
                                            {isCooking && (
                                                <span className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full font-semibold flex items-center gap-1">
                                                    <Flame className="w-4 h-4 animate-pulse" />
                                                    Đang nấu
                                                </span>
                                            )}
                                        </td>

                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-3">
                                                {isPending && (
                                                    <button
                                                        onClick={() =>
                                                            handleUpdateStatus(
                                                                item.orderId,
                                                                item._id,
                                                                "cooking"
                                                            )
                                                        }
                                                        disabled={updatingId === item._id}
                                                        title="Bắt đầu nấu món này"
                                                        className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                                                    >
                                                        {updatingId === item._id ? (
                                                            <Loader2 className="w-5 h-5 animate-spin" />
                                                        ) : (
                                                            <>
                                                                <Flame className="w-5 h-5" />
                                                                Nấu
                                                            </>
                                                        )}
                                                    </button>
                                                )}

                                                {isCooking && (
                                                    <button
                                                        onClick={() =>
                                                            handleUpdateStatus(
                                                                item.orderId,
                                                                item._id,
                                                                "completed"
                                                            )
                                                        }
                                                        disabled={updatingId === item._id}
                                                        title="Đánh dấu hoàn thành"
                                                        className="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                                                    >
                                                        {updatingId === item._id ? (
                                                            <Loader2 className="w-5 h-5 animate-spin" />
                                                        ) : (
                                                            <>
                                                                <CheckCircle2 className="w-5 h-5" />
                                                                Xong
                                                            </>
                                                        )}
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
                {/* Pagination controls */}
                {totalItems > 0 && (
                    <div className="flex items-center justify-between p-4 border-t bg-white">
                        <div className="text-sm text-gray-600">
                            Hiển thị <span className="font-semibold">{Math.min(startIndex + 1, totalItems)}</span> - <span className="font-semibold">{Math.min(endIndex, totalItems)}</span> trên <span className="font-semibold">{totalItems}</span>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCurrentPage(1)}
                                disabled={currentPage === 1}
                                title="Trang đầu tiên"
                                className="px-3 py-1 rounded-md bg-white border text-sm disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                            >
                                {'<<'}
                            </button>
                            <button
                                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                title="Trang trước"
                                className="px-3 py-1 rounded-md bg-white border text-sm disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                            >
                                Prev
                            </button>

                            {/* numeric pages - show window of pages */}
                            <div className="flex items-center gap-1">
                                {Array.from({ length: totalPages }).slice(Math.max(0, currentPage - 3), Math.min(totalPages, currentPage + 2)).map((_, idx) => {
                                    const pageNum = idx + Math.max(1, currentPage - 2);
                                    return (
                                        <button
                                            key={pageNum}
                                            onClick={() => setCurrentPage(pageNum)}
                                            title={`Trang ${pageNum}`}
                                            className={`px-3 py-1 rounded-md text-sm cursor-pointer ${pageNum === currentPage ? 'bg-gray-900 text-white' : 'bg-white border'}`}
                                        >
                                            {pageNum}
                                        </button>
                                    );
                                })}
                            </div>

                            <button
                                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                title="Trang tiếp theo"
                                className="px-3 py-1 rounded-md bg-white border text-sm disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                            >
                                Next
                            </button>
                            <button
                                onClick={() => setCurrentPage(totalPages)}
                                disabled={currentPage === totalPages}
                                title="Trang cuối cùng"
                                className="px-3 py-1 rounded-md bg-white border text-sm disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                            >
                                {'>>'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChefStatus;
