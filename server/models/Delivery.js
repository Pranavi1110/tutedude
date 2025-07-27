const mongoose = require("mongoose");

const deliverySchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Order",
    required: true,
  },
  deliveryAgentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  image:{
    type: String,
    trim: true,
    default: '', // Optional, fallback if no image is provided
  },
  status: {
    type: String,
    enum: ["assigned", "picked_up", "out_for_delivery", "delivered", "failed"],
    default: "assigned",
  },
  pickupLocation: {
    type: String,
    required: true,
  },
  deliveryLocation: {
    type: String,
    required: true,
  },
  proofOfDelivery: {
    type: String, // URL to image or OTP
    trim: true,
  },
  otp: {
    type: String,
    trim: true,
  },
  deliveryNotes: {
    type: String,
    trim: true,
  },
  agentCoords: {
    type: [Number], // [lng, lat]
    default: undefined,
  },
  supplierCoords: {
    type: [Number], // [lng, lat]
    default: undefined,
  },
  vendorCoords: {
    type: [Number], // [lng, lat]
    default: undefined,
  },
  estimatedDeliveryTime: {
    type: Date,
  },
  actualDeliveryTime: {
    type: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update the updatedAt field before saving
deliverySchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("Delivery", deliverySchema);
