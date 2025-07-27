const API_BASE_URL = "http://localhost:5002/api";

// Generic API request function
async function apiRequest(endpoint, options = {}) {
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
    console.error(`API Error [${endpoint}]:`, error);
    return []; // Always return safe fallback to prevent UI crashes
  }
}

const apiService = {
  vendor: {
    // Get all available products
    async getProducts() {
      return apiRequest("/vendor/products");
    },

    // Get all products (including unavailable & out of stock)
    async getAllProducts() {
      return apiRequest("/vendor/all-products");
    },

    // Get AI-powered personalized recommendations
    async getRecommendedProducts(vendorId) {
      console.log("Fetching recommendations for vendor:", vendorId);
      const data = await apiRequest(`/vendor/recommendations/${vendorId}`);
      // Fallback: If no recommendations, fetch some popular products
      if (!data || data.length === 0) {
        console.warn(
          "No personalized recommendations, falling back to popular products."
        );
        const trending = await this.getTrendingProducts();
        return trending.slice(0, 5);
      }
      return data;
    },

    // Get order stats for charting
    async getOrderStats(vendorId) {
      return apiRequest(`/vendor/order-stats/${vendorId}`);
    },

    // Get trending products (past 7 days demand)
    async getTrendingProducts() {
      const data = await apiRequest(`/vendor/trending-products`);
      // Fallback: If no trending, just fetch all products and pick top 5
      if (!data || data.length === 0) {
        console.warn(
          "No trending products found, falling back to top available products."
        );
        const all = await this.getProducts();
        return all.slice(0, 5);
      }
      return data;
    },

    // Place a new order
    async placeOrder(orderData) {
      return apiRequest("/vendor/orders", {
        method: "POST",
        body: JSON.stringify(orderData),
      });
    },

    // Get all orders for vendor
    async getVendorOrders(vendorId) {
      return apiRequest(`/vendor/my-orders/${vendorId}`);
    },

    // Get order details
    async getOrderDetails(orderId) {
      return apiRequest(`/vendor/orders/${orderId}/details`);
    },
  },

  supplier: {
    async getSupplierProducts(supplierId) {
      return apiRequest(`/supplier/my-products/${supplierId}`);
    },
    async addProduct(productData) {
      return apiRequest("/supplier/products", {
        method: "POST",
        body: JSON.stringify(productData),
      });
    },
    async updateProduct(productId, productData) {
      return apiRequest(`/supplier/products/${productId}`, {
        method: "PUT",
        body: JSON.stringify(productData),
      });
    },
    async deleteProduct(productId) {
      return apiRequest(`/supplier/products/${productId}`, {
        method: "DELETE",
      });
    },
    async getSupplierOrders(supplierId) {
      return apiRequest(`/supplier/my-orders/${supplierId}`);
    },
    async updateOrderStatus(orderId, status) {
      return apiRequest(`/supplier/orders/${orderId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
    },
    async getOrderDetails(orderId) {
      return apiRequest(`/supplier/orders/${orderId}/details`);
    },
  },

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
      return apiRequest(`/delivery/available${query}`);
    },
    async acceptDelivery(orderId, deliveryAgentId) {
      return apiRequest(`/delivery/accept/${orderId}`, {
        method: "POST",
        body: JSON.stringify({ deliveryAgentId }),
      });
    },
    async getAgentDeliveries(deliveryAgentId) {
      return apiRequest(`/delivery/agent/${deliveryAgentId}`);
    },
    async updateDeliveryStatus(deliveryId, statusData) {
      return apiRequest(`/delivery/delivery/${deliveryId}/status`, {
        method: "PATCH",
        body: JSON.stringify(statusData),
      });
    },
    async getDeliveryDetails(deliveryId) {
      return apiRequest(`/delivery/delivery/${deliveryId}/details`);
    },
  },

  async healthCheck() {
    return apiRequest("/health");
  },
};

export default apiService;
