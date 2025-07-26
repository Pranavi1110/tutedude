const mongoose = require("mongoose");
require("dotenv").config();

// Import models
const User = require("./models/User");
const Product = require("./models/Product");
const Order = require("./models/Order");
const Delivery = require("./models/Delivery");

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/rasachain";

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log("Connected to MongoDB for seeding");
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error);
  });

const seedData = async () => {
  try {
    // Clear existing data
    await User.deleteMany({});
    await Product.deleteMany({});
    await Order.deleteMany({});
    await Delivery.deleteMany({});

    console.log("Cleared existing data");

    // Create users with plain text passwords
    const users = await User.create([
      {
        name: "John Vendor",
        email: "vendor@example.com",
        password: "password123",
        role: "vendor",
        phone: "+91-9876543210",
        address: "Street Food Market, Sector 10, Delhi"
      },
      {
        name: "Sarah Supplier",
        email: "supplier@example.com",
        password: "password123",
        role: "supplier",
        phone: "+91-9876543211",
        address: "Fresh Farms, Sector 15, Delhi"
      },
      {
        name: "Mike Delivery",
        email: "delivery@example.com",
        password: "password123",
        role: "delivery",
        phone: "+91-9876543212",
        address: "Delivery Hub, Sector 20, Delhi"
      }
    ]);

    console.log("Created users:", users.length);

    // Create products
    const products = await Product.create([
      {
        name: "Fresh Tomatoes",
        description: "Organic red tomatoes",
        price: 40,
        stock: 100,
        unit: "kg",
        category: "Vegetables",
        supplierId: users[1]._id, // Sarah Supplier
        isAvailable: true
      },
      {
        name: "Onions",
        description: "Fresh white onions",
        price: 30,
        stock: 150,
        unit: "kg",
        category: "Vegetables",
        supplierId: users[1]._id,
        isAvailable: true
      },
      {
        name: "Potatoes",
        description: "Fresh potatoes",
        price: 25,
        stock: 200,
        unit: "kg",
        category: "Vegetables",
        supplierId: users[1]._id,
        isAvailable: true
      },
      {
        name: "Carrots",
        description: "Organic carrots",
        price: 35,
        stock: 80,
        unit: "kg",
        category: "Vegetables",
        supplierId: users[1]._id,
        isAvailable: true
      },
      {
        name: "Cabbage",
        description: "Fresh green cabbage",
        price: 20,
        stock: 60,
        unit: "kg",
        category: "Vegetables",
        supplierId: users[1]._id,
        isAvailable: true
      }
    ]);

    console.log("Created products:", products.length);

    // Create sample orders
    const orders = await Order.create([
      {
        vendorId: users[0]._id, // John Vendor
        supplierId: users[1]._id, // Sarah Supplier
        items: [
          {
            productId: products[0]._id, // Tomatoes
            quantity: 5,
            price: 40,
            total: 200
          },
          {
            productId: products[1]._id, // Onions
            quantity: 3,
            price: 30,
            total: 90
          }
        ],
        totalAmount: 290,
        deliveryAddress: "Street Food Market, Sector 10, Delhi",
        pickupAddress: "Fresh Farms, Sector 15, Delhi",
        notes: "Please deliver fresh items",
        status: "pending"
      },
      {
        vendorId: users[0]._id,
        supplierId: users[1]._id,
        items: [
          {
            productId: products[2]._id, // Potatoes
            quantity: 10,
            price: 25,
            total: 250
          }
        ],
        totalAmount: 250,
        deliveryAddress: "Street Food Market, Sector 10, Delhi",
        pickupAddress: "Fresh Farms, Sector 15, Delhi",
        notes: "Need for tomorrow",
        status: "ready_for_pickup"
      }
    ]);

    console.log("Created orders:", orders.length);

    // Create sample deliveries
    const deliveries = await Delivery.create([
      {
        orderId: orders[1]._id, // Second order
        deliveryAgentId: users[2]._id, // Mike Delivery
        pickupLocation: "Fresh Farms, Sector 15, Delhi",
        deliveryLocation: "Street Food Market, Sector 10, Delhi",
        status: "out_for_delivery",
        estimatedDeliveryTime: new Date(Date.now() + 2 * 60 * 60 * 1000) // 2 hours from now
      }
    ]);

    console.log("Created deliveries:", deliveries.length);

    console.log("✅ Database seeded successfully!");
    console.log("\nSample login credentials:");
    console.log("Vendor: vendor@example.com / password123");
    console.log("Supplier: supplier@example.com / password123");
    console.log("Delivery: delivery@example.com / password123");

  } catch (error) {
    console.error("Error seeding data:", error);
  } finally {
    mongoose.connection.close();
  }
};

seedData(); 