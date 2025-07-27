import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
const API_BASE_URL = import.meta.env.VITE_API_URL;
const Home = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    setLoggedIn(!!localStorage.getItem("loggedIn"));
  }, []);

  // const handleLogin = () => {
  //   navigate("/login");
  // };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 px-4">
      <div className=" bg-transparent rounded-3xl shadow-2xl p-8 md:p-12 flex flex-col items-center">
        <h1 className="text-5xl md:text-6xl font-extrabold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-300 via-purple-300 to-pink-300 animate-pulse text-center">
          Thoda pyazz Dalo!
        </h1>
        <p className="text-lg md:text-2xl font-medium text-gray-100 mb-8 text-center max-w-xl">
          Empowering street food vendors, suppliers, and delivery agents with a
          seamless, digital supply chain platform. Discover, connect, and grow
          your business with ThodaPyazzDalo!.
        </p>
        <div className="w-full flex flex-col items-center gap-6">
          {/* {!loggedIn ? (
            <>
              // <button
                className="bg-gradient-to-r from-blue-700 via-purple-700 to-pink-700 text-white px-10 py-3 rounded-full font-bold text-xl shadow-lg hover:scale-105 transition-transform duration-200 focus:outline-none focus:ring-4 focus:ring-blue-300 mb-4"
                 onClick={handleLogin}
              >
                 Login
               </button>
              <Link to="/agent-register">
                <button className="bg-green-600  px-10 py-3 rounded-full font-bold text-xl shadow-lg hover:scale-105 transition-transform duration-200 focus:outline-none focus:ring-4 focus:ring-green-300">
                  Register as Delivery Agent
                </button>
              </Link>
            </>
          ) : ( */}
            <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
              <Link to="/login" className="block">
                <div className="bg-blue-900 bg-opacity-70 p-6 rounded-xl border-2 border-blue-700 hover:shadow-xl transition-shadow text-white text-center">
                  <h2 className="text-2xl font-bold mb-2">
                    {t("vendor_dashboard")}
                  </h2>
                  <p className="text-blue-100">
                    Browse products, place orders, and track deliveries
                  </p>
                </div>
              </Link>
              <Link to="/login" className="block">
                <div className="bg-purple-900 bg-opacity-70 p-6 rounded-xl border-2 border-purple-700 hover:shadow-xl transition-shadow text-white text-center">
                  <h2 className="text-2xl font-bold mb-2">
                    {t("supplier_dashboard")}
                  </h2>
                  <p className="text-purple-100">
                    Manage products, view orders, and update inventory
                  </p>
                </div>
              </Link>
              <Link to="/login" className="block">
                <div className="bg-pink-900 bg-opacity-70 p-6 rounded-xl border-2 border-pink-700 hover:shadow-xl transition-shadow text-white text-center">
                  <h2 className="text-2xl font-bold mb-2">
                    {t("delivery_dashboard")}
                  </h2>
                  <p className="text-pink-100">
                    Accept deliveries, track orders, and manage routes
                  </p>
                </div>
              </Link>
            </div>
          {/* )} */}
        </div>
        <div className="mt-10 w-full max-w-lg">
          <div className="bg-gradient-to-r from-blue-900 via-purple-900 to-pink-900 bg-opacity-80 rounded-2xl p-6 shadow-inner text-gray-100 text-center">
            <h3 className="text-xl font-bold mb-2">Why ThodaPyazzDalo?</h3>
            <ul className="list-disc list-inside text-left text-base md:text-lg mx-auto max-w-md">
              <li className="mb-1">Easy order management for vendors</li>
              <li className="mb-1">
                Efficient inventory and order tracking for suppliers
              </li>
              <li className="mb-1">
                Streamlined delivery assignment and tracking
              </li>
              <li className="mb-1">Multi-language support for inclusivity</li>
              <li className="mb-1">Mobile-first, responsive design</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
