import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import apiService from "../services/api";

const DeliveryDashboard = () => {
  const { t } = useTranslation();
  const [availableDeliveries, setAvailableDeliveries] = useState([]);
  const [myDeliveries, setMyDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Sample delivery agent ID (replace with dynamic value from auth in production)
  const deliveryAgentId = "64b4e8f2c2a1b2d3e4f5a6b8"; // Example valid ObjectId

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [availableData, myDeliveriesData] = await Promise.all([
        apiService.delivery.getAvailableDeliveries(),
        apiService.delivery.getAgentDeliveries(deliveryAgentId),
      ]);
      setAvailableDeliveries(availableData);
      setMyDeliveries(myDeliveriesData);
    } catch (error) {
      setError("Failed to fetch deliveries");
      console.error("Error fetching deliveries:", error);
    } finally {
      setLoading(false);
    }
  };

  const acceptDelivery = async (orderId) => {
    try {
      await apiService.delivery.acceptDelivery(orderId, deliveryAgentId);
      fetchData(); // Refresh the data
      alert("Delivery accepted successfully!");
    } catch (error) {
      setError("Failed to accept delivery");
      console.error("Error accepting delivery:", error);
    }
  };

  const markDelivered = async (deliveryId) => {
    try {
      await apiService.delivery.updateDeliveryStatus(deliveryId, {
        status: "delivered",
        proofOfDelivery: "Delivered successfully",
        deliveryNotes: "Package delivered to customer",
      });
      fetchData(); // Refresh the data
      alert("Delivery marked as completed!");
    } catch (error) {
      setError("Failed to update delivery status");
      console.error("Error updating delivery status:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-xl">Loading deliveries...</div>
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
      <h2 className="text-3xl font-semibold mb-6">{t("delivery_dashboard")}</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Available Deliveries */}
        <div>
          <h3 className="text-xl font-semibold mb-4">Available Deliveries</h3>
          <div className="space-y-3">
            {availableDeliveries.map((delivery) => (
              <div
                key={delivery._id}
                className="border rounded p-4 bg-green-50"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-semibold">Order #{delivery._id}</h4>
                    <p className="text-sm text-gray-600">
                      {delivery.vendorId?.name || "Unknown Vendor"}
                    </p>
                    <p className="text-sm text-gray-600">
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
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                    {delivery.status}
                  </span>
                </div>
                <div className="text-sm text-gray-600 mb-3">
                  <p>
                    <strong>Pickup:</strong> {delivery.pickupAddress}
                  </p>
                  <p>
                    <strong>Delivery:</strong> {delivery.deliveryAddress}
                  </p>
                </div>
                <button
                  onClick={() => acceptDelivery(delivery._id)}
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                  Accept Delivery
                </button>
              </div>
            ))}
            {availableDeliveries.length === 0 && (
              <p className="text-gray-500 text-center py-4">
                No available deliveries
              </p>
            )}
          </div>
        </div>

        {/* My Deliveries */}
        <div>
          <h3 className="text-xl font-semibold mb-4">My Deliveries</h3>
          <div className="space-y-3">
            {myDeliveries.map((delivery) => (
              <div key={delivery._id} className="border rounded p-4 bg-blue-50">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-semibold">
                      Order #{delivery.orderId?._id || delivery._id}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {delivery.orderId?.vendorId?.name || "Unknown Vendor"}
                    </p>
                    <p className="text-sm text-gray-600">
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
                    className={`px-2 py-1 rounded text-xs ${
                      delivery.status === "delivered"
                        ? "bg-green-100 text-green-800"
                        : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    {delivery.status}
                  </span>
                </div>
                <div className="text-sm text-gray-600 mb-3">
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
                    className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                  >
                    Mark as Delivered
                  </button>
                )}
              </div>
            ))}
            {myDeliveries.length === 0 && (
              <p className="text-gray-500 text-center py-4">
                No active deliveries
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeliveryDashboard;
