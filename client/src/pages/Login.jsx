import React from "react";
import { SignIn } from "@clerk/clerk-react";
import { BookOpen, Users, Lightbulb, Calendar } from "lucide-react";
import Logo from "../components/Logo";
import { assets } from "../assets/assets";

const Login = () => {
  return (
   <div className="flex flex-col min-h-screen relative justify-between">
        {/* Background Image */}
    <img
      src={assets.bgImage}
      alt="Background"
      className="absolute top-0 left-0 -z-10 w-full h-full object-cover"
    />
  <div className="bg-white/30 backdrop-blur-xs flex flex-col md:flex-row relative flex-1">

    {/* Dark overlay */}
    {/* <div className="absolute top-0 left-0 -z-5 w-full h-full bg-black/40" /> */}
    

    {/* Left side : Branding */}
    <div className=" flex-1 flex flex-col items-start justify-between p-6 md:p-10 lg:pl-32 relative z-10">
      {/* Logo */}
      <Logo />

      {/* Hero Section */}
      <div className="mt-10">
        <h1 className="text-4xl md:text-6xl font-extrabold  leading-tight text-[#212121]">
          Share Knowledge, <br />
          <span className="bg-gradient-to-r from-yellow-400 via-orange-600 to-pink-500 text-transparent bg-clip-text"> 
            Build Connections
          </span>
        
        </h1>
          <span className=" text-2xl font-bold text-gray-100 drop-shadow-md">
            within Computer Students' Hub 
          </span>
        <p className="mt-4 text-lg md:text-xl text-gray-200 drop-shadow">
          Connect with classmates, exchange insights, and build lasting
          friendships on campus.
        </p>
        {/* Features Grid */}
        {/* <div className="grid grid-cols-2 gap-6 mt-8">
          <div className="flex items-center gap-3 bg-white/80 p-4 rounded-xl  transition">
            <Lightbulb className="w-6 h-6 text-yellow-500" />
            <p className="text-sm font-medium text-gray-800">Share Ideas</p>
          </div>
          <div className="flex items-center gap-3 bg-white/80 p-4 rounded-xl  transition">
            <Users className="w-6 h-6 text-pink-500" />
            <p className="text-sm font-medium text-gray-800">
              Find Classmates
            </p>
          </div>
          <div className="flex items-center gap-3 bg-white/80 p-4 rounded-xl  transition">
            <BookOpen className="w-6 h-6 text-orange-500" />
            <p className="text-sm font-medium text-gray-800">
              Study Groups
            </p>
          </div>
          <div className="flex items-center gap-3 bg-white/80 p-4 rounded-xl  transition">
            <Calendar className="w-6 h-6 text-rose-500" />
            <p className="text-sm font-medium text-gray-800">
              Campus Events
            </p>
          </div>
        </div> */}
      </div>

      <span className="md:h-10"></span>
    </div>

    {/* Right side : Login Form */}
    <div className="flex-1 flex items-center justify-center p-6 sm:p-10 relative z-10">
      <SignIn />
    </div>
  </div>

  {/* Footer */}
  <footer className=" bg-white text-center text-xs text-gray-500 relative z-10">
    © {new Date().getFullYear()} Knowledge Hive. All rights reserved.
  </footer>
</div>

  );
};

export default Login;
