const express = require("express");
const router = express.Router();
const Product = require("../models/Product");
const Order = require("../models/Order");

// Get supplier's products
router.get("/my-products/:supplierId", async (req, res) => {
  try {
    const products = await Product.find({
      supplierId: req.params.supplierId,
    }).sort({ createdAt: -1 });

    res.json(products);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching products", error: error.message });
  }
});

// Add new product
router.post("/products", async (req, res) => {
  try {
    const { name, price, stock, supplierId, category, description, unit } =
      req.body;

    const product = new Product({
      name,
      price,
      stock,
      supplierId,
      category,
      description,
      unit,
    });

    await product.save();
    res.status(201).json(product);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error creating product", error: error.message });
  }
});

// Update product
router.put("/products/:productId", async (req, res) => {
  try {
    const { name, price, stock, category, description, unit, isAvailable } =
      req.body;

    const product = await Product.findByIdAndUpdate(
      req.params.productId,
      { name, price, stock, category, description, unit, isAvailable },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json(product);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error updating product", error: error.message });
  }
});

// Delete product
router.delete("/products/:productId", async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.productId);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deleting product", error: error.message });
  }
});

// Get supplier's incoming orders
const mongoose = require("mongoose");
router.get("/my-orders/:supplierId", async (req, res) => {
  const { supplierId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(supplierId)) {
    return res.status(400).json({ message: "Invalid supplierId format" });
  }
  try {
    const orders = await Order.find({ supplierId })
      .populate("vendorId", "name email phone")
      .populate("items.productId", "name price unit")
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching orders", error: error.message });
  }
});

// Update order status (confirm, ready for pickup)
router.patch("/orders/:orderId/status", async (req, res) => {
  try {
    const { status } = req.body;

    const order = await Order.findByIdAndUpdate(
      req.params.orderId,
      { status },
      { new: true }
    ).populate("vendorId", "name email phone");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json(order);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error updating order status", error: error.message });
  }
});

// Get order details
router.get("/orders/:orderId/details", async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId)
      .populate("vendorId", "name email phone")
      .populate("items.productId", "name price unit");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json(order);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching order details", error: error.message });
  }
});

module.exports = router;
