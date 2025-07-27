const express = require("express");
const router = express.Router();
const axios = require("axios");
const mongoose = require("mongoose");

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
    res.status(500).json({
      message: "Error fetching products",
      error: error.message,
    });
  }
});

// Add new product with DALL·E image generation
router.post("/products", async (req, res) => {
  try {
    const { name, price, quantity, supplierId, category, description, unit } =
      req.body;

    // Generate image using Hugging Face Inference Providers router
    const prompt = `High-quality product photo of ${name}`;
    let imageUrl = "";
    const hfToken = process.env.HF_TOKEN;
    if (!hfToken) {
      return res.status(400).json({
        message: "Missing Hugging Face access token. Please set HF_TOKEN in your .env file.",
      });
    }
    try {
      const hfResponse = await axios.post(
        "https://router.huggingface.co/nebius/v1/images/generations",
        {
          response_format: "b64_json",
          prompt,
          model: "black-forest-labs/flux-dev"
        },
        {
          headers: {
            Authorization: `Bearer ${hfToken}`,
            "Content-Type": "application/json",
          }
        }
      );
      // The response is a JSON with a base64 image string in response.data.data[0].b64_json
      if (hfResponse.data && hfResponse.data.data && hfResponse.data.data[0]?.b64_json) {
        imageUrl = `data:image/png;base64,${hfResponse.data.data[0].b64_json}`;
      } else {
        imageUrl = "";
      }
    } catch (imageError) {
      console.error("Image generation failed:", imageError.message);
      imageUrl = "";
    }

    const product = new Product({
      name,
      price,
      quantity,
      supplierId,
      category,
      description,
      unit,
      image: imageUrl,
    });

    await product.save();
    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({
      message: "Error creating product",
      error: error.message,
    });
  }
});

// Update product
router.put("/products/:productId", async (req, res) => {
  try {
    const { name, price, quantity, category, description, unit, isAvailable } =
      req.body;

    const product = await Product.findByIdAndUpdate(
      req.params.productId,
      {
        name,
        price,
        quantity,
        category,
        description,
        unit,
        isAvailable,
      },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json(product);
  } catch (error) {
    res.status(500).json({
      message: "Error updating product",
      error: error.message,
    });
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
    res.status(500).json({
      message: "Error deleting product",
      error: error.message,
    });
  }
});

// Get supplier's incoming orders
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
    res.status(500).json({
      message: "Error fetching orders",
      error: error.message,
    });
  }
});

// Update order status (confirm, ready for pickup)
router.patch("/orders/:orderId/status", async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.orderId).populate({
      path: "items.productId",
      model: "Product",
    });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Decrement quantity if order marked ready for pickup
    if (status === "ready_for_pickup") {
      for (const item of order.items) {
        const product = item.productId;
        if (product && typeof product.quantity === "number") {
          await Product.findByIdAndUpdate(product._id, {
            $inc: { quantity: -item.quantity },
          });
        }
      }
    }

    order.status = status;
    await order.save();
    res.json(order);
  } catch (error) {
    res.status(500).json({
      message: "Error updating order status",
      error: error.message,
    });
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
    res.status(500).json({
      message: "Error fetching order details",
      error: error.message,
    });
  }
});

module.exports = router;
