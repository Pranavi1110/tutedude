import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import apiService from "../services/api";
import Header from "../components/Header";

const SupplierDashboard = () => {
  const [location, setLocation] = useState({ latitude: null, longitude: null });
  const [address, setAddress] = useState("");

  useEffect(() => {
    if (!supplierId) return;
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          setLocation({ latitude: lat, longitude: lon });
          // Use OpenStreetMap Nominatim API for reverse geocoding
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`
            );
            const data = await response.json();
            const address = data.display_name || "Address not found";
            setAddress(address);
            localStorage.setItem("user_address", address);
            // Send address to backend if available
            if (address && address !== "Address not found" && supplierId) {
              try {
                await fetch(`http://localhost:5002/api/auth/user/address`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ supplierId, address: address }),
                  credentials: "include",
                });
              } catch (err) {
                console.error("Failed to save address to backend", err);
              }
            }
          } catch (err) {
            setAddress("Address not found");
          }
        },
        (error) => {
          console.error("Geolocation error:", error);
        }
      );
    }
  }, []);
  const { t } = useTranslation();
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newProduct, setNewProduct] = useState({
    name: "",
    price: "",
    quantity: "",
    unit: "kg",
  });

  // Get supplier ID dynamically from localStorage/session (set at login)
  const getSupplierId = () => {
    // Try to get from localStorage (set at login)
    const user = JSON.parse(localStorage.getItem("user"));
    return user && user.id ? user.id : null;
  };
  const supplierId = getSupplierId();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [productsData, ordersData] = await Promise.all([
        apiService.supplier.getSupplierProducts(supplierId),
        apiService.supplier.getSupplierOrders(supplierId),
      ]);
      setProducts(productsData);
      setOrders(ordersData);
    } catch (error) {
      setError("Failed to fetch data");
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const addProduct = async () => {
    if (
      !newProduct.name ||
      !newProduct.price ||
      !newProduct.quantity ||
      !newProduct.unit
    ) {
      alert("Please fill all fields");
      return;
    }
    try {
      const productData = {
        name: newProduct.name,
        price: parseFloat(newProduct.price),
        quantity: parseInt(newProduct.quantity),
        supplierId,
        category: "Vegetables",
        description: "Fresh product",
        unit: newProduct.unit,
      };
      await apiService.supplier.addProduct(productData);
      setNewProduct({ name: "", price: "", quantity: "", unit: "kg" });
      fetchData(); // Refresh the data
      alert("Product added successfully!");
    } catch (error) {
      setError("Failed to add product");
      console.error("Error adding product:", error);
    }
  };

  const markReadyForPickup = async (orderId) => {
    try {
      // Only update order status, backend already decrements quantity
      await apiService.supplier.updateOrderStatus(orderId, "ready_for_pickup");
      await fetchData(); // Refresh the data
      alert("Order marked as ready for pickup!");
    } catch (error) {
      setError("Failed to update order status");
      console.error("Error updating order status:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-red-500 text-xl">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex flex-col items-center p-4 md:p-8">
      {/* Location Display */}
      <div className="w-full max-w-6xl mb-2 flex justify-end">
        {address ? (
          <div className="bg-blue-400 bg-opacity-70 text-amber-50 font-bold px-4 py-2 rounded-lg text-md shadow">
            Your Location: {address}
          </div>
        ) : (
          <div className="bg-blue-900 bg-opacity-70 text-blue-200 px-4 py-2 rounded-lg text-sm shadow">
            Location not available
          </div>
        )}
      </div>
      {/* <Header /> */}
      <div className="w-full max-w-6xl bg-transparent rounded-3xl shadow-2xl p-6 md:p-8 mt-4">
        <h2 className="text-3xl font-semibold mb-6 text-blue-100">
          {t("supplier_dashboard")}
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Products Management */}
          <div>
            <h3 className="text-xl font-semibold mb-4 text-purple-200">
              Manage Products
            </h3>
            {/* Add New Product */}
            <div className="bg-purple-900 bg-opacity-70 p-4 rounded-lg mb-4">
              <h4 className="font-semibold mb-2 text-purple-100">
                Add New Product
              </h4>
              <div className="grid grid-cols-4 gap-2">
                <input
                  type="text"
                  placeholder="Product Name"
                  value={newProduct.name}
                  onChange={(e) =>
                    setNewProduct({ ...newProduct, name: e.target.value })
                  }
                  className="border rounded px-2 py-1 bg-gray-900 text-purple-100 border-purple-700"
                />
                <input
                  type="number"
                  placeholder="Price"
                  value={newProduct.price}
                  onChange={(e) =>
                    setNewProduct({ ...newProduct, price: e.target.value })
                  }
                  className="border rounded px-2 py-1 bg-gray-900 text-purple-100 border-purple-700"
                />
                <input
                  type="number"
                  placeholder="Quantity"
                  value={newProduct.quantity}
                  onChange={(e) =>
                    setNewProduct({ ...newProduct, quantity: e.target.value })
                  }
                  className="border rounded px-2 py-1 bg-gray-900 text-purple-100 border-purple-700"
                />
                <select
                  value={newProduct.unit}
                  onChange={(e) =>
                    setNewProduct({ ...newProduct, unit: e.target.value })
                  }
                  className="border rounded px-2 py-1 bg-gray-900 text-purple-100 border-purple-700"
                >
                  <option value="kg">kg</option>
                  <option value="litre">litre</option>
                  <option value="piece">piece</option>
                  <option value="dozen">dozen</option>
                </select>
              </div>
              <button
                onClick={addProduct}
                className="mt-2 bg-green-700 text-white px-4 py-2 rounded hover:bg-green-800"
              >
                Add Product
              </button>
            </div>
            {/* Products List */}
            <div className="space-y-2">
              {products.map((product) => (
                <div
                  key={product._id}
                  className="border rounded p-3 flex justify-between items-center bg-purple-900 bg-opacity-70 border-purple-700"
                >
                  <div className="flex items-center gap-4">
                    <img
                      src={
                        product.image && product.image.trim() !== ""
                          ? product.image
                          : "/assets/default-product.png"
                      }
                      alt={product.name}
                      className="w-16 h-16 object-cover rounded border border-purple-400 bg-white"
                    />
                    <div>
                      <h4 className="font-semibold text-purple-100">
                        {product.name}
                      </h4>
                      <p className="text-sm text-purple-200">
                        {product.price}/{product.unit} | Quantity:{" "}
                        {product.quantity} {product.unit}
                      </p>
                    </div>
                  </div>
                  <span className="text-green-200 text-sm">
                    {product.isAvailable ? "In Stock" : "Out of Stock"}
                  </span>
                </div>
              ))}
            </div>
          </div>
          {/* Orders */}
          <div>
            <h3 className="text-xl font-semibold mb-4 text-pink-200">
              Incoming Orders
            </h3>
            <div className="space-y-3">
              {orders.map((order) => (
                <div
                  key={order._id}
                  className="border rounded p-4 bg-pink-900 bg-opacity-70 border-pink-700"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-semibold text-pink-100">
                        {order.vendorId?.name || "Unknown Vendor"}
                      </h4>
                      <p className="text-sm text-pink-200">
                        {order.items
                          .map(
                            (item) =>
                              `${item.productId?.name || "Unknown"} (${
                                item.quantity
                              }${item.productId?.unit || "kg"})`
                          )
                          .join(", ")}
                      </p>
                      <p className="text-xs text-pink-300">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        order.status === "ready_for_pickup"
                          ? "bg-green-900 text-green-200"
                          : "bg-yellow-900 text-yellow-200"
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>
                  {order.status === "pending" && (
                    <button
                      onClick={() => markReadyForPickup(order._id)}
                      className="bg-blue-700 text-white px-3 py-1 rounded text-sm hover:bg-blue-800"
                    >
                      Mark Ready for Pickup
                    </button>
                  )}
                </div>
              ))}
              {orders.length === 0 && (
                <p className="text-pink-300 text-center py-4">
                  No incoming orders
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupplierDashboard;
