import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import MapComponent from './components/MapComponent';
import BottomSheet from './components/BottomSheet';
import SearchOverlay from './components/SearchOverlay';
import Sidebar from './components/Sidebar';

function App() {
  const [safeMode, setSafeMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="h-screen w-screen overflow-hidden relative bg-[#0d1117]">

      {/* ── Full-screen map (fills everything) ── */}
      <MapComponent safeMode={safeMode} />

      {/* ── Floating search bar — top centre ── */}
      <SearchOverlay onMenuClick={() => setSidebarOpen(true)} />

      {/* ── Bottom sheet — trip info ── */}
      <BottomSheet safeMode={safeMode} setSafeMode={setSafeMode} />

      {/* ── Sidebar drawer (slides in from left) ── */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={() => setSidebarOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm z-30"
            />

            {/* Drawer panel */}
            <motion.div
              key="drawer"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 300 }}
              className="absolute left-0 top-0 bottom-0 w-80 z-40"
            >
              <Sidebar
                safeMode={safeMode}
                setSafeMode={setSafeMode}
                onClose={() => setSidebarOpen(false)}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}

export default App;
