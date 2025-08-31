import React from 'react';
import { OSProvider, useOS } from './contexts/OSContext';
import SystemBar from './components/os/SystemBar';
import Desktop from './components/os/Desktop';
import Dock from './components/os/Dock';
import WindowManager from './components/os/WindowManager';
import AIPanel from './components/os/AICompanion';
import ControlCenter from './components/os/ControlCenter';
import GlanceView from './components/os/GlanceView';
import { motion, AnimatePresence } from 'framer-motion';

const MainViewport: React.FC = () => {
  const { osState } = useOS();
  const { ui: { aiPanelState, isControlCenterOpen, currentView } } = osState;
  const isAiPanelOpen = aiPanelState === 'panel';

  return (
    <motion.div
      className="flex-grow relative overflow-hidden"
      animate={{ paddingBottom: isAiPanelOpen ? '45vh' : '6rem' }}
      transition={{ type: 'spring', damping: 30, stiffness: 200 }}
    >
      <main className="absolute inset-0 bg-transparent">
        {currentView === 'desktop' ? <Desktop /> : <GlanceView />}
        
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
      <div className="w-screen h-screen flex items-center justify-center bg-background text-foreground font-sans">
        <div className="flex flex-col items-center">
           <svg className="animate-spin h-10 w-10 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="mt-4 text-lg">正在启动 Serendipity OS...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full font-sans flex flex-col overflow-hidden" style={{ background: 'var(--background-style)' }}>
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