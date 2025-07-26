import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import VendorDashboard from "./pages/VendorDashboard";
import SupplierDashboard from "./pages/SupplierDashboard";
import DeliveryDashboard from "./pages/DeliveryDashboard";
import Login from "./pages/Login";
import Header from "./components/Header";
import "./i18n/i18n";

function App() {
  return (
    <Router>
      <div className="p-4">
        <Header />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/vendor" element={<VendorDashboard />} />
          <Route path="/supplier" element={<SupplierDashboard />} />
          <Route path="/delivery" element={<DeliveryDashboard />} />
          <Route path="/login" element={<Login />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
