const express = require("express");
const router = express.Router();
const Product = require("../models/Product");
const Order = require("../models/Order");
const User = require("../models/User");
const Delivery = require("../models/Delivery");
const mongoose = require("mongoose");

// Debug: List all orders for a vendor
router.get("/all-orders/:vendorId", async (req, res) => {
  try {
    const { vendorId } = req.params;
    const orders = await Order.find({ vendorId }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to fetch orders", error: error.message });
  }
});

// Orders statistics (daily, weekly, monthly counts)
router.get("/order-stats/:vendorId", async (req, res) => {
  try {
    const { vendorId } = req.params;
    console.log("[Order Stats] vendorId received:", vendorId);
    const orderCount = await Order.countDocuments({
      vendorId: new mongoose.Types.ObjectId(vendorId),
    });
    console.log(
      `[Order Stats] Total orders for vendorId ${vendorId}:`,
      orderCount
    );

    const daily = await Order.aggregate([
      { $match: { vendorId: new mongoose.Types.ObjectId(vendorId) } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);
    console.log(
      `[Order Stats] Daily aggregation for vendorId ${vendorId}:`,
      daily
    );

    const weekly = await Order.aggregate([
      { $match: { vendorId: new mongoose.Types.ObjectId(vendorId) } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%U", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);
    console.log(
      `[Order Stats] Weekly aggregation for vendorId ${vendorId}:`,
      weekly
    );

    const monthly = await Order.aggregate([
      { $match: { vendorId: new mongoose.Types.ObjectId(vendorId) } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);
    console.log(
      `[Order Stats] Monthly aggregation for vendorId ${vendorId}:`,
      monthly
    );

    res.json({ daily, weekly, monthly });
  } catch (error) {
    console.error("[Order Stats] Error:", error);
    res.status(500).json({ message: "Failed to fetch order stats" });
  }
});

// Ensure default supplier exists
async function getDefaultSupplier() {
  let supplier = await User.findOne({ email: "default@supplier.com" });
  if (!supplier) {
    supplier = new User({
      name: "Default Supplier",
      email: "default@supplier.com",
      password: "placeholder", // Hash in production
      role: "supplier",
    });
    await supplier.save();
  }
  return supplier;
}

// -------------------- AI POWERED ENDPOINTS --------------------

// Recommendations with product images
router.get("/recommendations/:vendorId", async (req, res) => {
  try {
    const { vendorId } = req.params;

    const orders = await Order.find({ vendorId })
      .populate("items.productId", "category name price stock image")
      .sort({ createdAt: -1 })
      .limit(20);

    const categoryCount = {};
    const purchasedProductIds = new Set();

    orders.forEach((order) => {
      order.items.forEach((item) => {
        const product = item.productId;
        if (product) {
          purchasedProductIds.add(String(product._id));
          if (product.category) {
            categoryCount[product.category] =
              (categoryCount[product.category] || 0) + item.quantity;
          }
        }
      });
    });

    const topCategory = Object.entries(categoryCount).sort(
      (a, b) => b[1] - a[1]
    )[0]?.[0];
    let recommendations = [];

    if (topCategory) {
      recommendations = await Product.find({
        category: topCategory,
        _id: { $nin: Array.from(purchasedProductIds) },
        stock: { $gt: 0 },
        isAvailable: true,
      })
        .select("name price stock category image")
        .sort({ stock: -1 })
        .limit(5);
    }

    if (!recommendations || recommendations.length === 0) {
      recommendations = await Product.find({
        isAvailable: true,
        stock: { $gt: 0 },
      })
        .select("name price stock category image")
        .sort({ price: 1 })
        .limit(5);
    }

    res.json(recommendations);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch recommendations" });
  }
});

// Trending products with images (last 7 days)
router.get("/trending-products", async (req, res) => {
  try {
    const last7Days = new Date();
    last7Days.setDate(last7Days.getDate() - 7);

    const recentOrders = await Order.find({
      createdAt: { $gte: last7Days },
    }).populate("items.productId", "name price stock category image");

    const demandMap = {};
    recentOrders.forEach((order) => {
      order.items.forEach((item) => {
        const product = item.productId;
        if (product) {
          demandMap[product._id] =
            (demandMap[product._id] || 0) + item.quantity;
        }
      });
    });

    const topProducts = Object.entries(demandMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id]) => id);

    let trendingProducts = [];
    if (topProducts.length > 0) {
      trendingProducts = await Product.find({
        _id: { $in: topProducts },
      }).select("name price stock category image");
    }

    if (!trendingProducts || trendingProducts.length === 0) {
      trendingProducts = await Product.find({
        isAvailable: true,
        stock: { $gt: 0 },
      })
        .select("name price stock category image")
        .sort({ price: -1 })
        .limit(5);
    }

    res.json(trendingProducts);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch trending products" });
  }
});

// -------------------- CORE ROUTES --------------------

// Get all products
router.get("/all-products", async (req, res) => {
  try {
    const products = await Product.find({})
      .populate("supplierId", "name email")
      .select("-__v");
    res.json(products);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching all products", error: error.message });
  }
});

// Get only available products
router.get("/products", async (req, res) => {
  try {
    const products = await Product.find({
      isAvailable: true,
      $or: [{ stock: { $gt: 0 } }, { quantity: { $gt: 0 } }],
    })
      .populate("supplierId", "name email")
      .select("-__v");

    const normalized = products.map((p) => ({
      ...p.toObject(),
      stock: p.stock ?? p.quantity ?? 0,
    }));

    res.json(normalized);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching products", error: error.message });
  }
});

// Create new order (save product image)
router.post("/orders", async (req, res) => {
  try {
    const {
      vendorId,
      supplierId,
      items,
      deliveryAddress,
      mobileNumber,
      pickupAddress,
      notes,
    } = req.body;

    if (!vendorId || !mongoose.Types.ObjectId.isValid(vendorId)) {
      return res.status(400).json({ message: "Invalid or missing vendorId" });
    }
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "No order items provided" });
    }
    if (!deliveryAddress) {
      return res.status(400).json({ message: "Delivery address is required" });
    }
    if (!mobileNumber) {
      return res.status(400).json({ message: "Mobile number is required" });
    }

    let validSupplierId = supplierId;
    if (!validSupplierId || !mongoose.Types.ObjectId.isValid(validSupplierId)) {
      const defaultSupplier = await getDefaultSupplier();
      validSupplierId = defaultSupplier._id;
    }

    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
      let product = await Product.findById(item.productId);
      if (!product) {
        const defaultSupplier = await getDefaultSupplier();
        product = new Product({
          name: "Auto-Created Product",
          price: item.price || 100,
          stock: 100,
          supplierId: defaultSupplier._id,
          category: "Auto",
          unit: "kg",
          image: "", // Placeholder image
          isAvailable: true,
        });
        await product.save();
      }

      const currentStock = product.stock ?? product.quantity ?? 0;
      if (currentStock < item.quantity) {
        return res
          .status(400)
          .json({ message: `Insufficient stock for ${product.name}` });
      }

      const itemTotal = product.price * item.quantity;
      totalAmount += itemTotal;

      orderItems.push({
        productId: product._id,
        quantity: item.quantity,
        price: product.price,
        total: itemTotal,
        image: product.image || "", // Store image here
      });

      await Product.findByIdAndUpdate(product._id, {
        $inc: { stock: -item.quantity },
      });
    }

    let supplierAddress = "";
    try {
      const supplier = await User.findById(validSupplierId);
      supplierAddress = supplier?.address || "";
    } catch {
      supplierAddress = "";
    }

    const order = new Order({
      vendorId,
      supplierId: validSupplierId,
      items: orderItems,
      totalAmount,
      deliveryAddress,
      mobileNumber,
      pickupAddress: pickupAddress || "Vendor Pickup Point",
      notes,
      status: "pending",
      supplierAddress,
    });

    await order.save();
    res.status(201).json(order);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error creating order", error: error.message });
  }
});

// Get vendor's orders (with populated images)
router.get("/my-orders/:vendorId", async (req, res) => {
  try {
    const orders = await Order.find({ vendorId: req.params.vendorId })
      .populate("supplierId", "name email mobile")
      .populate("deliveryAgentId", "name")
      .populate("items.productId", "name price unit image")
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching orders", error: error.message });
  }
});

// Get order details (with images)
router.get("/orders/:orderId/details", async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId)
      .populate("supplierId", "name email")
      .populate("deliveryAgentId", "name")
      .populate("items.productId", "name price unit image");

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

// -------------------- BACKFILL SCRIPT (optional) --------------------
router.post("/backfill-images", async (req, res) => {
  try {
    const orders = await Order.find({ "items.image": "" }).populate(
      "items.productId",
      "image"
    );
    let updatedCount = 0;

    for (const order of orders) {
      let changed = false;
      order.items.forEach((item) => {
        if (!item.image && item.productId?.image) {
          item.image = item.productId.image;
          changed = true;
        }
      });
      if (changed) {
        await order.save();
        updatedCount++;
      }
    }
    res.json({ message: `Updated ${updatedCount} orders with images` });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error during backfill", error: error.message });
  }
});

module.exports = router;
