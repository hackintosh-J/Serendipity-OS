import React, { useMemo, useRef, useEffect } from 'react';
import { useOS } from '../../contexts/OSContext';
import AgentBubble from '../../assets/AgentBubble';
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from 'framer-motion';
import { ActiveAssetInstance } from '../../types';
import { ChevronDownIcon } from '../../assets/icons';

const Desktop: React.FC = () => {
  const { osState, setControlCenterOpen } = useOS();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { settings, ui: { isControlCenterOpen } } = osState;

  const y = useMotionValue(0);
  
  const pullDownY = useTransform(y, (v) => {
    if (v < 0) return 0;
    return Math.pow(v, 0.85); // Apply resistance
  });
  const indicatorOpacity = useTransform(y, [0, 80], [0, 1]);
  const indicatorScale = useTransform(y, [0, 80], [0.8, 1]);

  useEffect(() => {
    if (!isControlCenterOpen) {
      animate(y, 0, { type: 'spring', stiffness: 400, damping: 40 });
    }
  }, [isControlCenterOpen, y]);

  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    const gesture = {
      isDragging: false,
      isGestureActive: false,
      startY: 0,
    };

    const handlePointerDown = (event: PointerEvent) => {
      if (!event.isPrimary || gesture.isGestureActive) return;
      
      const grid = scrollContainer.firstElementChild as HTMLElement | null;
      const firstCard = grid?.firstElementChild as HTMLElement | null;

      let isAtTop = false;
      if (firstCard) {
        const containerRect = scrollContainer.getBoundingClientRect();
        const firstCardRect = firstCard.getBoundingClientRect();
        // This check is more robust for iOS overscroll (rubber banding) than scrollTop === 0.
        // If the card's top is at or above the container's top, we are at the top.
        if (firstCardRect.top >= containerRect.top) {
          isAtTop = true;
        }
      } else {
        // If there are no cards, rely on scrollTop.
        isAtTop = scrollContainer.scrollTop <= 0;
      }


      if (isAtTop) {
        gesture.isGestureActive = true;
        gesture.isDragging = false;
        gesture.startY = event.clientY;
        
        window.addEventListener('pointermove', handlePointerMove, { passive: false });
        window.addEventListener('pointerup', handlePointerUp);
        window.addEventListener('pointercancel', handlePointerUp);
      }
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (!event.isPrimary || !gesture.isGestureActive) return;

      const deltaY = event.clientY - gesture.startY;

      if (!gesture.isDragging) {
        if (Math.abs(deltaY) > 5) {
          if (deltaY > 0) {
            gesture.isDragging = true;
            event.preventDefault();
            scrollContainer.style.overflowY = 'hidden';
            scrollContainer.style.touchAction = 'none';
          } else {
            handlePointerUp();
          }
        }
      }

      if (gesture.isDragging) {
        y.set(deltaY);
      }
    };

    const handlePointerUp = () => {
      if (!gesture.isGestureActive) return;

      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);

      scrollContainer.style.overflowY = 'auto';
      scrollContainer.style.touchAction = 'auto';

      if (gesture.isDragging) {
        const pullThreshold = 100;
        if (y.get() > pullThreshold) {
          setControlCenterOpen(true);
        } else {
          animate(y, 0, { type: 'spring', stiffness: 400, damping: 40 });
        }
      }
      
      gesture.isGestureActive = false;
      gesture.isDragging = false;
    };

    scrollContainer.addEventListener('pointerdown', handlePointerDown, { capture: true });

    return () => {
      scrollContainer.removeEventListener('pointerdown', handlePointerDown, { capture: true });
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
    };
  }, [y, setControlCenterOpen]);
  
  const assetPriority = (asset: ActiveAssetInstance) => {
    if (asset.agentId === 'agent.system.insight') return -1;
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

  return (
    <div 
        className="h-full w-full bg-cover bg-center transition-all duration-500"
        style={{ backgroundImage: settings.wallpaper ? `url(${settings.wallpaper})` : 'none' }}
    >
      <div 
        className="h-full w-full bg-gradient-to-br from-rose-100/80 via-purple-100/80 to-indigo-100/80 dark:from-gray-900/80 dark:via-purple-900/40 dark:to-indigo-900/80 relative overflow-hidden"
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
            style={{ y: pullDownY }}
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