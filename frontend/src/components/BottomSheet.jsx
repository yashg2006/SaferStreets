import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Navigation, ShieldAlert, Activity, Users, Clock, ChevronUp, ChevronDown } from 'lucide-react';

const BottomSheet = ({ safeMode, setSafeMode }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      initial={{ y: 120, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', damping: 28, stiffness: 280, delay: 2.4 }}
      className="absolute bottom-0 left-0 right-0 z-20 pointer-events-none"
    >
      <div className="pointer-events-auto mx-auto max-w-xl px-3 pb-4">
        <div className="bg-[#0d1117]/96 backdrop-blur-3xl rounded-3xl border border-white/10 shadow-2xl overflow-hidden">

          {/* Drag handle / expand toggle */}
          <button
            onClick={() => setExpanded(v => !v)}
            className="w-full flex flex-col items-center pt-3 pb-1 hover:bg-white/5 transition-colors"
          >
            <div className="w-10 h-1 bg-white/20 rounded-full" />
            <motion.div
              animate={{ rotate: expanded ? 180 : 0 }}
              transition={{ duration: 0.25 }}
              className="mt-1"
            >
              <ChevronUp className="w-4 h-4 text-white/20" />
            </motion.div>
          </button>

          <div className="px-5 pb-5">

            {/* ── Route header ── */}
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mb-1">SafeRoute AI</p>
                <h2 className="text-white text-[22px] font-bold font-outfit leading-tight tracking-tight">
                  {safeMode ? '24 min · Safe Route' : '18 min · Fast Route'}
                </h2>
                <p className="text-white/35 text-xs mt-0.5">
                  2.4 mi &nbsp;·&nbsp; {safeMode ? '156 risk zones avoided' : 'Quickest path'}
                </p>
              </div>

              <div className="flex flex-col items-center">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border transition-all duration-500 ${safeMode ? 'bg-emerald-500/15 border-emerald-500/30' : 'bg-blue-500/15 border-blue-500/30'}`}>
                  <ShieldAlert className={`w-7 h-7 ${safeMode ? 'text-emerald-400' : 'text-blue-400'}`} />
                </div>
                <span className={`text-[10px] font-black mt-1 tracking-widest ${safeMode ? 'text-emerald-400' : 'text-blue-400'}`}>
                  {safeMode ? 'SAFE' : 'FAST'}
                </span>
              </div>
            </div>

            {/* ── Route selector tabs ── */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setSafeMode(false)}
                className={`flex-1 py-3 rounded-2xl text-sm font-semibold transition-all duration-300 active:scale-95 ${!safeMode
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                  : 'bg-white/5 text-white/50 border border-white/10 hover:bg-white/10 hover:text-white'}`}
              >
                ⚡&nbsp; Fastest &nbsp;·&nbsp; 18 min
              </button>
              <button
                onClick={() => setSafeMode(true)}
                className={`flex-1 py-3 rounded-2xl text-sm font-semibold transition-all duration-300 active:scale-95 ${safeMode
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20'
                  : 'bg-white/5 text-white/50 border border-white/10 hover:bg-white/10 hover:text-white'}`}
              >
                🛡️&nbsp; Safest &nbsp;·&nbsp; 24 min
              </button>
            </div>

            {/* ── Expandable safety factors ── */}
            <AnimatePresence>
              {expanded && (
                <motion.div
                  key="factors"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden mb-4"
                >
                  <p className="text-white/30 text-[10px] font-bold uppercase tracking-widest mb-2">Live Factors</p>
                  <div className="flex flex-col gap-2">
                    <FactorRow
                      icon={<Activity className="w-4 h-4 text-rose-400" />}
                      label="Crime Reports"
                      value="2 nearby"
                      color="rose"
                    />
                    <FactorRow
                      icon={<Users className="w-4 h-4 text-indigo-400" />}
                      label="Crowd Density"
                      value="Moderate"
                      color="indigo"
                    />
                    <FactorRow
                      icon={<ShieldAlert className="w-4 h-4 text-emerald-400" />}
                      label="Police Stations"
                      value="2 on route"
                      color="emerald"
                    />
                    <FactorRow
                      icon={<Clock className="w-4 h-4 text-amber-400" />}
                      label="Street Lighting"
                      value="Good coverage"
                      color="amber"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Start button ── */}
            <button className="w-full bg-white text-[#0d1117] font-bold py-4 rounded-2xl text-[15px] shadow-xl hover:bg-white/90 active:scale-95 transition-all duration-200 flex items-center justify-center gap-2">
              <Navigation className="w-5 h-5" />
              Start Navigation
            </button>

          </div>
        </div>
      </div>
    </motion.div>
  );
};

const FactorRow = ({ icon, label, value, color }) => {
  const bg = {
    rose: 'bg-rose-500/15 border-rose-500/20',
    indigo: 'bg-indigo-500/15 border-indigo-500/20',
    emerald: 'bg-emerald-500/15 border-emerald-500/20',
    amber: 'bg-amber-500/15 border-amber-500/20',
  }[color] ?? 'bg-white/10';

  return (
    <div className="flex items-center justify-between px-3 py-2.5 bg-white/5 rounded-xl border border-white/8">
      <div className="flex items-center gap-3">
        <div className={`p-1.5 rounded-lg border ${bg}`}>{icon}</div>
        <span className="text-sm text-white font-medium">{label}</span>
      </div>
      <span className="text-xs text-white/45 font-medium">{value}</span>
    </div>
  );
};

export default BottomSheet;
