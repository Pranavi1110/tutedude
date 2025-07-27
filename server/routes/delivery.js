const express = require("express");
const router = express.Router();
const Order = require("../models/Order");
const Delivery = require("../models/Delivery");
const User = require("../models/User");

// Accept a delivery: assign agent and set status to out_for_delivery
router.post("/accept/:orderId", async (req, res) => {
  try {
    const { deliveryAgentId } = req.body;
    if (!deliveryAgentId) {
      return res.status(400).json({ message: "deliveryAgentId is required" });
    }
    const order = await Order.findById(req.params.orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    if (order.deliveryAgentId) {
      return res.status(400).json({ message: "Order already assigned" });
    }
    order.deliveryAgentId = deliveryAgentId;
    order.status = "out_for_delivery";
    await order.save();

    // Geocode and store coordinates for agent, supplier, and vendor addresses
    const User = require("../models/User");
    const fetch = (...args) =>
      import("node-fetch").then(({ default: fetch }) => fetch(...args));
    let vendorAddress = "",
      supplierAddress = "",
      agentAddress = "";
    // let vendorCoords = null,
    //   supplierCoords = null,
    //   agentCoords = null;
    // Vendor
    if (order.vendorId) {
      const vendorUser = await User.findOne({
        _id: order.vendorId,
        role: "vendor",
      });
      if (vendorUser && vendorUser.address) {
        vendorAddress = vendorUser.address;
        try {
          const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            vendorAddress
          )}`;
          const response = await fetch(url, {
            headers: { "User-Agent": "delivery-app/1.0" },
          });
          const data = await response.json();
          if (Array.isArray(data) && data.length > 0) {
            vendorCoords = [parseFloat(data[0].lon), parseFloat(data[0].lat)];
          }
        } catch (err) {
          console.error("Geocoding vendor failed", err);
        }
      }
    }
    // Supplier
    if (order.supplierId) {
      const supplierUser = await User.findOne({
        _id: order.supplierId,
        role: "supplier",
      });
      if (supplierUser && supplierUser.address) {
        supplierAddress = supplierUser.address;
        try {
          const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            supplierAddress
          )}`;
          const response = await fetch(url, {
            headers: { "User-Agent": "delivery-app/1.0" },
          });
          const data = await response.json();
          if (Array.isArray(data) && data.length > 0) {
            supplierCoords = [parseFloat(data[0].lon), parseFloat(data[0].lat)];
          }
        } catch (err) {
          console.error("Geocoding supplier failed", err);
        }
      }
    }
    // Delivery Agent (if address is stored, otherwise skip)
    if (deliveryAgentId) {
      const agentUser = await User.findOne({
        _id: deliveryAgentId,
        role: "delivery",
      });
      if (agentUser && agentUser.address) {
        agentAddress = agentUser.address;
        try {
          const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            agentAddress
          )}`;
          const response = await fetch(url, {
            headers: { "User-Agent": "delivery-app/1.0" },
          });
          const data = await response.json();
          if (Array.isArray(data) && data.length > 0) {
            agentCoords = [parseFloat(data[0].lon), parseFloat(data[0].lat)];
          }
        } catch (err) {
          console.error("Geocoding agent failed", err);
        }
      }
    }
    // Create a Delivery document for this assignment, store coords for later ETA
    const Delivery = require("../models/Delivery");
    const deliveryDoc = new Delivery({
      orderId: order._id,
      deliveryAgentId,
      status: "out_for_delivery",
      pickupLocation: order.supplierAddress  || "",
      deliveryLocation: order.deliveryAddress || "",
      image: order.items.image || "",
      // // Store coordinates for ETA calculation
      // vendorCoords,
      // supplierCoords,
      // agentCoords,
    });
    await deliveryDoc.save();

    res.json({ message: "Order accepted", order, delivery: deliveryDoc });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error accepting delivery", error: error.message });
  }
});

// Get available deliveries (ready for pickup)
// Update delivery agent location (for live tracking)
router.post("/update-location/:deliveryAgentId", async (req, res) => {
  try {
    const { lat, lng } = req.body;
    if (lat == null || lng == null) {
      return res
        .status(400)
        .json({ message: "Latitude and longitude required" });
    }
    const DeliveryAgent = require("../models/DeliveryAgent");
    const agent = await DeliveryAgent.findByIdAndUpdate(
      req.params.deliveryAgentId,
      {
        location: {
          type: "Point",
          coordinates: [parseFloat(lng), parseFloat(lat)],
        },
      },
      { new: true }
    );
    if (!agent) return res.status(404).json({ message: "Agent not found" });
    res.json({ message: "Location updated", agent });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error updating location", error: error.message });
  }
});
router.get("/available", async (req, res) => {
  try {
    // Accept lat, lng, and optional radius as query params
    const { lat, lng, radius } = req.query;
    let availableOrders = await Order.find({
      status: "ready_for_pickup",
      deliveryAgentId: { $exists: false },
    })
      .populate("vendorId", "name mobile address")
      .populate("supplierId", "name mobile address location")
      .populate("items.productId", "name unit image")
      .sort({ createdAt: -1 });

    // If agent location is provided, filter orders by supplier proximity
    if (lat && lng) {
      // Only keep orders where supplier has a location and is within radius (default 5km)
      const maxDistance = radius ? parseFloat(radius) : 5000; // meters
      availableOrders = availableOrders.filter((order) => {
        const supplier = order.supplierId;
        if (!supplier || !supplier.location || !supplier.location.coordinates)
          return false;
        const [supLng, supLat] = supplier.location.coordinates;
        // Haversine formula
        const toRad = (deg) => (deg * Math.PI) / 180;
        const R = 6371000; // Earth radius in meters
        const dLat = toRad(supLat - parseFloat(lat));
        const dLng = toRad(supLng - parseFloat(lng));
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(toRad(parseFloat(lat))) *
            Math.cos(toRad(supLat)) *
            Math.sin(dLng / 2) *
            Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;
        return distance <= maxDistance;
      });
    }
    res.json(availableOrders);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching available deliveries",
      error: error.message,
    });
  }
});

// Get delivery agent's active deliveries
router.get("/agent/:deliveryAgentId", async (req, res) => {
  try {
    const deliveries = await Delivery.find({
      deliveryAgentId: req.params.deliveryAgentId,
    })
      .populate({
        path: "orderId",
        populate: [
          { path: "vendorId", select: "name phone address" },
          { path: "supplierId", select: "name phone" },
          { path: "items.productId", select: "name price unit image" },
        ],
      })
      .sort({ createdAt: -1 });

    // Geocode vendor address to coordinates on the fly for ETA
    const fetch = (...args) =>
      import("node-fetch").then(({ default: fetch }) => fetch(...args));
    for (const delivery of deliveries) {
      const vendor = delivery.orderId?.vendorId;
      if (vendor && vendor.address && !vendor.location) {
        try {
          const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            vendor.address
          )}`;
          const response = await fetch(url, {
            headers: { "User-Agent": "delivery-app/1.0" },
          });
          const data = await response.json();
          if (Array.isArray(data) && data.length > 0) {
            const lat = parseFloat(data[0].lat);
            const lon = parseFloat(data[0].lon);
            vendor.location = { coordinates: [lon, lat] };
          }
        } catch (err) {
          console.error(
            "Geocoding failed for vendor address:",
            vendor.address,
            err
          );
        }
      }
    }

    // Ensure agentCoords, supplierCoords, vendorCoords are included in each delivery
    const deliveriesWithCoords = deliveries.map((delivery) => {
      const obj = delivery.toObject ? delivery.toObject() : delivery;
      obj.agentCoords = delivery.agentCoords;
      obj.supplierCoords = delivery.supplierCoords;
      obj.vendorCoords = delivery.vendorCoords;
      return obj;
    });
    res.json(deliveriesWithCoords);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching deliveries", error: error.message });
  }
});

// Update delivery status
router.patch("/delivery/:deliveryId/status", async (req, res) => {
  try {
    const { status, proofOfDelivery, otp, deliveryNotes } = req.body;

    const updateData = { status };

    if (proofOfDelivery) updateData.proofOfDelivery = proofOfDelivery;
    if (otp) updateData.otp = otp;
    if (deliveryNotes) updateData.deliveryNotes = deliveryNotes;

    // If status is delivered, set actual delivery time
    if (status === "delivered") {
      updateData.actualDeliveryTime = new Date();
    }

    const delivery = await Delivery.findByIdAndUpdate(
      req.params.deliveryId,
      updateData,
      { new: true }
    ).populate({
      path: "orderId",
      populate: [
        { path: "vendorId", select: "name phone" },
        { path: "supplierId", select: "name phone" },
      ],
    });

    if (!delivery) {
      return res.status(404).json({ message: "Delivery not found" });
    }

    // Update order status if delivery is completed
    if (status === "delivered") {
      console.log(
        "Updating order status to delivered for orderId:",
        delivery.orderId._id
      );
      const updateResult = await Order.findByIdAndUpdate(delivery.orderId._id, {
        status: "delivered",
      });
      console.log("Order update result:", updateResult);
      return res.json({ message: "Delivery marked as delivered" });
    }

    res.json(delivery);
  } catch (error) {
    res.status(500).json({
      message: "Error updating delivery status",
      error: error.message,
    });
  }
});

// Get delivery details
router.get("/delivery/:deliveryId/details", async (req, res) => {
  try {
    const delivery = await Delivery.findById(req.params.deliveryId).populate({
      path: "orderId",
      populate: [
        { path: "vendorId", select: "name phone address" },
        { path: "supplierId", select: "name phone address" },
        { path: "items.productId", select: "name price unit" },
      ],
    });

    if (!delivery) {
      return res.status(404).json({ message: "Delivery not found" });
    }

    // Calculate ETA values if coordinates are present
    function haversine([lng1, lat1], [lng2, lat2]) {
      const R = 6371000;
      const toRad = (deg) => (deg * Math.PI) / 180;
      const dLat = toRad(lat2 - lat1);
      const dLng = toRad(lng2 - lng1);
      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    }
    function estimateTimeMinutes(distanceMeters, speedKmph = 30) {
      const speedMps = (speedKmph * 1000) / 3600;
      const timeSec = distanceMeters / speedMps;
      return Math.round(timeSec / 60);
    }
    // Debug logging for ETA calculation
    console.log("--- ETA DEBUG ---");
    console.log("agentCoords:", delivery.agentCoords);
    console.log("supplierCoords:", delivery.supplierCoords);
    console.log("vendorCoords:", delivery.vendorCoords);
    let etaAgentToSupplier = null;
    let etaSupplierToVendor = null;
    if (delivery.agentCoords && delivery.supplierCoords) {
      const dist = haversine(delivery.agentCoords, delivery.supplierCoords);
      etaAgentToSupplier = estimateTimeMinutes(dist);
      console.log(
        "Agent→Supplier distance (m):",
        dist,
        "ETA (min):",
        etaAgentToSupplier
      );
    } else {
      console.log(
        "Missing agentCoords or supplierCoords for Agent→Supplier ETA"
      );
    }
    if (delivery.supplierCoords && delivery.vendorCoords) {
      const dist = haversine(delivery.supplierCoords, delivery.vendorCoords);
      etaSupplierToVendor = estimateTimeMinutes(dist);
      console.log(
        "Supplier→Vendor distance (m):",
        dist,
        "ETA (min):",
        etaSupplierToVendor
      );
    } else {
      console.log(
        "Missing supplierCoords or vendorCoords for Supplier→Vendor ETA"
      );
    }
    const deliveryWithEta = delivery.toObject();
    deliveryWithEta.etaAgentToSupplier = etaAgentToSupplier;
    deliveryWithEta.etaSupplierToVendor = etaSupplierToVendor;
    res.json(deliveryWithEta);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching delivery details",
      error: error.message,
    });
  }
});

module.exports = router;
