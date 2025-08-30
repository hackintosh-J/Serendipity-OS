import React, { useState, useEffect, useRef, useMemo } from 'react';
import { OSProvider, useOS } from './contexts/OSContext';
import SystemBar from './components/os/SystemBar';
import Desktop from './components/os/Desktop';
import Dock from './components/os/Dock';
import WindowManager from './components/os/WindowManager';
import AIPanel from './components/os/AICompanion';
import ControlCenter from './components/os/ControlCenter';
import GlanceView from './components/os/GlanceView';
// FIX: Import `Transition` type from framer-motion to resolve type error.
import { motion, AnimatePresence, PanInfo, Transition } from 'framer-motion';

const MainViewport: React.FC = () => {
  const { osState, setCurrentView } = useOS();
  const { ui: { aiPanelState, currentView, isControlCenterOpen } } = osState;
  const isAiPanelOpen = aiPanelState === 'panel';
  
  // FIX: Explicitly type the transition object to prevent TypeScript from inferring 'type' as a generic `string`.
  const transition: Transition = { type: 'spring', stiffness: 300, damping: 30 };

  const handleDesktopPanEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const swipeThreshold = 50;
    const velocityThreshold = 200;
    const { offset, velocity } = info;

    const isHorizontalSwipe = Math.abs(offset.x) > Math.abs(offset.y);

    if (isHorizontalSwipe) {
      // Swipe Left to Glance
      if (offset.x < -swipeThreshold && velocity.x < -velocityThreshold) {
        setCurrentView('glance');
      }
    }
    // Note: Swipe down for Control Center is now handled within Desktop.tsx
  };

  const handleGlancePanEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const swipeThreshold = 50;
    const velocityThreshold = 200;
    const { offset, velocity } = info;

    // Swipe Right to Desktop
    if (offset.x > swipeThreshold && velocity.x > velocityThreshold && Math.abs(offset.x) > Math.abs(offset.y)) {
      setCurrentView('desktop');
    }
  };

  return (
    <motion.div
      className="flex-grow relative"
      animate={{ paddingBottom: isAiPanelOpen ? '45vh' : '6rem' }}
      transition={{ type: 'spring', damping: 30, stiffness: 200 }}
    >
      <main className="absolute inset-0 overflow-hidden bg-gray-200">
        <AnimatePresence initial={false}>
          {currentView === 'desktop' ? (
            <motion.div
              key="desktop"
              className="absolute inset-0"
              initial={{ x: 0 }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={transition}
              onPanEnd={handleDesktopPanEnd}
            >
              <Desktop />
            </motion.div>
          ) : (
            <motion.div
              key="glance"
              className="absolute inset-0"
              initial={{ x: '100%' }}
              animate={{ x: '0%' }}
              exit={{ x: '100%' }}
              transition={transition}
              onPanEnd={handleGlancePanEnd}
            >
              <GlanceView />
            </motion.div>
          )}
        </AnimatePresence>
        
        <AnimatePresence>
          {osState.ui.viewingAssetId && <WindowManager />}
        </AnimatePresence>
        <AnimatePresence>
          {isControlCenterOpen && <ControlCenter />}
        </AnimatePresence>
      </main>
    </motion.div>
  );
}


const SerendipityOS: React.FC = () => {
  const { osState } = useOS();

  if (!osState.isInitialized) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-gray-100 text-gray-700 font-sans">
        <div className="flex flex-col items-center">
           <svg className="animate-spin h-10 w-10 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="mt-4 text-lg">正在启动 Serendipity OS...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-gray-100 font-sans flex flex-col overflow-hidden">
      <SystemBar />
      <MainViewport />
      <div className="fixed bottom-0 left-0 right-0 z-40">
        <Dock />
        <AIPanel />
      </div>
    </div>
  );
};

const App: React.FC = () => (
  <OSProvider>
    <SerendipityOS />
  </OSProvider>
);


export default App;