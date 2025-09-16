// components/Navbar.js
import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const user = localStorage.getItem("user");

  const navItems = user
    ? [
        { name: "Home", path: "/", icon: "🏠" },
        { name: "Create Poll", path: "/create-poll", icon: "➕" },
      ]
    : [
        { name: "Home", path: "/", icon: "🏠" },
        { name: "Create Poll", path: "/create-poll", icon: "➕" },
        { name: "Register", path: "/register", icon: "👤" },
        { name: "Login", path: "/login", icon: "🚪" },
      ];

  const isActive = (path) => location.pathname === path;

  return (
    <>
      {/* Desktop Navbar */}
      <nav className="hidden md:flex fixed top-0 w-full bg-white shadow-sm z-50">
        <div className="max-w-7xl mx-auto px-4 w-full">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">P</span>
              </div>
              <span className="text-xl font-bold text-gray-800">PollApp</span>
            </Link>

            {/* Nav Links */}
            <div className="flex space-x-4">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    isActive(item.path)
                      ? "text-blue-600 bg-blue-50"
                      : "text-gray-600 hover:text-blue-600 hover:bg-gray-50"
                  }`}
                >
                  <span className="mr-2">{item.icon}</span>
                  {item.name}
                </Link>
              ))}
              {user && (
                <button
                  onClick={() => {
                    localStorage.removeItem("user");
                    navigate("/login");
                  }}
                  className="px-4 py-1 text-white font-semibold text-md rounded-md bg-red-400 hover:bg-red-700 cursor-pointer"
                >
                  LogOut
                </button>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden p-2 rounded-lg text-gray-600"
            >
              {isOpen ? "✕" : "☰"}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown */}
        {isOpen && (
          <div className="md:hidden absolute top-16 w-full bg-white shadow-lg">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={`flex items-center px-4 py-3 hover:bg-gray-50 ${
                  isActive(item.path)
                    ? "text-blue-600 bg-blue-50"
                    : "text-gray-600"
                }`}
              >
                <span className="mr-3">{item.icon}</span>
                <div>
                  <div className="font-medium">{item.name}</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </nav>

      {/* Mobile Bottom Navbar */}
      <nav className="md:hidden fixed bottom-0 w-full bg-white border-t z-50">
        <div className="flex justify-around py-2 items-center">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center p-2 rounded-lg min-w-[64px] ${
                isActive(item.path) ? "text-blue-600" : "text-gray-500"
              }`}
            >
              <div
                className={`p-2 rounded-full ${
                  isActive(item.path) ? "bg-blue-100" : ""
                }`}
              >
                <span className="text-xl">{item.icon}</span>
              </div>
              <span className="text-xs font-medium mt-1">{item.name}</span>
            </Link>
          ))}
          {user && (
            <button
              onClick={() => {
                localStorage.removeItem("user");
                navigate("/login");
              }}
              className="p-2 text-white font-semibold text-md rounded-md bg-red-400 hover:bg-red-700 cursor-pointer"
            >
              LogOut
            </button>
          )}
        </div>
      </nav>
    </>
  );
};

export default Navbar;
