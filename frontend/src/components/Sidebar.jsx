import React from 'react';
import { Search, ShieldAlert, Navigation, Activity, Clock, Users, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Sidebar = ({ safeMode, setSafeMode }) => {
  return (
    <div className="glass-panel h-full flex flex-col p-6 w-96 relative overflow-hidden">
      
      {/* Decorative Glow */}
      <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
      
      {/* Title & Search */}
      <div className="mb-8 relative z-10">
        <h2 className="text-2xl font-bold text-white mb-5 font-outfit tracking-wide">Optimization</h2>
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50 group-focus-within:text-indigo-400 transition-colors" />
          <input 
            type="text" 
            placeholder="Search destination..." 
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:bg-white/10 transition-all text-sm shadow-inner"
          />
        </div>
      </div>

      {/* Safety Score Card */}
      <motion.div 
        layout
        className={`relative overflow-hidden rounded-3xl p-5 mb-8 text-white transition-all duration-500 shadow-xl border border-white/10 ${safeMode ? 'bg-gradient-to-br from-emerald-500 to-teal-700 shadow-emerald-500/20' : 'bg-gradient-to-br from-[#2a2d3e] to-[#1f212e]'}`}
      >
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
        
        <div className="flex justify-between items-start mb-5 relative z-10">
          <div>
            <p className="text-white/70 text-xs font-semibold uppercase tracking-widest mb-1.5">Route Status</p>
            <h3 className="text-3xl font-bold font-outfit tracking-tight">{safeMode ? 'Maximum Safety' : 'Standard Fast'}</h3>
          </div>
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center backdrop-blur-md shadow-inner ${safeMode ? 'bg-white/20 border border-white/30' : 'bg-white/5 border border-white/10'}`}>
            <ShieldAlert className={`w-6 h-6 ${safeMode ? 'text-white' : 'text-indigo-400'}`} />
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-3 text-sm relative z-10">
          <div className="bg-black/20 rounded-xl p-3 flex items-center gap-3 backdrop-blur-sm border border-white/5">
            <Clock className={`w-4 h-4 ${safeMode ? 'text-emerald-200' : 'text-indigo-300'}`} />
            <span className="font-medium">{safeMode ? '24 mins' : '18 mins'}</span>
          </div>
          <div className="bg-black/20 rounded-xl p-3 flex items-center gap-3 backdrop-blur-sm border border-white/5">
            <Activity className={`w-4 h-4 ${safeMode ? 'text-emerald-200' : 'text-indigo-300'}`} />
            <span className="font-medium">{safeMode ? 'Risk: Low' : 'Risk: Med'}</span>
          </div>
        </div>
      </motion.div>

      {/* Factors List */}
      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar relative z-10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-bold text-white/50 uppercase tracking-widest">Live Factors</h3>
          <span className="text-[10px] font-bold bg-white/10 text-white/70 px-2 py-1 rounded-md">LIVE</span>
        </div>
        
        <div className="flex flex-col gap-3">
          
          <FactorCard 
            icon={<Activity className="w-4 h-4 text-rose-400" />} 
            title="Crime Reports"
            desc="2 incidents reported recently"
            status="danger"
            active={!safeMode}
          />
          
          <FactorCard 
            icon={<Users className="w-4 h-4 text-indigo-400" />} 
            title="Crowd Density"
            desc="Moderate crowd presence"
            status="info"
            active={true}
          />
          
          <FactorCard 
            icon={<ShieldAlert className="w-4 h-4 text-emerald-400" />} 
            title="Emergency Access"
            desc="Passing 2 Police Stations"
            status="success"
            active={safeMode}
          />

        </div>
      </div>

      {/* Emergency Button */}
      <div className="mt-6 pt-6 border-t border-white/10 relative z-10">
        <button className="w-full bg-gradient-to-r from-rose-500 to-red-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-rose-500/20 hover:shadow-rose-500/40 hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-2 group active:scale-95">
          <ShieldAlert className="w-5 h-5 group-hover:animate-pulse" />
          <span className="tracking-wide">Emergency SOS</span>
        </button>
      </div>

    </div>
  );
};

const FactorCard = ({ icon, title, desc, status, active }) => {
  return (
    <div className={`p-4 rounded-2xl border transition-all duration-300 cursor-pointer ${active ? 'bg-white/10 border-white/20 shadow-lg hover:bg-white/15 hover:-translate-y-0.5' : 'bg-white/5 border-white/5 opacity-50 grayscale hover:grayscale-0 hover:opacity-100'}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={`p-2.5 rounded-xl shadow-inner ${status === 'danger' ? 'bg-rose-500/20 border border-rose-500/30' : status === 'success' ? 'bg-emerald-500/20 border border-emerald-500/30' : 'bg-indigo-500/20 border border-indigo-500/30'}`}>
            {icon}
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white tracking-wide">{title}</h4>
            <p className="text-xs text-white/50 mt-1 font-medium">{desc}</p>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-white/20" />
      </div>
    </div>
  );
};

export default Sidebar;
