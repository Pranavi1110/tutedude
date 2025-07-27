
import React, { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import axios from "axios";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import apiService from "../services/api";
const API_BASE_URL = import.meta.env.VITE_API_URL;
const VendorDashboard = () => {
  const { t } = useTranslation();
  const [cart, setCart] = useState(() => {
    const savedCart = localStorage.getItem("vendorCart");
    return savedCart ? JSON.parse(savedCart) : [];
  });
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [priceFilter, setPriceFilter] = useState("");
  const [supplierFilter, setSupplierFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Order stats for chart
  const [orderStats, setOrderStats] = useState({
    daily: [],
    weekly: [],
    monthly: [],
  });
  const [orderStatsType, setOrderStatsType] = useState("daily");

  // Fetch order stats for chart

  // const agentId=localStorage.getItem("agentId");
  
  // useEffect(() => {
  //   // setUser(localStorage.getItem("user"));
  //   setUser(JSON.parse(localStorage.getItem("user")));
  //     console.log(user)
  //     fetchProducts();
  //   console.log("Fetching order stats for user:", user?.id);
  //   // console.log("Fetching order stats for user:", user?.id);
  //   if (!user || !user.id) return;
  //   apiService.vendor
  //     .getOrderStats(user.id)
  //     .then(setOrderStats)
  //     .catch(() => setOrderStats({ daily: [], weekly: [], monthly: [] }));
  // }, [user]);
  useEffect(() => {
  const localUser = JSON.parse(localStorage.getItem("user"));
  setUser(localUser);
  if (!localUser || !localUser.id) return;
  fetchProducts();
  console.log("Fetching order stats for user:", localUser.id);
  apiService.vendor
    .getOrderStats(localUser.id)
    .then(setOrderStats)
    .catch(() => setOrderStats({ daily: [], weekly: [], monthly: [] }));
}, []);
  console.log(orderStats);

  // AI-powered features
  const [recommended, setRecommended] = useState([]);
  const [trending, setTrending] = useState([]);
  const [loadingAI, setLoadingAI] = useState(false);

  const navigate = useNavigate();

  // Fetch recommendations & trending products after products and user are loaded
  useEffect(() => {
    if (!user || !user.id || products.length === 0) return;
    setLoadingAI(true);

    (async () => {
      let recData = await apiService.vendor
        .getRecommendedProducts(user.id)
        .catch(() => []);
      console.log("Recommendations:", recData);
      let trendData = await apiService.vendor
        .getTrendingProducts()
        .catch(() => []);
      // Fallback logic if APIs return empty
      if ((!recData || recData.length === 0) && products.length > 0) {
        recData = [...products].sort((a, b) => a.price - b.price).slice(0, 5);
      }
      if ((!trendData || trendData.length === 0) && products.length > 0) {
        trendData = [...products].sort((a, b) => b.price - a.price).slice(0, 5);
      }
      setRecommended(recData || []);
      setTrending(trendData || []);
      setLoadingAI(false);
    })();
  }, [user, products]);
  console.log("Recommended:", recommended);

  // Load user and products
  // useEffect(() => {
  //   // axios
  //    setUser(localStorage.getItem("user"));
  //    console.log(user)
  //   //   .get(`${API_BASE_URL}/api/auth/me`, { withCredentials: true })
  //   //   .then((res) => {
  //   //     console.log("give me",res.data.user)
  //   //     setUser(res.data.user);
  //   //     if (res.data.user) {
  //   //       localStorage.setItem("user", JSON.stringify(res.data.user));
  //   //     }
  //       // setUser(localStorage.getItem("user"));
  //       if(user){
  //       fetchProducts();}
  //     // })
  // //     .catch(() => {
  // //       setUser(null);
  // //       fetchProducts();
  // //     });
  // // }, []);
  // },[]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const data = await apiService.vendor.getProducts();
      setProducts(data);
    } catch (err) {
      setError("Failed to fetch products");
      console.error("Error fetching products:", err);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (product) => {
    const updatedCart = [...cart, product];
    setCart(updatedCart);
    localStorage.setItem("vendorCart", JSON.stringify(updatedCart));
  };

  const handlePlaceOrderClick = () => {
    if (cart.length === 0 || !user) return;
    navigate("/place-order", { state: { cart, user } });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 text-xl">
        Loading products...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64 text-red-500 text-xl">
        {error}
      </div>
    );
  }

  // Supplier list for filter
  const uniqueSuppliers = Array.from(
    new Set(products.map((p) => p.supplierId?.name || "Unknown"))
  ).filter((name) => name && name !== "Unknown");

  // Filter and sort products
  let filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );
  if (supplierFilter) {
    filteredProducts = filteredProducts.filter(
      (p) => p.supplierId?.name === supplierFilter
    );
  }
  if (priceFilter === "low-high") {
    filteredProducts.sort((a, b) => a.price - b.price);
  } else if (priceFilter === "high-low") {
    filteredProducts.sort((a, b) => b.price - a.price);
  }

  // Pagination
  const itemsPerPage = 6;
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };
  console.log(orderStats[orderStatsType]);
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex flex-col items-center p-4 md:p-8">
      <div className="w-full min-w-6xl bg-transparent rounded-3xl shadow-2xl p-6 md:p-8 mt-4">
        {/* Order Statistics Chart */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xl font-bold text-yellow-300">Order Trends</h3>
            <button
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-full font-bold shadow ml-4"
              onClick={() => navigate("/past-orders", { state: { user } })}
            >
              {t("past_orders")}
            </button>
          </div>
          <div className="flex gap-2 mb-2">
            <button
              onClick={() => setOrderStatsType("daily")}
              className={`px-3 py-1 rounded ${
                orderStatsType === "daily"
                  ? "bg-yellow-500 text-white"
                  : "bg-gray-700 text-yellow-200"
              }`}
            >
              Day
            </button>
            <button
              onClick={() => setOrderStatsType("weekly")}
              className={`px-3 py-1 rounded ${
                orderStatsType === "weekly"
                  ? "bg-yellow-500 text-white"
                  : "bg-gray-700 text-yellow-200"
              }`}
            >
              Week
            </button>
            <button
              onClick={() => setOrderStatsType("monthly")}
              className={`px-3 py-1 rounded ${
                orderStatsType === "monthly"
                  ? "bg-yellow-500 text-white"
                  : "bg-gray-700 text-yellow-200"
              }`}
            >
              Month
            </button>
          </div>
          <div className="w-full h-64 bg-gray-900 rounded-xl p-4 flex items-center justify-center">
            {orderStats[orderStatsType] &&
            orderStats[orderStatsType].length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={orderStats[orderStatsType]}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="_id"
                    tick={{ fill: "#facc15", fontSize: 12 }}
                  />
                  <YAxis
                    tick={{ fill: "#facc15", fontSize: 12 }}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{ background: "#222", color: "#facc15" }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#facc15"
                    strokeWidth={3}
                    name="Orders"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <span className="text-yellow-200 text-lg">
                No order data to display yet.
              </span>
            )}
          </div>
        </div>

        {/* AI Section */}
        {loadingAI ? (
          <div className="text-blue-300 mb-6">Loading AI insights...</div>
        ) : (
          <>
            {recommended.length > 0 && (
              <div className="mb-8">
                <h3 className="text-xl font-bold text-green-300 mb-2">
                  Personalized Recommendations
                </h3>
                <div className="flex flex-wrap gap-4">
                  {recommended.map((p) => (
                    <div
                      key={p._id}
                      className="border border-green-400 rounded-xl p-4 bg-green-900 bg-opacity-40 min-w-[200px]"
                    >
                      <img
                        src={
                          p.image ||
                          "https://via.placeholder.com/150x100?text=No+Image"
                        }
                        alt={p.name}
                        className="w-full h-32 object-cover rounded-lg mb-3 border border-green-500"
                      />
                      <div className="font-semibold text-green-100">
                        {p.name}
                      </div>
                      <div className="text-green-200">₹{p.price}</div>
                      <button
                        className="mt-2 px-3 py-1 bg-green-600  rounded hover:bg-green-700 text-white"
                        onClick={() => addToCart(p)}
                      >
                        Add to Cart
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {trending.length > 0 && (
              <div className="mb-8">
                <h3 className="text-xl font-bold text-pink-300 mb-2">
                  Demand Spikes (Trending)
                </h3>
                <div className="flex flex-wrap gap-4">
                  {trending.map((p) => (
                    <div
                      key={p._id}
                      className="border border-pink-400 rounded-xl p-4 bg-pink-900 bg-opacity-40 min-w-[200px]"
                    >
                      <img
                        src={
                          p.image ||
                          "https://via.placeholder.com/150x100?text=No+Image"
                        }
                        alt={p.name}
                        className="w-full h-32 object-cover rounded-lg mb-3 border border-green-500"
                      />
                      <div className="font-semibold text-pink-100">
                        {p.name}
                      </div>
                      <div className="text-pink-200">
                        ₹{p.price} ({p.demandScore || "High Demand"})
                      </div>
                      <button
                        className="mt-2 px-3 py-1 bg-pink-600  rounded hover:bg-pink-700 text-white"
                        onClick={() => addToCart(p)}
                      >
                        Add to Cart
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6 items-center w-full">
          <label className="text-white font-semibold" htmlFor="search-bar">
            Search:
          </label>
          <input
            id="search-bar"
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-3 pr-4 py-2 w-full md:w-80 rounded border border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-white bg-transparent"
          />
          <label className="text-white font-semibold">Price:</label>
          <select
            value={priceFilter}
            onChange={(e) => setPriceFilter(e.target.value)}
            className="px-4 py-2 rounded border border-blue-400 text-white"
          >
            <option value="">Sort by Price</option>
            <option value="low-high">Low to High</option>
            <option value="high-low">High to Low</option>
          </select>
          <label className="text-white font-semibold">Supplier:</label>
          <select
            value={supplierFilter}
            onChange={(e) => setSupplierFilter(e.target.value)}
            className="px-4 py-2 rounded border border-blue-400 text-white"
          >
            <option value="">All Suppliers</option>
            {uniqueSuppliers.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>

        {/* Past Orders Button */}
        {/* <div className="flex justify-end mb-6">
          <button
            className="bg-green-500 hover:bg-green-600 text-black px-4 py-2 rounded-full font-bold shadow"
            onClick={() => navigate('/past-orders', { state: { user } })}
          >
            {t("past_orders")}
          </button>
        </div> */}

        {/* Products */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <h3 className="text-2xl font-bold mb-6 text-blue-200">
              Available Products
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {paginatedProducts.map((p) => (
                <div
                  key={p._id}
                  className="border-2 border-blue-700 rounded-2xl p-6 bg-blue-900 bg-opacity-70"
                >
                  <img
                    src={
                      p.image ||
                      "https://via.placeholder.com/200x150?text=No+Image"
                    }
                    alt={p.name}
                    className="w-full h-40 object-cover rounded-xl mb-4 border border-blue-500"
                  />

                  <h4 className="font-bold text-lg mb-2 text-blue-100">
                    {p.name}
                  </h4>
                  <p className="text-green-200 font-semibold">
                    {p.price}/{p.unit}
                  </p>
                  <p className="text-sm text-blue-300">
                    Stock: {p.stock} {p.unit}
                  </p>
                  <p className="text-sm text-yellow-300">
                    Supplier: {p.supplierId?.name || "Unknown"}
                  </p>
                  <div className="flex flex-row flex-wrap gap-2 mt-4 items-center">
                    <button
                      onClick={() => addToCart(p)}
                      className="bg-gradient-to-r from-blue-700 via-purple-700 to-pink-700 text-white px-6 py-2 rounded-full"
                    >
                      Add to Cart
                    </button>
                  </div>
                  {/* Contact Supplier */}
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-6 gap-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1 bg-blue-700 text-white rounded"
                >
                  Prev
                </button>
                {[...Array(totalPages)].map((_, idx) => (
                  <button
                    key={idx + 1}
                    onClick={() => handlePageChange(idx + 1)}
                    className={`px-3 py-1 rounded ${
                      currentPage === idx + 1
                        ? "bg-pink-600 text-white"
                        : "bg-blue-200 text-blue-900"
                    }`}
                  >
                    {idx + 1}
                  </button>
                ))}
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 bg-blue-700 text-white rounded"
                >
                  Next
                </button>
              </div>
            )}
          </div>

          {/* Cart */}
          <div className="bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900 p-6 rounded-2xl">
            <h3 className="text-2xl font-bold mb-6 text-blue-100">Your Cart</h3>
            {cart.length === 0 ? (
              <p className="text-blue-300">No items</p>
            ) : (
              <div>
                {cart.map((item, idx) => (
                  <div
                    key={idx}
                    className="border-b border-blue-700 py-3 flex justify-between"
                  >
                    <div>
                      <p className="font-bold text-white">{item.name}</p>
                      <p className="text-sm text-white">
                        {item.price}/{item.unit}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        const updatedCart = cart.filter((_, i) => i !== idx);
                        setCart(updatedCart);
                        localStorage.setItem(
                          "vendorCart",
                          JSON.stringify(updatedCart)
                        );
                      }}
                      className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-full"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  onClick={handlePlaceOrderClick}
                  className="mt-6 w-full bg-gradient-to-r from-green-700 via-blue-700 to-purple-700 text-white py-3 rounded-full"
                >
                  Place Order
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorDashboard;
