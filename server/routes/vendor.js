
const express = require("express");
const router = express.Router();
const Product = require("../models/Product");
const Order = require("../models/Order");
const mongoose = require("mongoose");

// Debug: List all orders for a vendor
router.get("/all-orders/:vendorId", async (req, res) => {
  try {
    const { vendorId } = req.params;
    const orders = await Order.find({ vendorId }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch orders", error: error.message });
  }
});

// Orders statistics for charting (grouped by day, week, month)
router.get("/order-stats/:vendorId", async (req, res) => {
  try {
    const { vendorId } = req.params;
    console.log("vend:",vendorId);
    // Group by day
    const daily = await Order.aggregate([
      { $match: { vendorId: new mongoose.Types.ObjectId(vendorId) } },
      { $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        count: { $sum: 1 }
      } },
      { $sort: { _id: 1 } }
    ]);
    // Group by week
    const weekly = await Order.aggregate([
      { $match: { vendorId: new mongoose.Types.ObjectId(vendorId) } },
      { $group: {
        _id: { $dateToString: { format: "%Y-%U", date: "$createdAt" } },
        count: { $sum: 1 }
      } },
      { $sort: { _id: 1 } }
    ]);
    // Group by month
    const monthly = await Order.aggregate([
      { $match: { vendorId: new mongoose.Types.ObjectId(vendorId) } },
      { $group: {
        _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
        count: { $sum: 1 }
      } },
      { $sort: { _id: 1 } }
    ]);
    res.json({ daily, weekly, monthly });
  } catch (error) {
    console.error("Order stats error:", error);
    res.status(500).json({ message: "Failed to fetch order stats" });
  }
});

// Utility: Ensure default supplier exists
async function getDefaultSupplier() {
  let supplier = await User.findOne({ email: "default@supplier.com" });
  if (!supplier) {
    supplier = new User({
      name: "Default Supplier",
      email: "default@supplier.com",
      password: "placeholder", // Hash properly in production
      role: "supplier"
    });
    await supplier.save();
  }
  return supplier;
}

// -------------------- AI-POWERED ENDPOINTS --------------------

// Personalized recommendations for a vendor (category + purchase history)
router.get("/recommendations/:vendorId", async (req, res) => {
  try {
    const { vendorId } = req.params;

    // Fetch vendor's recent 20 orders
    const orders = await Order.find({ vendorId })
      .populate("items.productId", "category name price stock")
      .sort({ createdAt: -1 })
      .limit(20);

    const categoryCount = {};
    const purchasedProductIds = new Set();

    // Analyze purchase patterns
    orders.forEach(order => {
      order.items.forEach(item => {
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

    // Pick top purchased category
    const topCategory = Object.entries(categoryCount)
      .sort((a, b) => b[1] - a[1])[0]?.[0];

    let recommendations = [];
    if (topCategory) {
      // Recommend products in the same category but not recently purchased
      recommendations = await Product.find({
        category: topCategory,
        _id: { $nin: Array.from(purchasedProductIds) },
        stock: { $gt: 0 },
        isAvailable: true
      })
        .sort({ stock: -1 })
        .limit(5);
    }
    // Fallback: If no recommendations, return 5 cheapest available products
    if (!recommendations || recommendations.length === 0) {
      recommendations = await Product.find({ isAvailable: true, stock: { $gt: 0 } })
        .sort({ price: 1 })
        .limit(5);
    }
    res.json(recommendations);
  } catch (error) {
    console.error("Recommendations error:", error);
    res.status(500).json({ message: "Failed to fetch recommendations" });
  }
});

// Trending products (demand analysis for last 7 days)
router.get("/trending-products", async (req, res) => {
  try {
    const last7Days = new Date();
    last7Days.setDate(last7Days.getDate() - 7);

    // Find recent orders
    const recentOrders = await Order.find({ createdAt: { $gte: last7Days } })
      .populate("items.productId", "name price stock category");

    const demandMap = {};
    recentOrders.forEach(order => {
      order.items.forEach(item => {
        const product = item.productId;
        if (product) {
          demandMap[product._id] = (demandMap[product._id] || 0) + item.quantity;
        }
      });
    });

    // Sort by demand
    const topProducts = Object.entries(demandMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id]) => id);

    let trendingProducts = [];
    if (topProducts.length > 0) {
      trendingProducts = await Product.find({ _id: { $in: topProducts } });
    }
    // Fallback: If no trending, return 5 most expensive available products
    if (!trendingProducts || trendingProducts.length === 0) {
      trendingProducts = await Product.find({ isAvailable: true, stock: { $gt: 0 } })
        .sort({ price: -1 })
        .limit(5);
    }
    res.json(trendingProducts);
  } catch (error) {
    console.error("Trending products error:", error);
    res.status(500).json({ message: "Failed to fetch trending products" });
  }
});

// -------------------- EXISTING ROUTES --------------------

// Get all products (including unavailable or zero stock)
router.get("/all-products", async (req, res) => {
  try {
    const products = await Product.find({})
      .populate("supplierId", "name email")
      .select("-__v");
    res.json(products);
  } catch (error) {
    console.error("Vendor all-products route error:", error);
    res.status(500).json({ message: "Error fetching all products", error: error.message });
  }
});

// Get only available products
router.get("/products", async (req, res) => {
  try {
    const products = await Product.find({
      isAvailable: true,
      $or: [{ stock: { $gt: 0 } }, { quantity: { $gt: 0 } }]
    })
      .populate("supplierId", "name email")
      .select("-__v");

    const normalized = products.map((p) => ({
      ...p.toObject(),
      stock: p.stock ?? p.quantity ?? 0
    }));

    res.json(normalized);
  } catch (error) {
    console.error("Vendor products route error:", error);
    res.status(500).json({ message: "Error fetching products", error: error.message });
  }
});

// Place a new order (always starts as "pending")
router.post("/orders", async (req, res) => {
  try {
    const { vendorId, supplierId, items, deliveryAddress, mobileNumber, pickupAddress, notes } = req.body;

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
          isAvailable: true,
        });
        await product.save();
      }

      const currentStock = product.stock ?? product.quantity ?? 0;
      if (currentStock < item.quantity) {
        return res.status(400).json({ message: `Insufficient stock for ${product.name}` });
      }

      const itemTotal = product.price * item.quantity;
      totalAmount += itemTotal;

      orderItems.push({
        productId: product._id,
        quantity: item.quantity,
        price: product.price,
        total: itemTotal,
      });

      await Product.findByIdAndUpdate(product._id, { $inc: { stock: -item.quantity } });
    }


    // Fetch supplier address
    let supplierAddress = "";
    try {
      const supplier = await User.findById(validSupplierId);
      supplierAddress = supplier?.address || "";
    } catch (e) {
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
    console.error("Order creation error:", error);
    res.status(500).json({ message: "Error creating order", error: error.message });
  }
});

// Get vendor's orders
router.get("/my-orders/:vendorId", async (req, res) => {
  try {
    const orders = await Order.find({ vendorId: req.params.vendorId })
      .populate("supplierId", "name email mobile")
      .populate("deliveryAgentId", "name")
      .populate("items.productId", "name price unit")
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: "Error fetching orders", error: error.message });
  }
});

// Get order details (with delivery info)
router.get("/orders/:orderId/details", async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId)
      .populate("supplierId", "name email")
      .populate("deliveryAgentId", "name")
      .populate("items.productId", "name price unit");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const delivery = await Delivery.findOne({ orderId: req.params.orderId });
    res.json({ order, delivery });
  } catch (error) {
    res.status(500).json({ message: "Error fetching order details", error: error.message });
  }
});

module.exports = router;
