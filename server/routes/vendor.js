const express = require("express");
const router = express.Router();
const Product = require("../models/Product");
const Order = require("../models/Order");
const Delivery = require("../models/Delivery");
const User = require("../models/User");

// Get all available products
router.get("/products", async (req, res) => {
  try {
    const products = await Product.find({
      isAvailable: true,
      quantity: { $gt: 0 },
    })
      .populate("supplierId", "name email phone")
      .select("-__v");
    res.json(products);
  } catch (error) {
    console.error("Vendor products route error:", error);
    res
      .status(500)
      .json({ message: "Error fetching products", error: error.message });
  }
});

// Place a new order
router.post("/orders", async (req, res) => {
  try {
    const {
      vendorId,
      supplierId,
      items,
      deliveryAddress,
      pickupAddress,
      notes,
    } = req.body;

    // Calculate total amount
    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) {
        return res
          .status(404)
          .json({ message: `Product ${item.productId} not found` });
      }

      if (product.quantity < item.quantity) {
        return res
          .status(400)
          .json({ message: `Insufficient quantity for ${product.name}` });
      }

      const itemTotal = product.price * item.quantity;
      totalAmount += itemTotal;

      orderItems.push({
        productId: item.productId,
        quantity: item.quantity,
        price: product.price,
        total: itemTotal,
      });
      // Do NOT decrement product quantity here
    }

    const order = new Order({
      vendorId,
      supplierId,
      items: orderItems,
      totalAmount,
      deliveryAddress,
      pickupAddress,
      notes,
    });

    await order.save();

    res.status(201).json(order);
  } catch (error) {
    console.error("Order creation error:", error);
    res
      .status(500)
      .json({ message: "Error creating order", error: error.message });
  }
});

// Get vendor's orders
router.get("/my-orders/:vendorId", async (req, res) => {
  try {
    const orders = await Order.find({ vendorId: req.params.vendorId })
      .populate("supplierId", "name email phone")
      .populate("deliveryAgentId", "name phone")
      .populate("items.productId", "name price unit")
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching orders", error: error.message });
  }
});

// Get order details with delivery status
router.get("/orders/:orderId/details", async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId)
      .populate("supplierId", "name email phone")
      .populate("deliveryAgentId", "name phone")
      .populate("items.productId", "name price unit");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const delivery = await Delivery.findOne({ orderId: req.params.orderId });

    res.json({ order, delivery });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching order details", error: error.message });
  }
});

module.exports = router;
