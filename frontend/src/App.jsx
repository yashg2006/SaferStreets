import React, { useState } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import MapComponent from './components/MapComponent';

function App() {
  const [safeMode, setSafeMode] = useState(false);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      {/* Top Navigation */}
      <Header />

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden p-4 gap-4">
        
        {/* Left Sidebar - Routes and Activity */}
        <div className="w-1/3 max-w-md h-full z-10 flex flex-col gap-4">
          <Sidebar safeMode={safeMode} setSafeMode={setSafeMode} />
        </div>

        {/* Right Area - Map and Analytics Overlay */}
        <div className="flex-1 relative rounded-2xl overflow-hidden shadow-glass border border-white/40">
          <MapComponent safeMode={safeMode} />
          
          {/* Floating Analytics / AI Suggestions */}
          <div className="absolute bottom-6 right-6 w-80 glass-panel p-5 bg-gradient-to-br from-white/80 to-blue-50/80">
            <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
              AI Route Suggestions
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Our AI analyzed crime rates, lighting, and crowd density to find the safest route for your journey.
            </p>
            <div className="flex flex-wrap gap-2">
              <button 
                onClick={() => setSafeMode(false)}
                className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${!safeMode ? 'bg-primary text-white border-primary' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
              >
                Fastest →
              </button>
              <button 
                onClick={() => setSafeMode(true)}
                className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${safeMode ? 'bg-success text-white border-success' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
              >
                Safest (Recommended) →
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default App;
