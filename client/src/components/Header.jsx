import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import LanguageSwitcher from "./LanguageSwitcher";
import axios from "axios";

const Header = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    axios
      .get("http://localhost:5002/api/auth/me", { withCredentials: true })
      .then((res) => setUser(res.data.user))
      .catch(() => setUser(null));
  }, []);

  const handleLogout = async () => {
    try {
      await axios.post("http://localhost:5002/api/auth/logout", {
        withCredentials: true,
      });
      setUser(null);
      navigate("/");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  return (
    <nav className="flex justify-between items-center mb-4 p-4 bg-gray-900 bg-opacity-80 rounded-lg shadow-lg">
      <Link
        to="/"
        className="text-xl font-bold text-blue-300 hover:text-blue-100 transition-colors"
      >
        RasaChain
      </Link>
      <div className="flex items-center gap-4">
        {/* <LanguageSwitcher /> */}
        {user ? (
          <div className="flex items-center gap-4">
            <span className="text-gray-300 text-sm">
              Welcome, {user.name} ({user.role})
            </span>
            <button
              className="bg-red-700 hover:bg-red-800 text-white px-4 py-2 rounded font-semibold transition-colors"
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
        ) : (
          <button
            className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded font-semibold transition-colors"
            onClick={() => navigate("/login")}
          >
            Login
          </button>
        )}
      </div>
    </nav>
  );
};

export default Header;
