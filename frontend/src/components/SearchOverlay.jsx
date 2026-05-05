import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Menu, X } from 'lucide-react';

const SearchOverlay = ({ onMenuClick }) => {
  const [originFocused, setOriginFocused] = useState(false);
  const [destFocused, setDestFocused] = useState(false);

  return (
    <motion.div
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut', delay: 0.3 }}
      className="absolute top-4 left-1/2 -translate-x-1/2 z-20 w-full max-w-md px-4"
    >
      <div className="bg-[#0d1117]/96 backdrop-blur-3xl rounded-2xl border border-white/10 shadow-2xl">

        {/* Header row */}
        <div className="flex items-center gap-3 px-4 pt-4 pb-2">
          <button
            onClick={onMenuClick}
            id="menu-btn"
            className="p-2 rounded-xl bg-white/8 hover:bg-white/15 text-white/60 hover:text-white transition-all duration-200 active:scale-90"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 flex-1">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <MapPin className="w-4 h-4 text-white" />
            </div>
            <span className="text-white font-bold text-sm font-outfit tracking-wide">SafeRoute</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] text-white/35 font-medium">AI Active</span>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-white/8 mx-4" />

        {/* Inputs */}
        <div className="px-4 py-3 flex flex-col gap-1">

          {/* Origin */}
          <div className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${originFocused ? 'bg-white/10 ring-1 ring-white/20' : 'bg-white/5'}`}>
            <div className="relative flex-shrink-0 w-4 flex justify-center">
              <div className="w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-emerald-300 shadow-sm shadow-emerald-400/50" />
            </div>
            <input
              type="text"
              defaultValue="Current Location"
              onFocus={() => setOriginFocused(true)}
              onBlur={() => setOriginFocused(false)}
              className="flex-1 bg-transparent text-white text-sm placeholder-white/30 focus:outline-none"
            />
          </div>

          {/* Connecting dots */}
          <div className="flex items-center gap-3 py-0.5 pl-4">
            <div className="flex flex-col gap-0.5">
              <div className="w-0.5 h-1 bg-white/20 rounded-full" />
              <div className="w-0.5 h-1 bg-white/20 rounded-full" />
            </div>
          </div>

          {/* Destination */}
          <div className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${destFocused ? 'bg-white/10 ring-1 ring-white/20' : 'bg-white/5'}`}>
            <div className="relative flex-shrink-0 w-4 flex justify-center">
              <MapPin className="w-3.5 h-3.5 text-rose-400" />
            </div>
            <input
              type="text"
              placeholder="Where to?"
              defaultValue="Times Square, NYC"
              onFocus={() => setDestFocused(true)}
              onBlur={() => setDestFocused(false)}
              className="flex-1 bg-transparent text-white text-sm placeholder-white/30 focus:outline-none"
            />
          </div>
        </div>

      </div>
    </motion.div>
  );
};

export default SearchOverlay;
