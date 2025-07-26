import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";

const Home = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    setLoggedIn(!!localStorage.getItem("loggedIn"));
  }, []);

  const handleLogin = () => {
    navigate("/login");
  };

  const handleLogout = () => {
    localStorage.removeItem("loggedIn");
    setLoggedIn(false);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4">RasaChain</h1>
        <p className="text-xl text-gray-600 mb-8">
          Connecting street food vendors with suppliers and delivery agents
        </p>
        {!loggedIn ? (
          <button
            className="bg-blue-600 text-white px-6 py-2 rounded font-semibold hover:bg-blue-700"
            onClick={handleLogin}
          >
            Login
          </button>
        ) : (
          <button
            className="bg-red-500 text-white px-6 py-2 rounded font-semibold hover:bg-red-600"
            onClick={handleLogout}
          >
            Logout
          </button>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link to="/vendor" className="block">
          <div className="bg-blue-50 p-6 rounded-lg border hover:shadow-lg transition-shadow">
            <h2 className="text-2xl font-semibold text-blue-800 mb-2">
              {t("vendor_dashboard")}
            </h2>
            <p className="text-gray-600">
              Browse products, place orders, and track deliveries
            </p>
          </div>
        </Link>

        <Link to="/supplier" className="block">
          <div className="bg-green-50 p-6 rounded-lg border hover:shadow-lg transition-shadow">
            <h2 className="text-2xl font-semibold text-green-800 mb-2">
              {t("supplier_dashboard")}
            </h2>
            <p className="text-gray-600">
              Manage products, view orders, and update inventory
            </p>
          </div>
        </Link>

        <Link to="/delivery" className="block">
          <div className="bg-orange-50 p-6 rounded-lg border hover:shadow-lg transition-shadow">
            <h2 className="text-2xl font-semibold text-orange-800 mb-2">
              {t("delivery_dashboard")}
            </h2>
            <p className="text-gray-600">
              Accept deliveries and track order status
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
};

export default Home;
