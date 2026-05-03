import React from 'react';
import { Bell, User, MapPin } from 'lucide-react';

const Header = () => {
  return (
    <header className="h-16 flex items-center justify-between px-6 bg-white/40 backdrop-blur-md border-b border-white/60 shadow-sm z-20">
      
      {/* Logo */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center shadow-md">
          <MapPin className="w-5 h-5 text-white" />
        </div>
        <h1 className="text-xl font-bold text-gray-800 tracking-tight">SafeRoute</h1>
      </div>

      {/* Navigation Links */}
      <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-500">
        <a href="#" className="text-primary bg-primary/10 px-3 py-1.5 rounded-lg transition-colors">Dashboard</a>
        <a href="#" className="hover:text-gray-800 transition-colors">Routes</a>
        <a href="#" className="hover:text-gray-800 transition-colors">Reports</a>
        <a href="#" className="hover:text-gray-800 transition-colors">Community</a>
      </nav>

      {/* Right Actions */}
      <div className="flex items-center gap-4">
        <button className="relative p-2 text-gray-500 hover:text-gray-800 transition-colors rounded-full hover:bg-white/50">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-danger rounded-full border border-white"></span>
        </button>
        
        <div className="flex items-center gap-2 pl-4 border-l border-gray-200">
          <div className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white shadow-sm overflow-hidden flex items-center justify-center">
            <User className="w-4 h-4 text-gray-500" />
          </div>
          <span className="text-sm font-medium text-gray-700 hidden sm:block">Jane Doe</span>
        </div>
      </div>

    </header>
  );
};

export default Header;
