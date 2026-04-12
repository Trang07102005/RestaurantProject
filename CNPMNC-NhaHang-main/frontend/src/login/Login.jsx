import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { AuthContext } from "./AuthContext";

const Login = () => {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [selectedRole, setSelectedRole] = useState(null);

  // Trạng thái đang auto-typing
  const [typing, setTyping] = useState(false);

  const demoUsers = [
    { label: "Admin", email: "admin@example.com", password: "123456" },
    { label: "Manager", email: "manager@example.com", password: "123123" },
    { label: "Waiter", email: "waiter@example.com", password: "123123" },
    { label: "Cashier", email: "cashier@example.com", password: "123123" },
    { label: "Chef", email: "chef@example.com", password: "123123" },
  ];

  // ⭐ HIỆU ỨNG GÕ TỪNG CHỮ
  // ⭐ HIỆU ỨNG GÕ TỪNG CHỮ - BẢN SỬA
  const typeText = (text, setter, speed = 50) => {
    return new Promise(async (resolve) => {
      setter("");
      await new Promise((r) => setTimeout(r, 50)); // đảm bảo reset xong

      let index = 0;

      const interval = setInterval(() => {
        // 👇 không dùng prev nữa → tránh lỗi ghi đè ký tự
        setter(text.slice(0, index + 1));
        index++;

        if (index >= text.length) {
          clearInterval(interval);
          resolve();
        }
      }, speed);
    });
  };

  // ⭐ Chọn tài khoản demo
  const handleSelectUser = async (user) => {
    setSelectedRole(user.label);
    setTyping(true);
    setShowPassword(false);

    // Gõ email trước → xong rồi gõ password
    await typeText(user.email, setEmail, 40);
    await typeText(user.password, setPassword, 60);

    setTyping(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (typing) return; // đang typing thì không cho submit

    const res = await login(email, password);

    if (res.success) {
      switch (res.user?.role) {
        case "Admin":
        case "Manager":
          navigate("/admin/dashboard");
          break;
        case "Waiter":
        case "Staff":
          navigate("/waiter/dashboard");
          break;
        case "Cashier":
          navigate("/cashier/dashboard");
          break;
        case "Chef":
          navigate("/chef/dashboard");
          break;
        default:
          navigate("/");
      }
    } else {
      setError(res.message || "Đăng nhập thất bại!");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100 px-4">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl p-10 animate-fadeIn border border-gray-100">
        <h2 className="text-3xl font-bold text-gray-800 text-center mb-16 flex items-center justify-center gap-3">
           ĐĂNG NHẬP HỆ THỐNG QUẢN LÝ NHÀ HÀNG
        </h2>

        {/* CÁC ROLE DEMO */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {demoUsers.map((u) => (
            <button
              key={u.label}
              onClick={() => handleSelectUser(u)}
              disabled={typing}
              className={`py-5 rounded-xl border transition-all duration-300 shadow-sm text-md font-bold cursor-pointer
  hover:shadow-lg hover:-translate-y-1 hover:scale-105 active:scale-95
  ${
    selectedRole === u.label
      ? "bg-gradient-to-r from-sky-400 via-sky-500 to-blue-600 text-white border-transparent shadow-lg"
      : "bg-white text-gray-700 border-gray-300 hover:border-blue-400 hover:bg-blue-50"
  }
  ${typing ? "opacity-50 cursor-not-allowed" : ""}
`}
            >
              {u.label}
            </button>
          ))}
        </div>

        {/* ERROR */}
        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-4 animate-shake">
            <p className="font-medium">{error}</p>
          </div>
        )}

        {/* FORM */}
        <form className="space-y-5" onSubmit={handleSubmit}>
          {/* EMAIL */}
          <div className="relative">
            <label className="text-gray-700 text-md font-medium">Email</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={typing}
              className={`mt-1 w-full px-4 py-4 border-2 rounded-lg outline-none 
                focus:ring-4 focus:ring-blue-200 focus:border-blue-500 transition-all duration-300
                hover:border-blue-300 bg-white
                ${typing ? "opacity-50 cursor-not-allowed" : ""}`}
              required
            />
          </div>

          {/* PASSWORD */}
          <div className="relative">
            <label className="text-gray-700 text-md font-medium">Mật khẩu</label>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={typing}
              className={`mt-1 w-full px-4 py-4 border-2 rounded-lg outline-none pr-12 
                focus:ring-4 focus:ring-blue-200 focus:border-blue-500 transition-all duration-300
                hover:border-blue-300 bg-white
                ${typing ? "opacity-50 cursor-not-allowed" : ""}`}
              required
            />

            {/* ICON */}
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-12 text-gray-500 hover:text-blue-600 transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer p-1 rounded-lg hover:bg-blue-50"
            >
              {showPassword ? <EyeOff size={25} /> : <Eye size={25} />}
            </button>
          </div>

          {/* LOGIN BUTTON */}
          <button
            type="submit"
            disabled={typing}
            className={`w-full py-5 rounded-xl font-semibold transition-all duration-300 shadow-md text-lg
              ${
                typing
                  ? "bg-gray-400 cursor-not-allowed opacity-70"
                  : "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              }
            `}
          >
            {typing ? "Đang điền thông tin..." : "Đăng nhập"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
