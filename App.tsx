import React, { useState } from 'react';
import { OSProvider, useOS } from './contexts/OSContext.tsx';
import SystemBar from './components/os/SystemBar.tsx';
import Desktop from './components/os/Desktop.tsx';
import Dock from './components/os/Dock.tsx';
import WindowManager from './components/os/WindowManager.tsx';
import AIPanel from './components/os/AICompanion.tsx';
import { motion, AnimatePresence } from 'framer-motion';

const SerendipityOS: React.FC = () => {
  const { osState } = useOS();
  const isAiPanelOpen = osState.ui.aiPanelState === 'panel';

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
      <motion.div
        className="flex-grow relative"
        animate={{ paddingBottom: isAiPanelOpen ? '45vh' : '6rem' }}
        transition={{ type: 'spring', damping: 30, stiffness: 200 }}
      >
        <main className="absolute inset-0">
          <Desktop />
          <AnimatePresence>
            {osState.ui.viewingAssetId && <WindowManager />}
          </AnimatePresence>
        </main>
      </motion.div>
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