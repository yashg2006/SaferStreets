import React from 'react';
import { Bell, User, MapPin } from 'lucide-react';

const Header = () => {
  return (
    <header className="h-20 flex items-center justify-between px-8 bg-black/20 backdrop-blur-xl border-b border-white/10 shadow-sm z-20">
      
      {/* Logo */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
          <MapPin className="w-6 h-6 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight font-outfit">SafeRoute</h1>
      </div>

      {/* Navigation Links */}
      <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-white/70">
        <a href="#" className="text-white bg-white/10 px-4 py-2 rounded-xl transition-all duration-300 shadow-sm">Dashboard</a>
        <a href="#" className="hover:text-white transition-colors duration-300 hover:scale-105 transform">Routes</a>
        <a href="#" className="hover:text-white transition-colors duration-300 hover:scale-105 transform">Reports</a>
        <a href="#" className="hover:text-white transition-colors duration-300 hover:scale-105 transform">Community</a>
      </nav>

      {/* Right Actions */}
      <div className="flex items-center gap-5">
        <button className="relative p-2.5 text-white/70 hover:text-white transition-colors rounded-full hover:bg-white/10">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[#1c1938]"></span>
        </button>
        
        <div className="flex items-center gap-3 pl-5 border-l border-white/10">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-gray-700 to-gray-500 border-2 border-white/20 shadow-md overflow-hidden flex items-center justify-center">
            <User className="w-5 h-5 text-white" />
          </div>
          <span className="text-sm font-medium text-white hidden sm:block">Jane Doe</span>
        </div>
      </div>

    </header>
  );
};

export default Header;
