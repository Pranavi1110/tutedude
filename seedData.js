const mongoose = require("mongoose");
const Product = require("./server/models/Product");
const User = require("./server/models/User");

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/rasachain";

async function seed() {
  await mongoose.connect(MONGODB_URI);

  // Find a supplier user (or create one if none exists)
  let supplier = await User.findOne({ role: "supplier" });
  if (!supplier) {
    supplier = await User.create({
      name: "Sample Supplier",
      email: "supplier@example.com",
      password: "password",
      role: "supplier",
      phone: "1234567890",
      address: "123 Supplier St.",
    });
  }

  // Add sample products
  const products = [
    {
      name: "Apples",
      price: 2.5,
      stock: 100,
      supplierId: supplier._id,
      category: "Fruits",
      description: "Fresh apples",
      unit: "kg",
      isAvailable: true,
    },
    {
      name: "Bananas",
      price: 1.8,
      stock: 150,
      supplierId: supplier._id,
      category: "Fruits",
      description: "Ripe bananas",
      unit: "kg",
      isAvailable: true,
    },
  ];

  await Product.deleteMany({}); // Clear existing products
  await Product.insertMany(products);

  console.log("Seeded products and supplier user.");
  mongoose.disconnect();
}

seed().catch((err) => {
  console.error("Seeding error:", err);
  mongoose.disconnect();
});
