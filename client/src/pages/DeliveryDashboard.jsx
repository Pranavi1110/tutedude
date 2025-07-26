import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import apiService from "../services/api";
import Header from "../components/Header";

const DeliveryDashboard = () => {
  const { t } = useTranslation();
  const [availableDeliveries, setAvailableDeliveries] = useState([]);
  const [myDeliveries, setMyDeliveries] = useState([]);

  useEffect(() => {
    // Fetch data
    const fetchDeliveries = async () => {
      try {
        const available = await apiService.get("/deliveries/available");
        const mine = await apiService.get("/deliveries/mine");
        setAvailableDeliveries(available.data);
        setMyDeliveries(mine.data);
      } catch (error) {
        console.error("Error fetching deliveries:", error);
      }
    };
    fetchDeliveries();
  }, []);

  const acceptDelivery = async (id) => {
    try {
      await apiService.post(`/deliveries/accept/${id}`);
      setAvailableDeliveries((prev) => prev.filter((d) => d._id !== id));
      const accepted = await apiService.get(`/deliveries/${id}`);
      setMyDeliveries((prev) => [...prev, accepted.data]);
    } catch (error) {
      console.error("Error accepting delivery:", error);
    }
  };

  const markDelivered = async (id) => {
    try {
      await apiService.post(`/deliveries/mark-delivered/${id}`);
      setMyDeliveries((prev) =>
        prev.map((d) => (d._id === id ? { ...d, status: "delivered" } : d))
      );
    } catch (error) {
      console.error("Error marking delivery as delivered:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-100 via-pink-100 to-purple-100 flex flex-col items-center p-8">
      <div className="w-full max-w-6xl bg-white bg-opacity-90 rounded-3xl shadow-2xl p-8 flex flex-col justify-center items-center">
        <div className="flex justify-between items-center mb-8 w-full">
          <h2 className="text-4xl font-extrabold text-black text-center">
            {t("delivery_dashboard")}
          </h2>
          {localStorage.getItem("loggedIn") === "true" && (
            <button
              className="bg-red-700 hover:bg-red-800 text-white px-4 py-2 rounded font-semibold transition-colors"
              onClick={() => {
                localStorage.removeItem("user");
                localStorage.removeItem("loggedIn");
                window.location.href = "/";
              }}
            >
              Logout
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Available Deliveries */}
          <div>
            <h3 className="text-2xl font-bold mb-6 text-orange-200">
              Available Deliveries
            </h3>
            <div className="space-y-4">
              {availableDeliveries.length === 0 ? (
                <p className="text-orange-300 text-center py-4">
                  No available deliveries
                </p>
              ) : (
                availableDeliveries.map((delivery) => (
                  <div
                    key={delivery._id}
                    className="border-2 border-orange-700 rounded-2xl p-6 bg-orange-900 bg-opacity-70 hover:shadow-xl transition-shadow"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-bold text-lg mb-1 text-orange-100">
                          Order #{delivery._id}
                        </h4>
                        <p className="text-sm text-orange-200 mb-1">
                          {delivery.vendorId?.name || "Unknown Vendor"}
                        </p>
                        <p className="text-sm text-orange-200 mb-2">
                          {delivery.items
                            .map(
                              (item) =>
                                `${item.productId?.name || "Unknown"} (${
                                  item.quantity
                                }${item.productId?.unit || "kg"})`
                            )
                            .join(", ")}
                        </p>
                      </div>
                      <span className="bg-orange-800 text-orange-200 px-2 py-1 rounded text-xs font-bold">
                        {delivery.status}
                      </span>
                    </div>
                    <div className="text-sm text-orange-200 mb-3">
                      <p>
                        <strong>Pickup:</strong> {delivery.pickupAddress}
                      </p>
                      <p>
                        <strong>Delivery:</strong> {delivery.deliveryAddress}
                      </p>
                    </div>
                    <button
                      onClick={() => acceptDelivery(delivery._id)}
                      className="bg-gradient-to-r from-orange-700 via-pink-700 to-purple-700 text-white px-6 py-2 rounded-full font-bold shadow-lg hover:scale-105 transition-transform duration-200"
                    >
                      Accept Delivery
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
          {/* My Deliveries */}
          <div className="bg-gradient-to-br from-pink-900 via-orange-900 to-purple-900 p-6 rounded-2xl shadow-xl">
            <h3 className="text-2xl font-bold mb-6 text-pink-200">
              My Deliveries
            </h3>
            <div className="space-y-4">
              {myDeliveries.length === 0 ? (
                <p className="text-pink-300 text-center py-4">
                  No active deliveries
                </p>
              ) : (
                myDeliveries.map((delivery) => (
                  <div
                    key={delivery._id}
                    className="border-2 border-pink-700 rounded-2xl p-6 bg-pink-900 bg-opacity-70"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-bold text-lg mb-1 text-pink-100">
                          Order #{delivery.orderId?._id || delivery._id}
                        </h4>
                        <p className="text-sm text-pink-200 mb-1">
                          {delivery.orderId?.vendorId?.name || "Unknown Vendor"}
                        </p>
                        <p className="text-sm text-pink-200 mb-2">
                          {delivery.orderId?.items
                            ?.map(
                              (item) =>
                                `${item.productId?.name || "Unknown"} (${
                                  item.quantity
                                }${item.productId?.unit || "kg"})`
                            )
                            .join(", ") || "Unknown items"}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-1 rounded text-xs font-bold ${
                          delivery.status === "delivered"
                            ? "bg-green-900 text-green-200"
                            : "bg-pink-800 text-pink-200"
                        }`}
                      >
                        {delivery.status}
                      </span>
                    </div>
                    <div className="text-sm text-pink-200 mb-3">
                      <p>
                        <strong>Pickup:</strong> {delivery.pickupLocation}
                      </p>
                      <p>
                        <strong>Delivery:</strong> {delivery.deliveryLocation}
                      </p>
                    </div>
                    {delivery.status === "out_for_delivery" && (
                      <button
                        onClick={() => markDelivered(delivery._id)}
                        className="bg-gradient-to-r from-green-700 via-pink-700 to-purple-700 text-white px-6 py-2 rounded-full font-bold shadow-lg hover:scale-105 transition-transform duration-200"
                      >
                        Mark as Delivered
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeliveryDashboard;
