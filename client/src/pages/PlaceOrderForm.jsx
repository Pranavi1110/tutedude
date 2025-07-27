import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import apiService from "../services/api";

// Load Razorpay script
const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve();
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = resolve;
    document.body.appendChild(script);
  });
};

const PlaceOrderForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { cart, user } = location.state || {};

  const [form, setForm] = useState({
    name: user?.name || "",
    mobileNumber: "",
    location: "",
    quantities: cart ? cart.map(() => 1) : [],
  });
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const userId = user?._id || user?.id;

  // Fetch geolocation
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const res = await fetch(
            `http://localhost:5002/api/geocode/reverse?lat=${latitude}&lon=${longitude}`
          );
          const data = await res.json();
          const a = data.address || {};
          const address = [
            a.house_number,
            a.road,
            a.suburb,
            a.city || a.town || a.village,
            a.state_district || a.state,
            a.postcode,
            a.country,
          ]
            .filter(Boolean)
            .join(", ") || data.display_name;

          setForm((prev) => ({ ...prev, location: address }));
        } catch {
          setForm((prev) => ({
            ...prev,
            location: `Lat: ${latitude.toFixed(5)}, Lon: ${longitude.toFixed(5)}`,
          }));
        }
        setLocating(false);
      },
      () => {
        setError("Unable to retrieve your location.");
        setLocating(false);
      }
    );
  };

  const handleChange = (e, idx) => {
    const { name, value } = e.target;
    if (name === "quantities") {
      const newQuantities = [...form.quantities];
      newQuantities[idx] = value;
      setForm({ ...form, quantities: newQuantities });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  // Create grouped orders for each supplier
  const createOrders = async () => {
    if (!userId) throw new Error("Invalid user: Missing ID");
    if (!cart?.length) throw new Error("Your cart is empty.");
    if (!form.location) throw new Error("Delivery location is required.");
    if (!form.mobileNumber) throw new Error("Mobile number is required.");

    const supplierGroups = {};
    cart.forEach((item, idx) => {
      let supplierId = item?.supplierId?._id || item?.supplierId;
      if (!supplierId || supplierId === "null") return;
      if (!supplierGroups[supplierId]) supplierGroups[supplierId] = [];
      supplierGroups[supplierId].push({
        productId: item._id,
        quantity: Number(form.quantities[idx]) || 1,
        price: item.price,
      });
    });

    const orderPromises = Object.entries(supplierGroups).map(([supplierId, items]) => {
      const orderData = {
        vendorId: userId,
        supplierId,
        items,
        deliveryAddress: form.location,
        mobileNumber: form.mobileNumber,
        pickupAddress: "Vendor Pickup Point",
        notes:` Order placed by ${form.name}`,
      };
      return apiService.vendor.placeOrder(orderData); // returns order object
    });

    const results = await Promise.allSettled(orderPromises);
    const successfulOrders = results
      .map((r) => (r.status === "fulfilled" ? r.value : null))
      .filter(Boolean);

    if (!successfulOrders.length) {
      throw new Error("Failed to create orders. Please try again.");
    }

    return successfulOrders;
  };

  // Update orders to "paid"
  const markOrdersPaid = async (orders) => {
    const statusPromises = orders.map((order) =>
      apiService.supplier.updateOrderStatus(order._id, "paid")
    );
    const results = await Promise.allSettled(statusPromises);
    if (results.some((r) => r.status === "rejected")) {
      throw new Error("Some orders placed but not marked as paid.");
    }
  };

  const finalizeOrder = async (orders) => {
    await markOrdersPaid(orders);
    localStorage.removeItem("vendorCart");
    localStorage.setItem("user", JSON.stringify(user));
    alert("Payment successful! Orders confirmed.");
    navigate("/orders", { state: { user } });
  };

  // Payment + order flow
  const handleSubmit = async (e, payLater = false) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      // Step 1: Create pending orders
      const orders = await createOrders();

      if (payLater) {
        // Just place the order as pending, no payment
        localStorage.removeItem("vendorCart");
        localStorage.setItem("user", JSON.stringify(user));
        alert("Order placed! You can pay later from your orders.");
        navigate("/past-orders", { state: { user } });
        return;
      }

      // Step 2: Calculate total payment amount
      const totalAmount = cart.reduce((sum, item, idx) => {
        return sum + (Number(form.quantities[idx]) || 1) * item.price;
      }, 0);

      // Step 3: Load Razorpay and open payment window
      await loadRazorpayScript();
      const options = {
        key: "rzp_test_sr1UaCzPtw1nDc",
        amount: Math.round(totalAmount * 100),
        currency: "INR",
        name: "Tutedude Order Payment",
        description: "Order Payment",
        handler: async () => {
          // On successful payment, mark all orders paid
          await finalizeOrder(orders);
        },
        prefill: {
          name: form.name,
          email: user?.email || "",
        },
        theme: { color: "#6366f1" },
        modal: {
          ondismiss: function () {
            setError("Payment cancelled. Orders remain pending.");
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", function () {
        setError("Payment failed. Orders remain pending. Try again.");
      });
      rzp.open();
    } catch (err) {
      console.error("Order/payment error:", err);
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  if (!cart || !user) {
    return <div className="text-red-500 text-xl p-8">Missing cart or user info.</div>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      <div className="bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900 bg-opacity-80 rounded-3xl p-8 w-full max-w-md shadow-2xl relative border-2 border-blue-700">
        <h2 className="text-2xl font-bold mb-4 text-blue-100">Order Details</h2>
        <form onSubmit={handleSubmit}>
          {/* Name */}
          <div className="mb-4">
            <label className="block text-blue-200 font-semibold mb-1">Name</label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              className="w-full border border-blue-700 bg-blue-950 bg-opacity-60 text-blue-100 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              required
            />
          </div>

          {/* Mobile */}
          <div className="mb-4">
            <label className="block text-blue-200 font-semibold mb-1">Mobile Number</label>
            <input
              type="tel"
              name="mobileNumber"
              value={form.mobileNumber}
              onChange={handleChange}
              className="w-full border border-blue-700 bg-blue-950 bg-opacity-60 text-blue-100 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              required
              pattern="[0-9]{10,15}"
              placeholder="Enter mobile number"
            />
          </div>

          {/* Location */}
          <div className="mb-4">
            <label className="block text-blue-200 font-semibold mb-1">Location</label>
            <div className="flex gap-2">
              <input
                type="text"
                name="location"
                value={form.location || ""}
                onChange={handleChange}
                className="w-full border border-blue-700 bg-blue-950 bg-opacity-60 text-blue-100 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                required
              />
              <button
                type="button"
                onClick={handleGetLocation}
                disabled={locating}
                className="bg-gradient-to-r from-blue-700 via-purple-700 to-pink-700 text-white px-4 py-2 rounded-full font-bold shadow-lg hover:scale-105 transition-transform duration-200"
              >
                {locating ? "Locating..." : "Use My Location"}
              </button>
            </div>
          </div>

          {/* Quantities */}
          <div className="mb-4">
            <label className="block text-blue-200 font-semibold mb-1">Quantity for each item</label>
            {cart.map((item, idx) => (
              <div key={item._id} className="flex items-center mb-2">
                <span className="w-32 text-blue-200">{item.name}</span>
                <input
                  type="number"
                  name="quantities"
                  min="0.01"
                  step="any"
                  value={form.quantities[idx]}
                  onChange={(e) => handleChange(e, idx)}
                  className="ml-2 border border-blue-700 bg-blue-950 bg-opacity-60 text-blue-100 rounded px-2 py-1 w-20 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  required
                />
              </div>
            ))}
          </div>

          {error && <div className="text-red-400 mb-2">{error}</div>}

          <div className="flex flex-col gap-3">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-yellow-500 via-orange-500 to-pink-500 text-white py-3 rounded-full font-bold text-xl shadow-lg hover:scale-105 transition-transform duration-200"
              onClick={(e) => handleSubmit(e, true)}
            >
              {loading ? "Processing..." : "Place Order (Pay Later)"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PlaceOrderForm;