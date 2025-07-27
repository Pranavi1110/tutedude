import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import apiService from "../services/api";

// Haversine Formula
function getDistanceFromLatLonInMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Estimate ETA
function estimateTimeMinutes(distanceMeters, speedKmph = 30) {
  const speedMps = (speedKmph * 1000) / 3600;
  const timeSec = distanceMeters / speedMps;
  return Math.round(timeSec / 60);
}

const DeliveryDashboard = () => {
  const { t } = useTranslation();
  const [availableDeliveries, setAvailableDeliveries] = useState([]);
  const [myDeliveries, setMyDeliveries] = useState([]);
  const [location, setLocation] = useState(null);
  const [address, setAddress] = useState("Fetching...");

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          setLocation({ latitude: lat, longitude: lon });

          try {
            const response = await fetch(
              `http://localhost:5002/api/geocode/reverse?lat=${lat}&lon=${lon}`
            );
            const data = await response.json();
            const agentId = localStorage.getItem("agentId");
            console.log(agentId);
            const fullAddress = data.display_name || "Address not found";
            setAddress(fullAddress);
            localStorage.setItem("user_address", fullAddress);

            if (fullAddress !== "Address not found" && agentId) {
              await fetch("http://localhost:5002/api/auth/user/address", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  supplierId: agentId,
                  address: fullAddress,
                }),
                credentials: "include",
              });
            }
          } catch (err) {
            console.error("Error fetching address from backend geocode:", err);
            setAddress("Address not found");
          }
        },
        (error) => {
          console.error("Geolocation error:", error);
          setAddress("Geolocation not allowed or failed.");
        }
      );
    }
  }, []);

  useEffect(() => {
    const fetchDeliveries = async () => {
      try {
        let available = [];
        if (location?.latitude && location?.longitude) {
          available = await apiService.delivery.getAvailableDeliveries(
            location.latitude,
            location.longitude
          );
        } else {
          available = await apiService.delivery.getAvailableDeliveries();
        }
        setAvailableDeliveries(available);

        const agentId = localStorage.getItem("agentId");
        if (agentId && agentId !== "undefined" && agentId !== "null") {
          const mine = await apiService.delivery.getAgentDeliveries(agentId);
          setMyDeliveries(mine);
        } else {
          setMyDeliveries([]);
        }
      } catch (error) {
        console.error("Error fetching deliveries:", error);
        setAvailableDeliveries([]);
        setMyDeliveries([]);
      }
    };
    fetchDeliveries();
  }, [location]);

  const acceptDelivery = async (id) => {
    try {
      const agentId = localStorage.getItem("agentId");
      if (!agentId) throw new Error("No agentId found in localStorage");

      await apiService.delivery.acceptDelivery(id, agentId);
      setAvailableDeliveries((prev) => prev.filter((d) => d._id !== id));
      const mine = await apiService.delivery.getAgentDeliveries(agentId);
      setMyDeliveries(mine);
    } catch (error) {
      console.error("Error accepting delivery:", error);
    }
  };

  const markDelivered = async (id) => {
    try {
      await apiService.delivery.updateDeliveryStatus(id, {
        status: "delivered",
      });
      const agentId = localStorage.getItem("agentId");
      const mine = await apiService.delivery.getAgentDeliveries(agentId);
      setMyDeliveries(mine);
    } catch (error) {
      console.error("Error marking as delivered:", error);
    }
  };

  return (
    <div>
      {/* <Header /> */}
      <div className="max-w-6xl ms-8 py-8 px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Available Deliveries */}
          <div className="bg-gradient-to-br from-orange-900 via-pink-900 to-purple-900 p-6 rounded-2xl shadow-xl">
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
                    className="border-2 border-orange-700 rounded-2xl p-6 bg-orange-900 bg-opacity-70"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-bold text-lg mb-1 text-orange-100">
                          Order
                        </h4>
                        {/* <img src={delivery.image}/>
                         */}
                        {delivery.items.map((item, idx) =>
                          item.productId?.image ? (
                            <img
                              key={idx}
                              src={item.productId.image}
                              alt={item.productId?.name || "Product"}
                              className="w-16 h-16 object-cover rounded mb-1 border"
                            />
                          ) : null
                        )}
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
                        <strong>Pickup:</strong> {delivery.supplierAddress}
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
                // ...existing code...
                myDeliveries
                  .filter((delivery) => delivery.status !== "assigned")
                  .map((delivery) => {
                    // Calculate ETA using agentCoords, supplierCoords, vendorCoords

                    let totalETA = null;
                    let debugReason = [];
                    const agentCoords =
                      Array.isArray(delivery.agentCoords) &&
                      delivery.agentCoords.length === 2
                        ? delivery.agentCoords
                        : null;
                    const supplierCoords =
                      Array.isArray(delivery.supplierCoords) &&
                      delivery.supplierCoords.length === 2
                        ? delivery.supplierCoords
                        : null;
                    const vendorCoords =
                      Array.isArray(delivery.vendorCoords) &&
                      delivery.vendorCoords.length === 2
                        ? delivery.vendorCoords
                        : null;

                    if (agentCoords && supplierCoords && vendorCoords) {
                      const dist1 = getDistanceFromLatLonInMeters(
                        agentCoords[1],
                        agentCoords[0],
                        supplierCoords[1],
                        supplierCoords[0]
                      );
                      const dist2 = getDistanceFromLatLonInMeters(
                        supplierCoords[1],
                        supplierCoords[0],
                        vendorCoords[1],
                        vendorCoords[0]
                      );
                      totalETA =
                        estimateTimeMinutes(dist1) + estimateTimeMinutes(dist2);
                    } else {
                      debugReason.push("missing agent/supplier/vendor coords");
                    }

                    return (
                      <div
                        key={delivery._id}
                        className="border-2 border-pink-700 rounded-2xl p-6 bg-pink-900 bg-opacity-70"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="text-sm text-pink-200 mb-1">
                              {delivery.orderId?.vendorId?.name ||
                                "Unknown Vendor"}
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
                            <strong>Delivery:</strong>{" "}
                            {delivery.deliveryLocation}
                          </p>
                          {/* {totalETA !== null ? (
                            <p className="text-green-200 font-bold mt-2">
                              Total ETA: {totalETA} min
                            </p>
                          ) : (
                            debugReason.length > 0 && (
                              <p className="text-xs text-red-300 mt-2">
                                ETA not shown: {debugReason.join(", ")}
                              </p>
                            )
                          )} */}
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
                    );
                  })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeliveryDashboard;
