import React from 'react';
import { X, Search, ShieldAlert, Navigation, Activity, Clock, Users, ChevronRight, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';

const Sidebar = ({ safeMode, setSafeMode, onClose }) => {
  return (
    <div className="glass-panel h-full flex flex-col p-5 relative overflow-hidden rounded-none rounded-r-3xl">

      {/* Decorative top glow */}
      <div className="absolute top-0 left-0 w-full h-28 bg-gradient-to-b from-indigo-500/10 to-transparent pointer-events-none" />

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-6 relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <MapPin className="w-4 h-4 text-white" />
          </div>
          <h2 className="text-lg font-bold text-white font-outfit tracking-wide">SafeRoute</h2>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-all active:scale-90"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* ── Search ── */}
      <div className="relative group mb-6 z-10">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 group-focus-within:text-indigo-400 transition-colors" />
        <input
          type="text"
          placeholder="Search destination..."
          className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-10 pr-4 text-white text-sm placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:bg-white/8 transition-all"
        />
      </div>

      {/* ── Safety Score Card ── */}
      <motion.div
        layout
        className={`relative overflow-hidden rounded-2xl p-4 mb-6 border z-10 transition-all duration-500 ${safeMode
          ? 'bg-gradient-to-br from-emerald-500/20 to-teal-700/20 border-emerald-500/30 shadow-lg shadow-emerald-500/10'
          : 'bg-white/5 border-white/10'}`}
      >
        <div className="absolute top-0 right-0 -mt-3 -mr-3 w-20 h-20 bg-white/5 rounded-full blur-2xl" />

        <div className="flex justify-between items-start mb-4 relative z-10">
          <div>
            <p className="text-white/50 text-[10px] font-bold uppercase tracking-widest mb-1">Route Status</p>
            <h3 className="text-xl font-bold text-white font-outfit">
              {safeMode ? 'Maximum Safety' : 'Standard Fast'}
            </h3>
          </div>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${safeMode ? 'bg-emerald-500/20 border border-emerald-500/30' : 'bg-white/5 border border-white/10'}`}>
            <ShieldAlert className={`w-5 h-5 ${safeMode ? 'text-emerald-400' : 'text-indigo-400'}`} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 relative z-10">
          <div className="bg-black/20 rounded-xl p-2.5 flex items-center gap-2 border border-white/5">
            <Clock className={`w-4 h-4 ${safeMode ? 'text-emerald-300' : 'text-indigo-300'}`} />
            <span className="text-sm text-white font-medium">{safeMode ? '24 mins' : '18 mins'}</span>
          </div>
          <div className="bg-black/20 rounded-xl p-2.5 flex items-center gap-2 border border-white/5">
            <Activity className={`w-4 h-4 ${safeMode ? 'text-emerald-300' : 'text-amber-300'}`} />
            <span className="text-sm text-white font-medium">{safeMode ? 'Risk: Low' : 'Risk: Med'}</span>
          </div>
        </div>
      </motion.div>

      {/* ── Mode Toggle ── */}
      <div className="flex gap-2 mb-6 z-10">
        <button
          onClick={() => setSafeMode(false)}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 active:scale-95 ${!safeMode ? 'bg-blue-600 text-white' : 'bg-white/5 text-white/40 border border-white/10 hover:bg-white/10'}`}
        >
          ⚡ Fastest
        </button>
        <button
          onClick={() => setSafeMode(true)}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 active:scale-95 ${safeMode ? 'bg-emerald-600 text-white' : 'bg-white/5 text-white/40 border border-white/10 hover:bg-white/10'}`}
        >
          🛡️ Safest
        </button>
      </div>

      {/* ── Live Factors ── */}
      <div className="flex-1 overflow-y-auto custom-scrollbar relative z-10">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Live Factors</h3>
          <span className="text-[9px] font-bold bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30">LIVE</span>
        </div>

        <div className="flex flex-col gap-2">
          <FactorCard
            icon={<Activity className="w-4 h-4 text-rose-400" />}
            title="Crime Reports"
            desc="2 incidents reported nearby"
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
            desc="2 Police Stations on route"
            status="success"
            active={safeMode}
          />
          <FactorCard
            icon={<Clock className="w-4 h-4 text-amber-400" />}
            title="Street Lighting"
            desc="Good coverage detected"
            status="warning"
            active={safeMode}
          />
        </div>
      </div>

      {/* ── SOS button ── */}
      <div className="mt-4 pt-4 border-t border-white/8 z-10">
        <button className="w-full bg-gradient-to-r from-rose-500 to-red-600 text-white font-bold py-3.5 rounded-2xl shadow-lg shadow-rose-500/20 hover:shadow-rose-500/40 hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center gap-2 active:scale-95 text-sm">
          <ShieldAlert className="w-4 h-4" />
          Emergency SOS
        </button>
      </div>
    </div>
  );
};

const FactorCard = ({ icon, title, desc, status, active }) => {
  const borderColor = {
    danger: 'border-rose-500/25',
    success: 'border-emerald-500/25',
    info: 'border-indigo-500/25',
    warning: 'border-amber-500/25',
  }[status] ?? 'border-white/10';

  const iconBg = {
    danger: 'bg-rose-500/15',
    success: 'bg-emerald-500/15',
    info: 'bg-indigo-500/15',
    warning: 'bg-amber-500/15',
  }[status] ?? 'bg-white/10';

  return (
    <div className={`p-3 rounded-xl border transition-all duration-300 ${active
      ? `bg-white/5 ${borderColor} hover:bg-white/8`
      : 'bg-white/3 border-white/5 opacity-40 grayscale hover:opacity-70 hover:grayscale-0'}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${iconBg}`}>{icon}</div>
          <div>
            <h4 className="text-xs font-semibold text-white">{title}</h4>
            <p className="text-[11px] text-white/40 mt-0.5">{desc}</p>
          </div>
        </div>
        <ChevronRight className="w-3.5 h-3.5 text-white/20 flex-shrink-0" />
      </div>
    </div>
  );
};

export default Sidebar;
