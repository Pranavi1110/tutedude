// api.js

const API_BASE_URL = import.meta.env.VITE_API_URL;

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
    async getProducts() {
      return apiRequest("/api/vendor/products");
    },
    async getAllProducts() {
      return apiRequest("/api/vendor/all-products");
    },
    async getRecommendedProducts(vendorId) {
      console.log("Fetching recommendations for vendor:", vendorId);
      const data = await apiRequest(`/api/vendor/recommendations/${vendorId}`);
      if (!data || data.length === 0) {
        console.warn("No personalized recommendations, falling back to popular products.");
        const trending = await this.getTrendingProducts();
        return trending.slice(0, 5);
      }
      return data;
    },
    async getOrderStats(vendorId) {
      return apiRequest(`/api/vendor/order-stats/${vendorId}`);
    },
    async getTrendingProducts() {
      const data = await apiRequest(`/api/vendor/trending-products`);
      if (!data || data.length === 0) {
        console.warn("No trending products found, falling back to top available products.");
        const all = await this.getProducts();
        return all.slice(0, 5);
      }
      return data;
    },
    async placeOrder(orderData) {
      return apiRequest("/api/vendor/orders", {
        method: "POST",
        body: JSON.stringify(orderData),
      });
    },
    async getVendorOrders(vendorId) {
      return apiRequest(`/api/vendor/my-orders/${vendorId}`);
    },
    async getOrderDetails(orderId) {
      return apiRequest(`/api/vendor/orders/${orderId}/details`);
    },
  },

  supplier: {
    async getSupplierProducts(supplierId) {
      return apiRequest(`/api/supplier/my-products/${supplierId}`);
    },
    async addProduct(productData) {
      return apiRequest("/api/supplier/products", {
        method: "POST",
        body: JSON.stringify(productData),
      });
    },
    async updateProduct(productId, productData) {
      return apiRequest(`/api/supplier/products/${productId}`, {
        method: "PUT",
        body: JSON.stringify(productData),
      });
    },
    async deleteProduct(productId) {
      return apiRequest(`/api/supplier/products/${productId}`, {
        method: "DELETE",
      });
    },
    async getSupplierOrders(supplierId) {
      return apiRequest(`/api/supplier/my-orders/${supplierId}`);
    },
    async updateOrderStatus(orderId, status) {
      return apiRequest(`/api/supplier/orders/${orderId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
    },
    async getOrderDetails(orderId) {
      return apiRequest(`/api/supplier/orders/${orderId}/details`);
    },
  },

  delivery: {
    async getAvailableDeliveries(lat, lng, radius) {
      let query = "";
      if (lat && lng) {
        query = `?lat=${encodeURIComponent(lat)}&lng=${encodeURIComponent(lng)}`;
        if (radius) query += `&radius=${encodeURIComponent(radius)}`;
      }
      return apiRequest(`/api/delivery/available${query}`);
    },
    async acceptDelivery(orderId, deliveryAgentId) {
      return apiRequest(`/api/delivery/accept/${orderId}`, {
        method: "POST",
        body: JSON.stringify({ deliveryAgentId }),
      });
    },
    async getAgentDeliveries(deliveryAgentId) {
      return apiRequest(`/api/delivery/agent/${deliveryAgentId}`);
    },
    async updateDeliveryStatus(deliveryId, statusData) {
      return apiRequest(`/api/delivery/delivery/${deliveryId}/status`, {
        method: "PATCH",
        body: JSON.stringify(statusData),
      });
    },
    async getDeliveryDetails(deliveryId) {
      return apiRequest(`/api/delivery/delivery/${deliveryId}/details`);
    },
  },

  async healthCheck() {
    return apiRequest("/api/health");
  },
};

export default apiService;
