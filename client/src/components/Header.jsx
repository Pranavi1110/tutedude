import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import LanguageSwitcher from "./LanguageSwitcher";

const Header = () => {
  const navigate = useNavigate();
  const [loggedIn, setLoggedIn] = useState(true);

  useEffect(() => {
    setLoggedIn(!!localStorage.getItem("loggedIn"));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("loggedIn");
    setLoggedIn(false);
    navigate("/");
  };

  return (
    <nav className="flex justify-between items-center mb-4 p-4 bg-white shadow">
      <Link to="/" className="text-xl font-bold text-blue-700">
        RasaChain
      </Link>
      <LanguageSwitcher />
      {loggedIn && (
        <button
          className="bg-red-500 px-4 py-2 rounded font-semibold hover:bg-red-600 ml-4"
          onClick={handleLogout}
        >
          Logout
        </button>
      )}
    </nav>
  );
};

export default Header;
