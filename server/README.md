# RasaChain Backend API

A Node.js + Express + MongoDB backend for the RasaChain vendor-supplier-delivery platform.

## Features

- **Role-based API endpoints** for Vendors, Suppliers, and Delivery Agents
- **Product management** for suppliers
- **Order processing** between vendors and suppliers
- **Delivery tracking** for delivery agents
- **MongoDB integration** with Mongoose ODM

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Create `.env` file:**
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/rasachain
   NODE_ENV=development
   ```

3. **Start MongoDB** (make sure MongoDB is running locally or use MongoDB Atlas)

4. **Run the server:**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

## API Endpoints

### Vendor Routes (`/api/vendor`)
- `GET /products` - Get all available products
- `POST /orders` - Place a new order
- `GET /orders/:vendorId` - Get vendor's orders
- `GET /orders/:orderId/details` - Get order details with delivery status

### Supplier Routes (`/api/supplier`)
- `GET /products/:supplierId` - Get supplier's products
- `POST /products` - Add new product
- `PUT /products/:productId` - Update product
- `DELETE /products/:productId` - Delete product
- `GET /orders/:supplierId` - Get incoming orders
- `PATCH /orders/:orderId/status` - Update order status
- `GET /orders/:orderId/details` - Get order details

### Delivery Routes (`/api/delivery`)
- `GET /available` - Get available deliveries
- `POST /accept/:orderId` - Accept a delivery
- `GET /agent/:deliveryAgentId` - Get agent's active deliveries
- `PATCH /:deliveryId/status` - Update delivery status
- `GET /:deliveryId/details` - Get delivery details

### Health Check
- `GET /api/health` - Server health status

## Database Models

- **User** - Vendors, Suppliers, Delivery Agents
- **Product** - Products managed by suppliers
- **Order** - Orders between vendors and suppliers
- **Delivery** - Delivery tracking and status

## Role-based Access

The API is designed for role-based access without authentication:
- **Vendors** can browse products and place orders
- **Suppliers** can manage products and handle orders
- **Delivery Agents** can accept and track deliveries

## Development

- Server runs on port 5000 by default
- MongoDB connection with fallback to localhost
- CORS enabled for frontend integration
- Error handling middleware included 