import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import apiService from "../services/api";
import Header from "../components/Header";

const SupplierDashboard = () => {
  const { t } = useTranslation();
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newProduct, setNewProduct] = useState({
    name: "",
    price: "",
    stock: "",
  });

  // Sample supplier ID (replace with dynamic value from auth in production)
  const supplierId = "64b4e8f2c2a1b2d3e4f5a6b7"; // Example valid ObjectId

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
    if (!newProduct.name || !newProduct.price || !newProduct.stock) {
      alert("Please fill all fields");
      return;
    }
    try {
      const productData = {
        name: newProduct.name,
        price: parseFloat(newProduct.price),
        stock: parseInt(newProduct.stock),
        supplierId,
        category: "Vegetables",
        description: "Fresh product",
        unit: "kg",
      };
      await apiService.supplier.addProduct(productData);
      setNewProduct({ name: "", price: "", stock: "" });
      fetchData(); // Refresh the data
      alert("Product added successfully!");
    } catch (error) {
      setError("Failed to add product");
      console.error("Error adding product:", error);
    }
  };

  const markReadyForPickup = async (orderId) => {
    try {
      await apiService.supplier.updateOrderStatus(orderId, "ready_for_pickup");
      fetchData(); // Refresh the data
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
              <div className="grid grid-cols-3 gap-2">
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
                  placeholder="Stock"
                  value={newProduct.stock}
                  onChange={(e) =>
                    setNewProduct({ ...newProduct, stock: e.target.value })
                  }
                  className="border rounded px-2 py-1 bg-gray-900 text-purple-100 border-purple-700"
                />
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
                  <div>
                    <h4 className="font-semibold text-purple-100">
                      {product.name}
                    </h4>
                    <p className="text-sm text-purple-200">
                      {product.price}/{product.unit} | Stock: {product.stock}
                      {product.unit}
                    </p>
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
