import React from "react";
import { NavLink } from "react-router-dom";
import { menuItemsData } from "../assets/assets";

const MenuItems = ({ setSidebarOpen }) => {
  return (
    <div className="px-6 text-gray-600 space-y-1 font-medium ">
      {menuItemsData.map(({ to, label, Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === "/"}
          className={({ isActive }) =>
            `px-3.5 py-2 flex items-center gap-3 rounded-xl ${
              isActive ? "bg-orange-100 text-orange-500" : "hover:bg-orange-100"
            }`
          }
          onClick={() => setSidebarOpen(false)}
        >
          <Icon />
          {label}
        </NavLink>
      ))}
    </div>
  );
};

export default MenuItems;
