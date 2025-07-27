// import React, { useEffect, useState, useCallback } from "react";
// import { useLocation, useNavigate } from "react-router-dom";
// import apiService from "../services/api";

// // Utility: Load Razorpay Script
// const API_BASE_URL = import.meta.env.VITE_API_URL;
// function loadRazorpayScript() {
//   return new Promise((resolve) => {
//     if (window.Razorpay) return resolve();
//     const script = document.createElement("script");
//     script.src = "https://checkout.razorpay.com/v1/checkout.js";
//     script.onload = resolve;
//     document.body.appendChild(script);
//   });
// }

// // Utility: Convert orders to CSV
// function ordersToCSV(orders) {
//   if (!orders || orders.length === 0) return "";
//   const header = [
//     "Order ID",
//     "Date",
//     "Supplier",
//     "Delivery Address",
//     "Total Amount",
//     "Status",
//     "Items",
//   ];
//   const rows = orders.map((order) => {
//     const items = order.items
//       .map((item) => {
//         const name = item.productId?.name || "Product";
//         return `${name} (Qty: ${item.quantity} @ ₹${item.price})`;
//       })
//       .join("; ");
//     return [
//       order._id,
//       new Date(order.createdAt).toLocaleString(),
//       order.supplierId?.name || "Unknown",
//       order.deliveryAddress,
//       order.totalAmount,
//       order.status || "Placed",
//       items,
//     ]
//       .map((field) => `"${String(field).replace(/"/g, '""')}"`)
//       .join(",");
//   });
//   return [header.join(","), ...rows].join("\r\n");
// }

// const PastOrders= () => {
//   const navigate = useNavigate();
//   const location = useLocation();

//   const [user, setUser] = useState(null);
//   const [checkedUser, setCheckedUser] = useState(false);
//   const [orders, setOrders] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   const [currentPage, setCurrentPage] = useState(1);
//   const itemsPerPage = 5;
//   const totalPages = Math.ceil(orders.length / itemsPerPage);
//   const paginatedOrders = orders.slice(
//     (currentPage - 1) * itemsPerPage,
//     currentPage * itemsPerPage
//   );

//   // Pay Now
//   const handlePayNow = async (order) => {
//     if (!user || !user._id) {
//       alert("User not loaded. Please refresh and try again.");
//       return;
//     }
//     try {
//       await loadRazorpayScript();
//       const options = {
//         key: "rzp_test_sr1UaCzPtw1nDc", // Test key
//         amount: Math.round(order.totalAmount * 100),
//         currency: "INR",
//         name: "Tutedude Order Payment",
//         description: `Payment for Order #${order._id}`,
//         handler: async () => {
//           await apiService.supplier.updateOrderStatus(order._id, "paid");
//           alert("Payment successful! Order marked as paid.");
//           const data = await apiService.vendor.getVendorOrders(user._id);
//           setOrders(data);
//         },
//         prefill: {
//           name: user?.name || "",
//           email: user?.email || "",
//         },
//         theme: { color: "#6366f1" },
//         modal: {
//           ondismiss: function () {
//             alert("Payment cancelled. Order remains pending.");
//           },
//         },
//       };
//       const rzp = new window.Razorpay(options);
//       rzp.on("payment.failed", function () {
//         alert("Payment failed. Order remains pending. Try again.");
//       });
//       rzp.open();
//     } catch (err) {
//       alert("Error opening payment window: " + (err.message || err));
//     }
//   };

//   // Normalize user
//   useEffect(() => {
//     let foundUser = null;
//     try {
//       const stored = localStorage.getItem("user");
//       foundUser = location.state?.user || (stored ? JSON.parse(stored) : null);
//       if (foundUser && !foundUser._id && foundUser.id) {
//         foundUser._id = foundUser.id;
//       }
//     } catch {}
//     setUser(foundUser);
//     setCheckedUser(true);
//   }, [location.state]);

//   // Fetch orders
//   useEffect(() => {
//     if (!user || !user._id) return;
//     const fetchOrders = async () => {
//       try {
//         setLoading(true);
//         const data = await apiService.vendor.getVendorOrders(user._id);
//         setOrders(data);
//       } catch (err) {
//         console.error("Error fetching orders:", err);
//         setError("Failed to fetch orders.");
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchOrders();
//   }, [user]);

//   // Export CSV
//   const handleExportCSV = () => {
//     const csv = ordersToCSV(orders);
//     const blob = new Blob([csv], { type: "text/csv" });
//     const url = URL.createObjectURL(blob);
//     const a = document.createElement("a");
//     a.href = url;
//     a.download = "past_orders.csv";
//     document.body.appendChild(a);
//     a.click();
//     document.body.removeChild(a);
//     URL.revokeObjectURL(url);
//   };

//   // Order Again
//   const handleOrderAgain = useCallback((order) => {
//     const cart = order.items.map((item) => ({
//       ...item.productId,
//       quantity: item.quantity,
//       price: item.price,
//       image: item.image || item.productId?.image || "",
//       supplierId: order.supplierId?._id || order.supplierId,
//     }));
//     localStorage.setItem("vendorCart", JSON.stringify(cart));
//     window.location.href = "/place-order?orderAgain=1";
//   }, []);

//   if (checkedUser && (!user || !user._id)) {
//     return (
//       <div className="text-red-500 text-xl p-8">
//         User not found. Please log in to view your past orders.
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex flex-col items-center p-8">
//       <div className=" min-w-6xl flex flex-col gap-4 mb-8">
//         <div className="flex justify-between items-center">
//           <button
//             className="bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded-full font-bold shadow text-white"
//             onClick={() => navigate("/vendor", { state: { user } })}
//           >
//             Go Back to Dashboard
//           </button>
//           {orders.length > 0 && (
//             <button
//               className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-full font-bold shadow"
//               onClick={handleExportCSV}
//             >
//               Export as CSV
//             </button>
//           )}
//         </div>
//         <h2 className="text-3xl font-bold text-blue-100">Your Past Orders</h2>
//       </div>

//       {loading ? (
//         <div className="text-blue-200 text-xl">Loading...</div>
//       ) : error ? (
//         <div className="text-red-400 text-xl">{error}</div>
//       ) : orders.length === 0 ? (
//         <div className="text-blue-200 text-xl">No past orders found.</div>
//       ) : (
//         <div className="w-full max-w-2xl space-y-6">
//           {paginatedOrders.map((order) => (
//             <div
//               key={order._id}
//               className="bg-blue-900 bg-opacity-70 rounded-xl p-6 border-2 border-blue-700 shadow-lg"
//             >
//               <div className="flex justify-between items-center mb-2">
//                 <span className="text-blue-200">
//                   {new Date(order.createdAt).toLocaleString()}
//                 </span>
//               </div>
//               <div className="mb-2 text-blue-200">
//                 Supplier: {order.supplierId?.name || "Unknown"}
//               </div>
//               <div className="mb-2 text-blue-200">
//                 Delivery Address: {order.deliveryAddress}
//               </div>
//               <div className="mb-2 text-blue-200">
//                 Total Amount: ₹{order.totalAmount}
//               </div>
//               <div className="mb-2 text-blue-200">
//                 Status: {order.status || "Placed"}
//               </div>

//               <div className="mt-2">
//                 <span className="font-semibold text-blue-100">Items:</span>
//                 <ul className="space-y-3 mt-2">
//                   {order.items.map((item, idx) => (
//                     <li
//                       key={idx}
//                       className="flex items-center gap-4 bg-blue-800 p-3 rounded-lg"
//                     >
//                       <img
//                         src={
//                           item.image || item.productId?.image || "/placeholder.png"
//                         }
//                         alt={item.productId?.name || "Product"}
//                         className="w-16 h-16 object-cover rounded-md border border-blue-400"
//                       />
//                       <div className="text-blue-200">
//                         <div className="font-bold">
//                           {item.productId?.name || "Unknown Product"}
//                         </div>
//                         <div className="text-sm">
//                           Qty: {item.quantity} @ ₹{item.price}
//                         </div>
//                       </div>
//                     </li>
//                   ))}
//                 </ul>
//               </div>

//               <div className="flex flex-wrap gap-4 mt-4">
//                 <button
//                   className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-full font-bold shadow"
//                   onClick={() => handleOrderAgain(order)}
//                 >
//                   Order Again
//                 </button>
//                 {order.status?.toLowerCase() === "ready_for_pickup" && (
//                   <button
//                     className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-full font-bold shadow"
//                     onClick={() => handlePayNow(order)}
//                   >
//                     Pay Now
//                   </button>
//                 )}
//                 {order.supplierId?.mobile || order.supplierId?.phone ? (
//                   <a
//                     href={`tel:${order.supplierId.mobile || order.supplierId.phone}`}
//                     className=" px-4 py-2 rounded-full font-bold shadow flex items-center"
//                   >
//                     📞 Contact Supplier
//                   </a>
//                 ) : (
//                   <button
//                     className="bg-gray-400 text-white px-4 py-2 rounded-full font-bold shadow cursor-not-allowed"
//                     disabled
//                   >
//                     No Contact Available
//                   </button>
//                 )}
//               </div>
//             </div>
//           ))}

//           {/* Pagination */}
//           {totalPages > 1 && (
//             <div className="flex justify-center mt-6 gap-2">
//               <button
//                 onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
//                 disabled={currentPage === 1}
//                 className="px-3 py-1 bg-blue-700 text-white rounded"
//               >
//                 Prev
//               </button>
//               {Array.from({ length: totalPages }, (_, idx) => (
//                 <button
//                   key={idx + 1}
//                   onClick={() => setCurrentPage(idx + 1)}
//                   className={`px-3 py-1 rounded ${
//                     currentPage === idx + 1
//                       ? "bg-pink-600"
//                       : "bg-blue-200 text-blue-800"
//                   }`}
//                 >
//                   {idx + 1}
//                 </button>
//               ))}
//               <button
//                 onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
//                 disabled={currentPage === totalPages}
//                 className="px-3 py-1 bg-blue-700 text-white rounded"
//               >
//                 Next
//               </button>
//             </div>
//           )}
//         </div>
//       )}
//     </div>
//   );
// };

// export default PastOrders;
import React, { useEffect, useState, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import apiService from "../services/api";

// Get API Base URL from .env (supports Vite and CRA)
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ;

// Load Razorpay script dynamically
function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve();
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = resolve;
    document.body.appendChild(script);
  });
}

// Convert orders to CSV
function ordersToCSV(orders) {
  if (!orders || orders.length === 0) return "";
  const header = [
    "Order ID",
    "Date",
    "Supplier",
    "Delivery Address",
    "Total Amount",
    "Status",
    "Items",
  ];
  const rows = orders.map((order) => {
    const items = order.items
      .map((item) => {
        const name = item.productId?.name || "Product";
        return `${name} (Qty: ${item.quantity} @ ₹${item.price})`;
      })
      .join("; ");
    return [
      order._id,
      new Date(order.createdAt).toLocaleString(),
      order.supplierId?.name || "Unknown",
      order.deliveryAddress,
      order.totalAmount,
      order.status || "Placed",
      items,
    ]
      .map((field) => `"${String(field).replace(/"/g, '""')}"`)
      .join(",");
  });
  return [header.join(","), ...rows].join("\r\n");
}

const PastOrders = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [user, setUser] = useState(null);
  const [checkedUser, setCheckedUser] = useState(false);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const totalPages = Math.ceil(orders.length / itemsPerPage);
  const paginatedOrders = orders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Handle "Pay Now"
  const handlePayNow = async (order) => {
    if (!user || !user._id) {
      alert("User not loaded. Please refresh and try again.");
      return;
    }
    try {
      await loadRazorpayScript();
      const options = {
        key: "rzp_test_sr1UaCzPtw1nDc", // Replace with LIVE key for production
        amount: Math.round(order.totalAmount * 100),
        currency: "INR",
        name: "Tutedude Order Payment",
        description: `Payment for Order #${order._id}`,
        handler: async () => {
          // Update order status via API
          await apiService.supplier.updateOrderStatus(order._id, "paid");
          alert("Payment successful! Order marked as paid.");
          const data = await apiService.vendor.getVendorOrders(user._id);
          setOrders(data);
        },
        prefill: {
          name: user?.name || "",
          email: user?.email || "",
        },
        theme: { color: "#6366f1" },
        modal: {
          ondismiss: () => {
            alert("Payment cancelled. Order remains pending.");
          },
        },
      };
      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", () => {
        alert("Payment failed. Try again.");
      });
      rzp.open();
    } catch (err) {
      alert("Error opening payment window: " + (err.message || err));
    }
  };

  // Load user from localStorage or route state
  useEffect(() => {
    let foundUser = null;
    try {
      const stored = localStorage.getItem("user");
      foundUser = location.state?.user || (stored ? JSON.parse(stored) : null);
      if (foundUser && !foundUser._id && foundUser.id) {
        foundUser._id = foundUser.id;
      }
    } catch {}
    setUser(foundUser);
    setCheckedUser(true);
  }, [location.state]);

  // Fetch vendor orders from API
  useEffect(() => {
    if (!user || !user._id) return;

    const fetchOrders = async () => {
      try {
        setLoading(true);
        const data = await apiService.vendor.getVendorOrders(user._id);
        setOrders(data);
      } catch (err) {
        console.error("Error fetching orders:", err);
        setError("Failed to fetch orders.");
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [user]);

  // Export CSV file
  const handleExportCSV = () => {
    const csv = ordersToCSV(orders);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "past_orders.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Reorder previous order
  const handleOrderAgain = useCallback((order) => {
    const cart = order.items.map((item) => ({
      ...item.productId,
      quantity: item.quantity,
      price: item.price,
      image: item.image || item.productId?.image || "",
      supplierId: order.supplierId?._id || order.supplierId,
    }));
    localStorage.setItem("vendorCart", JSON.stringify(cart));
    window.location.href = "/place-order?orderAgain=1";
  }, []);

  if (checkedUser && (!user || !user._id)) {
    return (
      <div className="text-red-500 text-xl p-8">
        User not found. Please log in to view your past orders.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex flex-col items-center p-8">
      <div className="min-w-6xl flex flex-col gap-4 mb-8">
        <div className="flex justify-between items-center">
          <button
            className="bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded-full font-bold shadow text-white"
            onClick={() => navigate("/vendor", { state: { user } })}
          >
            Go Back to Dashboard
          </button>
          {orders.length > 0 && (
            <button
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-full font-bold shadow"
              onClick={handleExportCSV}
            >
              Export as CSV
            </button>
          )}
        </div>
        <h2 className="text-3xl font-bold text-blue-100">Your Past Orders</h2>
      </div>

      {loading ? (
        <div className="text-blue-200 text-xl">Loading...</div>
      ) : error ? (
        <div className="text-red-400 text-xl">{error}</div>
      ) : orders.length === 0 ? (
        <div className="text-blue-200 text-xl">No past orders found.</div>
      ) : (
        <div className="w-full max-w-2xl space-y-6">
          {paginatedOrders.map((order) => (
            <div
              key={order._id}
              className="bg-blue-900 bg-opacity-70 rounded-xl p-6 border-2 border-blue-700 shadow-lg"
            >
              <div className="flex justify-between items-center mb-2">
                <span className="text-blue-200">
                  {new Date(order.createdAt).toLocaleString()}
                </span>
              </div>
              <div className="mb-2 text-blue-200">
                Supplier: {order.supplierId?.name || "Unknown"}
              </div>
              <div className="mb-2 text-blue-200">
                Delivery Address: {order.deliveryAddress}
              </div>
              <div className="mb-2 text-blue-200">
                Total Amount: ₹{order.totalAmount}
              </div>
              <div className="mb-2 text-blue-200">
                Status: {order.status || "Placed"}
              </div>

              {/* Items */}
              <div className="mt-2">
                <span className="font-semibold text-blue-100">Items:</span>
                <ul className="space-y-3 mt-2">
                  {order.items.map((item, idx) => (
                    <li
                      key={idx}
                      className="flex items-center gap-4 bg-blue-800 p-3 rounded-lg"
                    >
                      <img
                        src={
                          item.image || item.productId?.image || "/placeholder.png"
                        }
                        alt={item.productId?.name || "Product"}
                        className="w-16 h-16 object-cover rounded-md border border-blue-400"
                      />
                      <div className="text-blue-200">
                        <div className="font-bold">
                          {item.productId?.name || "Unknown Product"}
                        </div>
                        <div className="text-sm">
                          Qty: {item.quantity} @ ₹{item.price}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Buttons */}
              <div className="flex flex-wrap gap-4 mt-4">
                <button
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-full font-bold shadow"
                  onClick={() => handleOrderAgain(order)}
                >
                  Order Again
                </button>
                {order.status?.toLowerCase() === "ready_for_pickup" && (
                  <button
                    className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-full font-bold shadow"
                    onClick={() => handlePayNow(order)}
                  >
                    Pay Now
                  </button>
                )}
                {order.supplierId?.mobile || order.supplierId?.phone ? (
                  <a
                    href={`tel:${order.supplierId.mobile || order.supplierId.phone}`}
                    className="px-4 py-2 rounded-full font-bold shadow flex items-center"
                  >
                    📞 Contact Supplier
                  </a>
                ) : (
                  <button
                    className="bg-gray-400 text-white px-4 py-2 rounded-full font-bold shadow cursor-not-allowed"
                    disabled
                  >
                    No Contact Available
                  </button>
                )}
              </div>
            </div>
          ))}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-6 gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 bg-blue-700 text-white rounded"
              >
                Prev
              </button>
              {Array.from({ length: totalPages }, (_, idx) => (
                <button
                  key={idx + 1}
                  onClick={() => setCurrentPage(idx + 1)}
                  className={`px-3 py-1 rounded ${
                    currentPage === idx + 1
                      ? "bg-pink-600"
                      : "bg-blue-200 text-blue-800"
                  }`}
                >
                  {idx + 1}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 bg-blue-700 text-white rounded"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PastOrders;