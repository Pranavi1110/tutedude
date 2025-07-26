import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email || !password || !role) {
      setError("Please fill all fields and select a role.");
      return;
    }
    // Simulate login and navigation based on role
    if (role === "vendor") {
      localStorage.setItem("loggedIn", "true");
      navigate("/vendor");
    } else if (role === "supplier") {
      localStorage.setItem("loggedIn", "true");
      navigate("/supplier");
    } else if (role === "delivery") {
      localStorage.setItem("loggedIn", "true");
      navigate("/delivery");
    } else {
      setError("Invalid role selected.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen ">
      <form
        className=" p-8 rounded shadow-md w-full max-w-md"
        onSubmit={handleSubmit}
      >
        <h2 className="text-2xl font-bold mb-6 text-center">Login</h2>
        {error && <div className="mb-4 text-red-500 text-center">{error}</div>}
        <div className="mb-4">
          <label className="block mb-2 font-semibold">Email</label>
          <input
            type="email"
            className="w-full px-3 py-2 border rounded"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="mb-4">
          <label className="block mb-2 font-semibold">Password</label>
          <input
            type="password"
            className="w-full px-3 py-2 border rounded"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <div className="mb-6">
          <label className="block mb-2 font-semibold">Role</label>
          <select
            className="w-full px-3 py-2 border rounded"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            required
          >
            <option value="">Select Role</option>
            <option value="vendor">Vendor</option>
            <option value="supplier">Supplier</option>
            <option value="delivery">Delivery Agent</option>
          </select>
        </div>
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded font-semibold hover:bg-blue-700"
        >
          Login
        </button>
      </form>
    </div>
  );
};

export default Login;
