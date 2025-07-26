import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import apiService from "../services/api";

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
    <div className="max-w-6xl mx-auto">
      <h2 className="text-3xl font-semibold mb-6">{t("supplier_dashboard")}</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Products Management */}
        <div>
          <h3 className="text-xl font-semibold mb-4">Manage Products</h3>

          {/* Add New Product */}
          <div className="bg-gray-50 p-4 rounded-lg mb-4">
            <h4 className="font-semibold mb-2">Add New Product</h4>
            <div className="grid grid-cols-3 gap-2">
              <input
                type="text"
                placeholder="Product Name"
                value={newProduct.name}
                onChange={(e) =>
                  setNewProduct({ ...newProduct, name: e.target.value })
                }
                className="border rounded px-2 py-1"
              />
              <input
                type="number"
                placeholder="Price"
                value={newProduct.price}
                onChange={(e) =>
                  setNewProduct({ ...newProduct, price: e.target.value })
                }
                className="border rounded px-2 py-1"
              />
              <input
                type="number"
                placeholder="Stock"
                value={newProduct.stock}
                onChange={(e) =>
                  setNewProduct({ ...newProduct, stock: e.target.value })
                }
                className="border rounded px-2 py-1"
              />
            </div>
            <button
              onClick={addProduct}
              className="mt-2 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            >
              Add Product
            </button>
          </div>

          {/* Products List */}
          <div className="space-y-2">
            {products.map((product) => (
              <div
                key={product._id}
                className="border rounded p-3 flex justify-between items-center"
              >
                <div>
                  <h4 className="font-semibold">{product.name}</h4>
                  <p className="text-sm text-gray-600">
                    ₹{product.price}/{product.unit} | Stock: {product.stock}
                    {product.unit}
                  </p>
                </div>
                <span className="text-green-600 text-sm">
                  {product.isAvailable ? "In Stock" : "Out of Stock"}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Orders */}
        <div>
          <h3 className="text-xl font-semibold mb-4">Incoming Orders</h3>
          <div className="space-y-3">
            {orders.map((order) => (
              <div key={order._id} className="border rounded p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-semibold">
                      {order.vendorId?.name || "Unknown Vendor"}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {order.items
                        .map(
                          (item) =>
                            `${item.productId?.name || "Unknown"} (${
                              item.quantity
                            }${item.productId?.unit || "kg"})`
                        )
                        .join(", ")}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      order.status === "ready_for_pickup"
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {order.status}
                  </span>
                </div>
                {order.status === "pending" && (
                  <button
                    onClick={() => markReadyForPickup(order._id)}
                    className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
                  >
                    Mark Ready for Pickup
                  </button>
                )}
              </div>
            ))}
            {orders.length === 0 && (
              <p className="text-gray-500 text-center py-4">
                No incoming orders
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupplierDashboard;
