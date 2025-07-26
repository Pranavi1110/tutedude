const express = require("express");
const router = express.Router();
const Order = require("../models/Order");
const Delivery = require("../models/Delivery");
const User = require("../models/User");

// Get available deliveries (ready for pickup)
router.get("/available", async (req, res) => {
  try {
    const availableOrders = await Order.find({
      status: "ready_for_pickup",
      deliveryAgentId: { $exists: false },
    })
      .populate("vendorId", "name phone")
      .populate("supplierId", "name phone")
      .populate("items.productId", "name unit")
      .sort({ createdAt: -1 });

    res.json(availableOrders);
  } catch (error) {
    res
      .status(500)
      .json({
        message: "Error fetching available deliveries",
        error: error.message,
      });
  }
});

// Accept a delivery
router.post("/accept/:orderId", async (req, res) => {
  try {
    const { deliveryAgentId } = req.body;

    // Check if order is still available
    const order = await Order.findById(req.params.orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.status !== "ready_for_pickup") {
      return res.status(400).json({ message: "Order is not ready for pickup" });
    }

    if (order.deliveryAgentId) {
      return res
        .status(400)
        .json({ message: "Order already assigned to another delivery agent" });
    }

    // Update order with delivery agent
    await Order.findByIdAndUpdate(req.params.orderId, {
      deliveryAgentId,
      status: "out_for_delivery",
    });

    // Create delivery record
    const delivery = new Delivery({
      orderId: req.params.orderId,
      deliveryAgentId,
      status: "assigned",
      pickupLocation: order.pickupAddress,
      deliveryLocation: order.deliveryAddress,
    });

    await delivery.save();

    res.json({ message: "Delivery accepted successfully", delivery });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error accepting delivery", error: error.message });
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
          { path: "vendorId", select: "name phone" },
          { path: "supplierId", select: "name phone" },
          { path: "items.productId", select: "name unit" },
        ],
      })
      .sort({ createdAt: -1 });

    res.json(deliveries);
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
      await Order.findByIdAndUpdate(delivery.orderId._id, {
        status: "delivered",
      });
    }

    res.json(delivery);
  } catch (error) {
    res
      .status(500)
      .json({
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

    res.json(delivery);
  } catch (error) {
    res
      .status(500)
      .json({
        message: "Error fetching delivery details",
        error: error.message,
      });
  }
});

module.exports = router;
