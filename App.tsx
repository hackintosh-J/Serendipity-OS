


import React, { useState, useEffect } from 'react';
import { OSProvider, useOS } from './contexts/OSContext';
import SystemBar from './components/os/SystemBar';
import Desktop from './components/os/Desktop';
import Dock from './components/os/Dock';
import WindowManager from './components/os/WindowManager';
import AIPanel from './components/os/AICompanion';
import ControlCenter from './components/os/ControlCenter';
import GlanceView from './components/os/GlanceView';
import { motion, AnimatePresence } from 'framer-motion';

const variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? '100%' : '-100%',
    opacity: 0,
  }),
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    zIndex: 0,
    x: direction < 0 ? '100%' : '-100%',
    opacity: 0,
  }),
};

const swipeConfidenceThreshold = 10000;
const swipePower = (offset: number, velocity: number) => {
  return Math.abs(offset) * velocity;
};

const MainViewport: React.FC = () => {
  const { osState, setCurrentView } = useOS();
  const { ui: { isControlCenterOpen, currentView } } = osState;
  
  // We track the page index (0 for desktop, 1 for glance) and the direction of navigation
  const [[page, direction], setPage] = useState([currentView === 'desktop' ? 0 : 1, 0]);

  const paginate = (newDirection: number) => {
    // This is called on swipe. The direction is relative to current page.
    // newDirection > 0 means swipe left (to next page)
    // newDirection < 0 means swipe right (to previous page)
    if (page === 0 && newDirection > 0) {
        setCurrentView('glance');
    } else if (page === 1 && newDirection < 0) {
        setCurrentView('desktop');
    }
  };

  // This effect synchronizes the local animation state with the global OS state.
  // This is crucial for the Dock button to trigger the animation correctly.
  useEffect(() => {
      const newPage = currentView === 'desktop' ? 0 : 1;
      if (newPage !== page) {
          // If the page has changed, determine the direction for the animation.
          setPage([newPage, newPage > page ? 1 : -1]);
      }
  }, [currentView, page]);

  return (
    <div
      className="flex-grow relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-transparent">
        <AnimatePresence initial={false} custom={direction}>
          <motion.div
            key={page}
            className="absolute inset-0"
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 }
            }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.5}
            dragDirectionLock={true}
            onDragEnd={(e, { offset, velocity }) => {
              const swipe = swipePower(offset.x, velocity.x);

              if (swipe < -swipeConfidenceThreshold) {
                paginate(1); // Swipe left, go to next page
              } else if (swipe > swipeConfidenceThreshold) {
                paginate(-1); // Swipe right, go to previous page
              }
            }}
          >
            {page === 0 ? <Desktop /> : <GlanceView />}
          </motion.div>
        </AnimatePresence>
      </div>
      
      {/* Modals are rendered on top of the swipeable view container */}
      <AnimatePresence>
        {osState.ui.viewingAssetId && <WindowManager />}
      </AnimatePresence>
      <AnimatePresence>
        {isControlCenterOpen && <ControlCenter />}
      </AnimatePresence>
    </div>
  );
};


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
