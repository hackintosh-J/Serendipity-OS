import React, { useMemo, useRef, useEffect } from 'react';
import { useOS } from '../../contexts/OSContext';
import AgentBubble from '../../assets/AgentBubble';
import { motion, AnimatePresence, useMotionValue, useTransform, animate, useDragControls } from 'framer-motion';
import { ActiveAssetInstance } from '../../types';
import { ChevronDownIcon } from '../../assets/icons';

// Define PanInfo locally for robust gesture handling.
type PanInfo = {
  offset: { x: number; y: number; };
  velocity: { x: number; y: number; };
};

const Desktop: React.FC = () => {
  const { osState, setControlCenterOpen } = useOS();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { settings, ui: { isControlCenterOpen } } = osState;

  const y = useMotionValue(0);
  const dragControls = useDragControls();

  const indicatorOpacity = useTransform(y, [0, 80], [0, 1]);
  const indicatorScale = useTransform(y, [0, 80], [0.8, 1]);

  useEffect(() => {
    // This effect ensures that when the control center is closed externally,
    // the desktop animates back to its original position.
    if (!isControlCenterOpen) {
        animate(y, 0, { type: 'spring', stiffness: 400, damping: 40 });
    }
  }, [isControlCenterOpen, y]);
  
  const assetPriority = (asset: ActiveAssetInstance) => {
    if (asset.agentId === 'agent.system.insight') return -1; // Insights always on top
    if (asset.agentId === 'agent.system.clock' || asset.agentId === 'agent.system.weather' || asset.agentId === 'agent.system.calculator') return 0;
    return 1;
  };

  const sortedAssets = useMemo(() => Object.values(osState.activeAssets)
    .sort((a, b) => {
        const priorityA = assetPriority(a);
        const priorityB = assetPriority(b);
        if (priorityA !== priorityB) return priorityA - priorityB;
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    }), [osState.activeAssets]);
    
  const resetTouchAction = () => {
    const scroller = scrollContainerRef.current;
    if (scroller) {
      scroller.style.touchAction = 'auto';
    }
  };
    
  const handlePointerDown = (event: React.PointerEvent) => {
    // Only initiate a drag if the scroll container is at the very top.
    // This is the key to differentiating between scrolling the content and pulling the entire view.
    if (scrollContainerRef.current?.scrollTop === 0) {
      const scroller = scrollContainerRef.current;
      if (scroller) {
        // Temporarily disable the browser's native vertical scrolling/panning
        // to allow our drag gesture to take over without conflict.
        scroller.style.touchAction = 'pan-x';
      }
      dragControls.start(event, { snapToCursor: false });
    }
  };

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    resetTouchAction(); // Always restore native scrolling when the drag ends.
    
    const pullThreshold = 100;
    const velocityThreshold = 500;
    const currentY = y.get();

    if (currentY > pullThreshold || info.velocity.y > velocityThreshold) {
      setControlCenterOpen(true);
      // The `y` value remains at its current position, preventing the "snap back".
      // The useEffect hook will handle snapping back only when the CC is closed.
    } else {
      // If not pulled far enough, spring back to the top.
      animate(y, 0, { type: 'spring', stiffness: 400, damping: 40 });
    }
  };

  return (
    <div 
        className="h-full w-full bg-cover bg-center transition-all duration-500"
        style={{ backgroundImage: settings.wallpaper ? `url(${settings.wallpaper})` : 'none' }}
    >
      <div 
        onPointerDown={handlePointerDown}
        onPointerUp={resetTouchAction}
        onPointerCancel={resetTouchAction}
        className="h-full w-full bg-gradient-to-br from-rose-100/80 via-purple-100/80 to-indigo-100/80 dark:from-gray-900/80 dark:via-purple-900/40 dark:to-indigo-900/80 relative overflow-hidden cursor-grab"
      >
        <motion.div 
            className="absolute top-0 left-0 right-0 flex justify-center pt-4 z-0 pointer-events-none"
            style={{ opacity: indicatorOpacity, scale: indicatorScale }}
        >
            <div className="w-10 h-10 bg-white/50 dark:bg-gray-800/50 rounded-full shadow-lg flex items-center justify-center">
                <ChevronDownIcon className="w-6 h-6 text-gray-700 dark:text-gray-300" />
            </div>
        </motion.div>
        
        <motion.div
            drag="y"
            dragListener={false}
            dragControls={dragControls}
            onDragEnd={handleDragEnd}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.5 }}
            style={{ y }}
            className="h-full w-full absolute inset-0"
        >
          <div
              ref={scrollContainerRef}
              className="h-full w-full overflow-y-auto overscroll-behavior-y-contain"
          >
              <motion.div 
                  layout 
                  className="max-w-3xl mx-auto grid grid-cols-2 gap-4 sm:gap-6 p-4 sm:p-6"
              >
                  <AnimatePresence>
                  {sortedAssets.map(asset => {
                      const agentDef = osState.installedAgents[asset.agentId];
                      const sizeClass = agentDef?.size === 'small' ? 'col-span-1' : 'col-span-2';
                      return (
                      <motion.div key={asset.id} layout className={sizeClass}>
                          <AgentBubble asset={asset} />
                      </motion.div>
                      )
                  })}
                  </AnimatePresence>
                  {sortedAssets.length === 0 && (
                      <div className="text-center py-20 col-span-2">
                          <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300">空空如也</h2>
                          <p className="text-gray-500 dark:text-gray-400 mt-2">点击下方的 AI 图标开始创建你的第一个智能资产吧！</p>
                      </div>
                  )}
              </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Desktop;