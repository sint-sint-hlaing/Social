import React from "react";
import { assets } from "../assets/assets";
import { Link, useNavigate } from "react-router-dom";
import MenuItems from "./MenuItems";
import { CirclePlus, LogOut } from "lucide-react";
import { UserButton, useClerk } from "@clerk/clerk-react";
import { useSelector } from "react-redux";
import Logo from "./Logo";

const Sidebar = ({ sidebarOpen, setSidebarOpen }) => {
  const user = useSelector((state) => state.user.value);
  const { signOut } = useClerk();
  const navigate = useNavigate();

  return (
    <div
      className={`
    w-60 xl:w-72 bg-white border-r border-gray-200 flex flex-col justify-between
    fixed sm:static top-0 bottom-0 left-0 z-50
    transform ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} 
    sm:translate-x-0
    transition-transform duration-300 ease-in-out
  `}
    >
      {/* Top Section */}
      <div className="w-full">
        <div className="flex items-center justify-center p-3">
          <Logo />
        </div>
        <hr className="border-gray-300 mb-8" />
        <MenuItems setSidebarOpen={setSidebarOpen} />
        <Link
          to="/create-post"
          className="flex items-center justify-center gap-2 py-2.5 mt-6 mx-6 rounded-lg bg-orange-500 hover:bg-orange-600 active:scale-95 transition text-white cursor-pointer"
        >
          <CirclePlus className="w-5 h-5" />
          Create Post
        </Link>
        
      </div>

      {/* Bottom Section */}
      <div className="w-full border-t border-gray-200 p-4 px-7 flex items-center justify-between">
        <div className="flex gap-2 items-center cursor-pointer">
          <UserButton />
          <div>
            <h1 className="text-sm font-medium">{user?.full_name}</h1>
            <p className="text-xs text-gray-500">@{user?.username}</p>
          </div>
        </div>
        <LogOut
          onClick={signOut}
          className="w-[18px] text-gray-400 hover:text-gray-700 transition cursor-pointer"
        />
      </div>
    </div>
  );
};

export default Sidebar;
