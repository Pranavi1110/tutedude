const mongoose = require('mongoose');
const User = require('./models/User');
const Product = require('./models/Product');
const Order = require('./models/Order');

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rasachain';

async function seedData() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Product.deleteMany({});
    await Order.deleteMany({});

    // Create sample users
    const supplier1 = await User.create({
      name: 'Fresh Farms',
      email: 'freshfarms@example.com',
      password: 'password123',
      role: 'supplier',
      phone: '+91-9876543210',
      address: 'Fresh Farms, Sector 15, Delhi'
    });

    const supplier2 = await User.create({
      name: 'Veggie Supply',
      email: 'veggiesupply@example.com',
      password: 'password123',
      role: 'supplier',
      phone: '+91-9876543211',
      address: 'Veggie Supply, Sector 8, Delhi'
    });

    const vendor1 = await User.create({
      name: 'Street Food Vendor 1',
      email: 'vendor1@example.com',
      password: 'password123',
      role: 'vendor',
      phone: '+91-9876543212',
      address: 'Street Food Market, Sector 10, Delhi'
    });

    const deliveryAgent1 = await User.create({
      name: 'Delivery Agent 1',
      email: 'delivery1@example.com',
      password: 'password123',
      role: 'delivery',
      phone: '+91-9876543213',
      address: 'Delivery Hub, Sector 12, Delhi'
    });

    // Create sample products
    const products = await Product.create([
      {
        name: 'Fresh Tomatoes',
        price: 40,
        stock: 100,
        supplierId: supplier1._id,
        category: 'Vegetables',
        description: 'Fresh red tomatoes',
        unit: 'kg'
      },
      {
        name: 'Onions',
        price: 30,
        stock: 150,
        supplierId: supplier1._id,
        category: 'Vegetables',
        description: 'Fresh onions',
        unit: 'kg'
      },
      {
        name: 'Potatoes',
        price: 25,
        stock: 200,
        supplierId: supplier2._id,
        category: 'Vegetables',
        description: 'Fresh potatoes',
        unit: 'kg'
      },
      {
        name: 'Rice',
        price: 60,
        stock: 50,
        supplierId: supplier2._id,
        category: 'Grains',
        description: 'Basmati rice',
        unit: 'kg'
      }
    ]);

    // Create sample orders
    const order1 = await Order.create({
      vendorId: vendor1._id,
      supplierId: supplier1._id,
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
      status: 'ready_for_pickup',
      deliveryAddress: 'Street Food Market, Sector 10, Delhi',
      pickupAddress: 'Fresh Farms, Sector 15, Delhi',
      notes: 'Please deliver fresh items'
    });

    const order2 = await Order.create({
      vendorId: vendor1._id,
      supplierId: supplier2._id,
      items: [
        {
          productId: products[2]._id, // Potatoes
          quantity: 10,
          price: 25,
          total: 250
        }
      ],
      totalAmount: 250,
      status: 'pending',
      deliveryAddress: 'Street Food Market, Sector 10, Delhi',
      pickupAddress: 'Veggie Supply, Sector 8, Delhi',
      notes: 'Please deliver fresh potatoes'
    });

    console.log('Sample data seeded successfully!');
    console.log('Users created:', await User.countDocuments());
    console.log('Products created:', await Product.countDocuments());
    console.log('Orders created:', await Order.countDocuments());

    // Print sample data for testing
    console.log('\nSample Data:');
    console.log('Supplier 1 ID:', supplier1._id);
    console.log('Supplier 2 ID:', supplier2._id);
    console.log('Vendor 1 ID:', vendor1._id);
    console.log('Delivery Agent 1 ID:', deliveryAgent1._id);
    console.log('Order 1 ID:', order1._id);
    console.log('Order 2 ID:', order2._id);

  } catch (error) {
    console.error('Error seeding data:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the seed function
seedData(); 