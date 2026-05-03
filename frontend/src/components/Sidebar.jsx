import React from 'react';
import { Search, ShieldAlert, Navigation, Activity, Clock, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Sidebar = ({ safeMode, setSafeMode }) => {
  return (
    <div className="glass-panel h-full flex flex-col p-5 bg-white/60">
      
      {/* Title & Search */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Route Optimization</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search destination..." 
            className="w-full bg-white/80 border border-gray-200 rounded-xl py-2.5 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm"
          />
        </div>
      </div>

      {/* Safety Score Card */}
      <motion.div 
        layout
        className={`rounded-2xl p-4 mb-6 text-white transition-colors duration-500 shadow-md ${safeMode ? 'bg-gradient-to-br from-success to-emerald-600' : 'bg-gradient-to-br from-gray-700 to-gray-900'}`}
      >
        <div className="flex justify-between items-start mb-4">
          <div>
            <p className="text-white/80 text-xs font-medium uppercase tracking-wider mb-1">Route Status</p>
            <h3 className="text-2xl font-bold">{safeMode ? 'High Safety' : 'Standard'}</h3>
          </div>
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
            <ShieldAlert className="w-5 h-5 text-white" />
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="bg-black/10 rounded-lg p-2 flex items-center gap-2">
            <Clock className="w-4 h-4 text-white/70" />
            <span>{safeMode ? '24 mins' : '18 mins'}</span>
          </div>
          <div className="bg-black/10 rounded-lg p-2 flex items-center gap-2">
            <Activity className="w-4 h-4 text-white/70" />
            <span>{safeMode ? 'Risk: Low' : 'Risk: Med'}</span>
          </div>
        </div>
      </motion.div>

      {/* Factors List */}
      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Live Factors</h3>
        
        <div className="flex flex-col gap-3">
          
          <FactorCard 
            icon={<Activity className="w-4 h-4 text-danger" />} 
            title="Crime Reports"
            desc="2 incidents reported recently"
            status="danger"
            active={!safeMode}
          />
          
          <FactorCard 
            icon={<Users className="w-4 h-4 text-primary" />} 
            title="Crowd Density"
            desc="Moderate crowd presence"
            status="info"
            active={true}
          />
          
          <FactorCard 
            icon={<ShieldAlert className="w-4 h-4 text-success" />} 
            title="Emergency Infrastructure"
            desc="Passing 2 Police Stations"
            status="success"
            active={safeMode}
          />

        </div>
      </div>

      {/* Emergency Button */}
      <div className="mt-4 pt-4 border-t border-gray-200/50">
        <button className="w-full bg-red-50 text-red-600 font-semibold py-3 rounded-xl border border-red-100 hover:bg-red-100 hover:border-red-200 transition-colors flex items-center justify-center gap-2">
          <ShieldAlert className="w-5 h-5" />
          Emergency / SOS
        </button>
      </div>

    </div>
  );
};

const FactorCard = ({ icon, title, desc, status, active }) => {
  return (
    <div className={`p-3 rounded-xl border transition-all ${active ? 'bg-white border-primary/20 shadow-sm' : 'bg-white/40 border-gray-100 opacity-60 grayscale'}`}>
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 p-1.5 rounded-lg ${status === 'danger' ? 'bg-red-50' : status === 'success' ? 'bg-green-50' : 'bg-blue-50'}`}>
          {icon}
        </div>
        <div>
          <h4 className="text-sm font-semibold text-gray-800">{title}</h4>
          <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
