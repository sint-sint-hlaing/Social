import React from "react";
import { NavLink } from "react-router-dom";
import { menuItemsData } from "../assets/assets";
import { useSelector } from "react-redux";

const MenuItems = ({ setSidebarOpen }) => {
  const user = useSelector((state) => state.user.value);

  return (
    <div className="px-6 text-gray-600 space-y-1 font-medium ">
      {menuItemsData.map(({ to, label, Icon }) => {
        // if it's profile, inject user id
        const path = to === "/profile" ? `/profile/${user?._id}` : to;

        return (
          <NavLink
            key={path}
            to={path}
            end={path === "/"}
            className={({ isActive }) =>
              `px-3.5 py-2 flex items-center gap-3 rounded-xl ${
                isActive
                  ? "bg-cyan-50 text-cyan-600"
                  : "hover:bg-cyan-50"
              }`
            }
            onClick={() => setSidebarOpen(false)}
          >
            <Icon />
            {label}
          </NavLink>
        );
      })}
    </div>
  );
};

export default MenuItems;
