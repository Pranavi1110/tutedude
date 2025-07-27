const API_BASE_URL = "http://localhost:5002/api";

// API service for making HTTP requests
const apiService = {
  // Generic request method
  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "API request failed");
      }

      return data;
    } catch (error) {
      console.error("API Error:", error);
      throw error;
    }
  },

  // Vendor API methods
  vendor: {
    // Get all available products
    async getProducts() {
      return apiService.request("/vendor/products");
    },

    // Place a new order
    async placeOrder(orderData) {
      return apiService.request("/vendor/orders", {
        method: "POST",
        body: JSON.stringify(orderData),
      });
    },

    // Get vendor's orders
    async getVendorOrders(vendorId) {
      return apiService.request(`/vendor/my-orders/${vendorId}`);
    },

    // Get order details
    async getOrderDetails(orderId) {
      return apiService.request(`/vendor/orders/${orderId}/details`);
    },
  },

  // Supplier API methods
  supplier: {
    // Get supplier's products
    async getSupplierProducts(supplierId) {
      return apiService.request(`/supplier/my-products/${supplierId}`);
    },

    // Add new product
    async addProduct(productData) {
      return apiService.request("/supplier/products", {
        method: "POST",
        body: JSON.stringify(productData),
      });
    },

    // Update product
    async updateProduct(productId, productData) {
      return apiService.request(`/supplier/products/${productId}`, {
        method: "PUT",
        body: JSON.stringify(productData),
      });
    },

    // Delete product
    async deleteProduct(productId) {
      return apiService.request(`/supplier/products/${productId}`, {
        method: "DELETE",
      });
    },

    // Get supplier's orders
    async getSupplierOrders(supplierId) {
      return apiService.request(`/supplier/my-orders/${supplierId}`);
    },

    // Update order status
    async updateOrderStatus(orderId, status) {
      return apiService.request(`/supplier/orders/${orderId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
    },

    // Get order details
    async getOrderDetails(orderId) {
      return apiService.request(`/supplier/orders/${orderId}/details`);
    },
  },

  // Delivery API methods
  delivery: {
    // Get available deliveries, optionally filtered by lat/lng
    async getAvailableDeliveries(lat, lng, radius) {
      let query = "";
      if (lat && lng) {
        query = `?lat=${encodeURIComponent(lat)}&lng=${encodeURIComponent(
          lng
        )}`;
        if (radius) query += `&radius=${encodeURIComponent(radius)}`;
      }
      return apiService.request(`/delivery/available${query}`);
    },

    // Accept a delivery
    async acceptDelivery(orderId, deliveryAgentId) {
      return apiService.request(`/delivery/accept/${orderId}`, {
        method: "POST",
        body: JSON.stringify({ deliveryAgentId }),
      });
    },

    // Get delivery agent's deliveries
    async getAgentDeliveries(deliveryAgentId) {
      return apiService.request(`/delivery/agent/${deliveryAgentId}`);
    },

    // Update delivery status
    async updateDeliveryStatus(deliveryId, statusData) {
      return apiService.request(`/delivery/delivery/${deliveryId}/status`, {
        method: "PATCH",
        body: JSON.stringify(statusData),
      });
    },

    // Get delivery details
    async getDeliveryDetails(deliveryId) {
      return apiService.request(`/delivery/delivery/${deliveryId}/details`);
    },
  },

  // Health check
  async healthCheck() {
    return apiService.request("/health");
  },
};

export default apiService;
