import React, { useMemo, useRef } from 'react';
import { useOS } from '../../contexts/OSContext';
import AgentBubble from '../../assets/AgentBubble';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { ActiveAssetInstance } from '../../types';
import { ChevronDownIcon } from '../../assets/icons';

// FIX: Add `point` to PanInfo type definition to use absolute pointer coordinates for robust gesture detection.
type PanInfo = {
  offset: { x: number; y: number; };
  velocity: { x: number; y: number; };
  delta: { x: number; y: number; };
  point: { x: number; y: number; };
};

const Desktop: React.FC = () => {
  const { osState, setControlCenterOpen } = useOS();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const pullIndicatorControls = useAnimation();
  const { settings } = osState;
  
  // A more detailed state machine for the gesture.
  // 'idle': No gesture.
  // 'tracking': Gesture started at the top, could be a scroll or a pull.
  // 'pulling': Confirmed as a pull-down gesture. We take control.
  // 'scrolling': Confirmed as a normal scroll. Browser is in control.
  const gestureState = useRef({
    state: 'idle' as 'idle' | 'tracking' | 'pulling' | 'scrolling',
    pullStartY: 0,
  }).current;

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
    
  const handlePanStart = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    if (scrollContainer.scrollTop === 0) {
      gestureState.state = 'tracking';
    } else {
      gestureState.state = 'scrolling';
    }
  };

  const handlePan = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    // If we're tracking, we need to decide if this is a scroll or a pull.
    if (gestureState.state === 'tracking') {
      // If browser starts scrolling the content, it's a scroll.
      if (scrollContainer.scrollTop > 0) {
        gestureState.state = 'scrolling';
        return;
      }
      
      // If we are still at the top and the user is panning down, it's a pull.
      if (info.offset.y > 5) { // A small threshold to prevent accidental pulls
        gestureState.state = 'pulling';
        // Anchor the starting point of the pull gesture itself.
        gestureState.pullStartY = info.point.y;
        
        // From now on, we take over.
        if (event.cancelable) event.preventDefault();
      }
    }

    if (gestureState.state === 'pulling') {
      // Ensure we keep preventing default for the rest of the pull gesture.
      if (event.cancelable) event.preventDefault();

      const currentPullDistance = info.point.y - gestureState.pullStartY;

      // If user reverses direction, let's treat the pull as cancelled.
      if (currentPullDistance < 0) {
        gestureState.state = 'scrolling';
        pullIndicatorControls.start({ opacity: 0, scale: 0.8, y: 0, transition: { duration: 0.2 } });
        return;
      }
      
      const limitedPullDistance = Math.min(currentPullDistance, 150);
      const progress = limitedPullDistance > 0 ? limitedPullDistance / 150 : 0;
      
      pullIndicatorControls.start({
          opacity: progress,
          scale: 0.8 + progress * 0.2,
          y: limitedPullDistance / 2,
          transition: { type: 'spring', stiffness: 500, damping: 40 }
      });
    }
  };

  const handlePanEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const pullThreshold = 70;

    if (gestureState.state === 'pulling') {
        const finalPullDistance = info.point.y - gestureState.pullStartY;
        if (finalPullDistance > pullThreshold) {
          setControlCenterOpen(true);
        }
    }

    // Always reset state and hide indicator when the gesture ends.
    gestureState.state = 'idle';
    pullIndicatorControls.start({ opacity: 0, scale: 0.8, y: 0, transition: { duration: 0.2 } });
  };


  return (
    <div 
        className="h-full w-full bg-cover bg-center transition-all duration-500"
        style={{ backgroundImage: settings.wallpaper ? `url(${settings.wallpaper})` : 'none' }}
    >
        <motion.div 
            ref={scrollContainerRef}
            onPanStart={handlePanStart}
            onPan={handlePan}
            onPanEnd={handlePanEnd}
            style={{ touchAction: 'pan-y' }}
            className="h-full w-full bg-gradient-to-br from-rose-100/80 via-purple-100/80 to-indigo-100/80 dark:from-gray-900/80 dark:via-purple-900/40 dark:to-indigo-900/80 overflow-y-auto p-4 sm:p-6 overscroll-behavior-y-contain relative"
        >
            <motion.div 
                className="absolute top-0 left-0 right-0 flex justify-center pt-4 z-0 pointer-events-none"
                animate={pullIndicatorControls}
                initial={{ opacity: 0, scale: 0.8, y: 0 }}
            >
                <div className="w-10 h-10 bg-white/50 dark:bg-gray-800/50 rounded-full shadow-lg flex items-center justify-center">
                    <ChevronDownIcon className="w-6 h-6 text-gray-700 dark:text-gray-300" />
                </div>
            </motion.div>
            <motion.div 
                layout 
                className="max-w-3xl mx-auto grid grid-cols-2 gap-4 sm:gap-6"
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
        </motion.div>
    </div>
  );
};

export default Desktop;
