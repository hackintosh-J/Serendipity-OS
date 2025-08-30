import React, { useRef, useEffect } from 'react';
import { useOS } from '../../contexts/OSContext';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { ChevronDownIcon } from '../../assets/icons';

const GlanceView: React.FC = () => {
  const { osState, viewAsset, setControlCenterOpen } = useOS();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { ui: { isControlCenterOpen } } = osState;

  const y = useMotionValue(0);

  const pullDownY = useTransform(y, (v) => {
    if (v < 0) return 0;
    return Math.pow(v, 0.85); // Apply resistance
  });
  const indicatorOpacity = useTransform(y, [0, 60], [0, 1]);
  const indicatorScale = useTransform(y, [0, 60], [0.8, 1]);

  useEffect(() => {
    if (!isControlCenterOpen) {
      animate(y, 0, { type: 'spring', stiffness: 400, damping: 40 });
    }
  }, [isControlCenterOpen, y]);

  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    let isTouchingAtTop = false;

    const handlePositionCheck = () => {
        if (!isTouchingAtTop || !scrollContainer) return;

        const grid = scrollContainer.querySelector('.grid') as HTMLElement | null;
        const firstCard = grid?.firstElementChild as HTMLElement | null;
        if (!firstCard) return;

        const containerRect = scrollContainer.getBoundingClientRect();
        const firstCardRect = firstCard.getBoundingClientRect();
        
        const pullDistance = firstCardRect.top - containerRect.top;

        // Update visual feedback based on native overscroll
        y.set(pullDistance > 0 ? pullDistance : 0);
    };

    const handlePointerDown = (event: PointerEvent) => {
      if (!event.isPrimary || isTouchingAtTop) return;

      const grid = scrollContainer.querySelector('.grid') as HTMLElement | null;
      const firstCard = grid?.firstElementChild as HTMLElement | null;

      let isAtTop = false;
      if (firstCard) {
        const containerRect = scrollContainer.getBoundingClientRect();
        const firstCardRect = firstCard.getBoundingClientRect();
        const tolerance = 15;
        if (firstCardRect.top >= containerRect.top - tolerance) {
          isAtTop = true;
        }
      } else {
        isAtTop = scrollContainer.scrollTop <= 0;
      }
      
      if (isAtTop) {
        isTouchingAtTop = true;
        window.addEventListener('pointermove', handlePositionCheck);
      }
    };
    
    const handlePointerUp = () => {
      if (!isTouchingAtTop) return;
      
      window.removeEventListener('pointermove', handlePositionCheck);

      const pullThreshold = 60; // Lowered threshold for easier activation
      if (y.get() > pullThreshold) {
        setControlCenterOpen(true);
      } else {
        // Animate our visual indicator back, browser handles the content snap.
        animate(y, 0, { type: 'spring', stiffness: 500, damping: 50 });
      }
      isTouchingAtTop = false;
    };
    
    scrollContainer.addEventListener('pointerdown', handlePointerDown, { passive: true });
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);

    return () => {
      scrollContainer.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
      window.removeEventListener('pointermove', handlePositionCheck);
    };
  }, [y, setControlCenterOpen]);

  const sortedAssets = Object.values(osState.activeAssets)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  return (
    <div 
      className="h-full w-full bg-gradient-to-br from-indigo-100 via-sky-100 to-teal-100 dark:from-indigo-900/70 dark:via-sky-900/70 dark:to-teal-900/70 relative overflow-hidden"
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
            className="h-full w-full overflow-y-auto overscroll-behavior-y-contain p-4 sm:p-6 md:p-8"
          >
              <div className="max-w-3xl mx-auto">
                  <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-6">速览</h1>
                  <motion.div layout className="grid grid-cols-4 gap-3">
                  {sortedAssets.map(asset => {
                      const agentDef = osState.installedAgents[asset.agentId];
                      if (!agentDef) return null;

                      return (
                      <motion.div
                          key={asset.id}
                          layoutId={`asset-bubble-${asset.id}`}
                          className="bg-white/80 dark:bg-gray-800/70 rounded-2xl p-2 cursor-pointer text-center flex flex-col items-center justify-center aspect-square"
                          onClick={() => viewAsset(asset.id)}
                          whileHover={{ scale: 1.05 }}
                      >
                          <div className="w-10 h-10 bg-white/80 dark:bg-gray-700/80 rounded-lg shadow-inner flex items-center justify-center mb-2">
                              <agentDef.icon className="w-6 h-6 text-gray-700 dark:text-gray-300" />
                          </div>
                          <p className="text-xs font-medium text-gray-800 dark:text-gray-200 truncate w-full px-1">{asset.name}</p>
                          <p className="text-[10px] text-gray-500 dark:text-gray-400">{new Date(asset.createdAt).toLocaleDateString()}</p>
                      </motion.div>
                      );
                  })}
                  </motion.div>
              </div>
          </div>
        </motion.div>
    </div>
  );
};

export default GlanceView;