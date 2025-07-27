import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const Login = () => {
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState(""); // not used in backend but still captured
  const [role, setRole] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Get address from localStorage if available (set by SupplierDashboard)
  const getAddressFromStorage = () => {
    return localStorage.getItem("user_address") || "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !mobile || !password || !role) {
      setError(
        "Please fill all fields, including mobile number, and select a role."
      );
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const address = getAddressFromStorage();
      const response = await axios.post(
        "http://localhost:5002/api/auth/login",
        { email, mobile, password, role, address },
        { withCredentials: true } // 🔐 Needed for session cookies
      );
      const user = response.data?.user;

      if (!user) {
        throw new Error("No user returned from server.");
      }
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("loggedIn", "true");
      localStorage.setItem("agentId", user.id); // Save address for future use
      // Navigate based on role
      if (user.role === "vendor") {
        navigate("/vendor");
      } else if (user.role === "supplier") {
        navigate("/supplier");
      } else if (user.role === "delivery") {
        navigate("/delivery");
      } 
      // else {
      //   response = await axios.post(
      //     "http://localhost:5002/api/auth/login",
      //     { email, password, role },
      //     { withCredentials: true }
      //   );
       
      // }
    } catch (err) {
      console.error("Login error:", err);
      setError(
        err.response?.data?.message || "Login failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className=" min-w-6xl ms-9 flex  me-8 items-center justify-center bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 px-4">
      <form
        className="bg-transparent min-w-xl   rounded-3xl shadow-2xl p-8 md:p-12 flex flex-col gap-6"
        onSubmit={handleSubmit}
      >
        <h2 className="text-4xl font-extrabold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-blue-300 via-purple-300 to-pink-300 animate-pulse text-center">
          Login
        </h2>

        {error && (
          <div className="mb-2 text-red-400 text-center font-semibold bg-red-900 bg-opacity-50 p-3 rounded-lg">
            {error}
          </div>
        )}

        <div>
          <label className="block mb-2 font-semibold text-gray-100">
            Email
          </label>
          <input
            type="email"
            className="w-full px-4 py-3 border-2 border-blue-700 rounded-xl bg-gray-900 text-gray-100"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block mb-2 font-semibold text-gray-100">
            Mobile Number
          </label>
          <input
            type="tel"
            className="w-full px-4 py-3 border-2 border-green-700 rounded-xl bg-gray-900 text-gray-100"
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
            required
            pattern="[0-9]{10}"
            placeholder="Enter 10-digit mobile number"
          />
        </div>

        <div>
          <label className="block mb-2 font-semibold text-gray-100">
            Password
          </label>
          <input
            type="password"
            className="w-full px-4 py-3 border-2 border-purple-700 rounded-xl bg-gray-900 text-gray-100"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block mb-2 font-semibold text-gray-100">Role</label>
          <select
            className="w-full px-4 py-3 border-2 border-pink-700 rounded-xl bg-gray-900 text-gray-100"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            required
          >
            <option value="">Select Role</option>
            <option value="vendor">Vendor</option>
            <option value="supplier">Supplier</option>
            <option value="delivery">Delivery</option>
            {/* <option value="agent">Agent</option> */}
          </select>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-blue-700 via-purple-700 to-pink-700 text-white py-3 rounded-full font-bold text-xl hover:scale-105 transition-transform duration-200 disabled:opacity-50"
        >
          {loading ? "Logging in..." : "Login"}
        </button>

        {/* <div className="text-center text-gray-300 text-sm mt-4">
          <p>Demo Credentials:</p>
          <p>Vendor: vendor@example.com / password123</p>
          <p>Supplier: supplier@example.com / password123</p>
          <p>Delivery: delivery@example.com / password123</p>
        </div> */}
      </form>
    </div>
  );
};

export default Login;