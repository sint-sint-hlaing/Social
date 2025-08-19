import React from "react";
import { SignIn } from "@clerk/clerk-react";
import { BookOpen, Users, Lightbulb, Calendar } from "lucide-react";
import Logo from "../components/Logo";

const Login = () => {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-yellow-50 via-orange-50 to-pink-50">
      <div className=" flex flex-col md:flex-row">
        {/* Background Image */}
        {/* <img src={assets.bgImage} alt="" className="absolute top-0 left-0 -z-1 w-full h-full object-cover" /> */}
        {/* Left side : Branding */}
        <div className="flex-1 flex flex-col items-start justify-between p-6 md:p-10 lg:pl-32 ">
          {/* Logo */}
          <Logo />

          {/* Hero Section */}
          <div className="mt-10">
            <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 leading-tight">
              Share Knowledge, <br />
              <span className="bg-gradient-to-r from-yellow-400 via-orange-500 to-pink-500 text-transparent bg-clip-text">
                Build Connections
              </span>
            </h1>
            <p className="mt-4 text-lg md:text-xl text-gray-700 max-w-xl">
              Connect with classmates, exchange insights, and build lasting
              friendships on campus.
            </p>

            {/* Features Grid */}
            <div className="grid grid-cols-2 gap-6 mt-8">
              <div className="flex items-center gap-3 bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition">
                <Lightbulb className="w-6 h-6 text-yellow-500" />
                <p className="text-sm font-medium text-gray-800">Share Ideas</p>
              </div>
              <div className="flex items-center gap-3 bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition">
                <Users className="w-6 h-6 text-pink-500" />
                <p className="text-sm font-medium text-gray-800">
                  Find Classmates
                </p>
              </div>
              <div className="flex items-center gap-3 bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition">
                <BookOpen className="w-6 h-6 text-orange-500" />
                <p className="text-sm font-medium text-gray-800">
                  Study Groups
                </p>
              </div>
              <div className="flex items-center gap-3 bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition">
                <Calendar className="w-6 h-6 text-rose-500" />
                <p className="text-sm font-medium text-gray-800">
                  Campus Events
                </p>
              </div>
            </div>
          </div>

          <span className="md:h-10"></span>
        </div>

        {/* Right side : Login Form */}
        <div className="flex-1 flex items-center justify-center p-6 sm:p-10 ">
          <SignIn />
        </div>
      </div>
      {/* Footer */}
      <footer className=" text-center text-xs text-gray-500 ">
        © {new Date().getFullYear()} Knowledge Hive. All rights reserved.
      </footer>
    </div>
  );
};

export default Login;
