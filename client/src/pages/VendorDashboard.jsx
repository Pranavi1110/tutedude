import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useTranslation } from "react-i18next";
import apiService from "../services/api";
import Header from "../components/Header";

const VendorDashboard = () => {
  const { t } = useTranslation();
  const [cart, setCart] = useState(() => {
    const savedCart = localStorage.getItem("vendorCart");
    return savedCart ? JSON.parse(savedCart) : [];
  });
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Sample vendor ID (replace with dynamic value from auth in production)
  const vendorId = "64b4e8f2c2a1b2d3e4f5a6b9"; // Example valid ObjectId

  useEffect(() => {
    fetchProducts();
    fetchOrders();
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

const fetchOrders = async () => {
  try {
    const data = await apiService.vendor.getVendorOrders(vendorId);
    setOrders(data);
  } catch (error) {
    console.error("Error fetching orders:", error);
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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex flex-col items-center p-4 md:p-8">
      <div className="w-full max-w-6xl bg-transparent rounded-3xl shadow-2xl p-6 md:p-8 mt-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Products Section */}
          <div className="lg:col-span-2">
            <h3 className="text-2xl font-bold mb-6 text-blue-200">
              Available Products
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {products.map((product) => (
                <div
                  key={product._id}
                  className="border-2 border-blue-700 rounded-2xl p-6 bg-blue-900 bg-opacity-70 hover:shadow-xl transition-shadow"
                >
                  <h4 className="font-bold text-lg mb-2 text-blue-100">
                    {product.name}
                  </h4>
                  <p className="text-blue-200 mb-1">
                    Supplier: {product.supplierId?.name || "Unknown"}
                  </p>
                  <p className="text-green-200 font-semibold mb-1">
                    {product.price}/{product.unit}
                  </p>
                  <p className="text-sm text-blue-300 mb-2">
                    Stock: {product.stock} {product.unit}
                  </p>
                  <button
                    onClick={() => addToCart(product)}
                    className="mt-2 bg-gradient-to-r from-blue-700 via-purple-700 to-pink-700 text-white px-6 py-2 rounded-full font-bold shadow-lg hover:scale-105 transition-transform duration-200"
                  >
                    Add to Cart
                  </button>
                </div>
              ))}
            </div>
            {/* Orders Section with agent location */}
            <h3 className="text-2xl font-bold mt-10 mb-6 text-green-200">
              Your Orders
            </h3>
            <div className="space-y-6">
              {orders.map((order) => (
                <div
                  key={order._id}
                  className="border-2 border-green-700 rounded-2xl p-6 bg-green-900 bg-opacity-70"
                >
                  <h4 className="font-bold text-lg mb-2 text-green-100">
                    Order #{order._id}
                  </h4>
                  <p className="text-green-200 mb-1">Status: {order.status}</p>
                  <p className="text-green-200 mb-1">
                    Delivery Address: {order.deliveryAddress}
                  </p>
                  <p className="text-green-200 mb-1">
                    Pickup Address: {order.pickupAddress}
                  </p>
                  {order.deliveryAgentId &&
                    order.status === "out_for_delivery" &&
                    order.deliveryAgentId.location && (
                      <div className="mt-4">
                        <h5 className="text-green-300 font-bold mb-2">
                          Agent Location:
                        </h5>
                        <MapContainer
                          center={
                            order.deliveryAgentId.location.coordinates
                              .length === 2
                              ? [
                                  order.deliveryAgentId.location.coordinates[1],
                                  order.deliveryAgentId.location.coordinates[0],
                                ]
                              : [0, 0]
                          }
                          zoom={13}
                          style={{ height: "200px", width: "100%" }}
                        >
                          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                          <Marker
                            position={[
                              order.deliveryAgentId.location.coordinates[1],
                              order.deliveryAgentId.location.coordinates[0],
                            ]}
                          >
                            <Popup>Agent: {order.deliveryAgentId.name}</Popup>
                          </Marker>
                        </MapContainer>
                      </div>
                    )}
                </div>
              ))}
            </div>
          </div>
          {/* Cart Section */}
          <div className="bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900 p-6 rounded-2xl shadow-xl">
            <h3 className="text-2xl font-bold mb-6 text-blue-100">Your Cart</h3>
            {cart.length === 0 ? (
              <p className="text-blue-300">No items in cart</p>
            ) : (
              <div>
                {cart.map((item, index) => (
                  <div key={index} className="border-b border-blue-700 py-3">
                    <p className="font-bold text-lg text-blue-100">
                      {item.name}
                    </p>
                    <p className="text-sm text-blue-200">
                      {item.price}/{item.unit}
                    </p>
                  </div>
                ))}
                <button
                  onClick={placeOrder}
                  className="mt-6 w-full bg-gradient-to-r from-green-700 via-blue-700 to-purple-700 text-white py-3 rounded-full font-bold text-xl shadow-lg hover:scale-105 transition-transform duration-200"
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
