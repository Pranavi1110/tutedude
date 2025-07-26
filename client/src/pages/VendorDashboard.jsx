import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import apiService from "../services/api";

const VendorDashboard = () => {
  const { t } = useTranslation();
  const [cart, setCart] = useState(() => {
    const savedCart = localStorage.getItem("vendorCart");
    return savedCart ? JSON.parse(savedCart) : [];
  });
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Sample vendor ID (replace with dynamic value from auth in production)
  const vendorId = "64b4e8f2c2a1b2d3e4f5a6b9"; // Example valid ObjectId

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const data = await apiService.vendor.getProducts();
      setProducts(data);
    } catch (error) {
      setError("Failed to fetch products");
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (product) => {
    const updatedCart = [...cart, product];
    setCart(updatedCart);
    localStorage.setItem("vendorCart", JSON.stringify(updatedCart));
  };

  const placeOrder = async () => {
    if (cart.length === 0) return;

    try {
      // Group cart items by supplier
      const supplierGroups = {};
      cart.forEach((item) => {
        // Ensure supplierId is always a string ObjectId
        const supplierId =
          typeof item.supplierId === "object" && item.supplierId._id
            ? item.supplierId._id
            : item.supplierId;
        if (!supplierGroups[supplierId]) {
          supplierGroups[supplierId] = [];
        }
        supplierGroups[supplierId].push({
          productId: item._id,
          quantity: 1, // Default quantity
          price: item.price,
        });
      });

      // Place orders for each supplier
      const orderPromises = Object.entries(supplierGroups).map(
        ([supplierId, items]) => {
          const orderData = {
            vendorId,
            supplierId,
            items,
            deliveryAddress: "Street Food Market, Sector 10", // Sample address
            pickupAddress: "Fresh Farms, Sector 15", // Sample address
            notes: "Please deliver fresh items",
          };
          return apiService.vendor.placeOrder(orderData);
        }
      );

      await Promise.all(orderPromises);
      setCart([]);
      localStorage.removeItem("vendorCart");
      alert("Orders placed successfully!");
    } catch (error) {
      setError("Failed to place order");
      console.error("Error placing order:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-xl">Loading products...</div>
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
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-semibold">{t("vendor_dashboard")}</h2>
        <div className="text-sm text-gray-600">Cart: {cart.length} items</div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Products Section */}
        <div className="lg:col-span-2">
          <h3 className="text-xl font-semibold mb-4">Available Products</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {products.map((product) => (
              <div
                key={product._id}
                className="border rounded-lg p-4 hover:shadow-md"
              >
                <h4 className="font-semibold">{product.name}</h4>
                <p className="text-gray-600">
                  Supplier: {product.supplierId?.name || "Unknown"}
                </p>
                <p className="text-green-600 font-semibold">
                  ₹{product.price}/{product.unit}
                </p>
                <p className="text-sm text-gray-500">
                  Stock: {product.stock} {product.unit}
                </p>
                <button
                  onClick={() => addToCart(product)}
                  className="mt-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                  Add to Cart
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Cart Section */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-xl font-semibold mb-4">Your Cart</h3>
          {cart.length === 0 ? (
            <p className="text-gray-500">No items in cart</p>
          ) : (
            <div>
              {cart.map((item, index) => (
                <div key={index} className="border-b py-2">
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-gray-600">
                    ₹{item.price}/{item.unit}
                  </p>
                </div>
              ))}
              <button
                onClick={placeOrder}
                className="mt-4 w-full bg-green-500 text-white py-2 rounded hover:bg-green-600"
              >
                Place Order
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VendorDashboard;
