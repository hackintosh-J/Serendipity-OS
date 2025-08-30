import React, { useMemo, useRef } from 'react';
import { useOS } from '../../contexts/OSContext';
import AgentBubble from '../../assets/AgentBubble';
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from 'framer-motion';
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
  const { settings } = osState;

  const gestureState = useRef<'idle' | 'tracking' | 'pulling'>('idle');
  const y = useMotionValue(0);

  // Apply resistance to the pull, creating an elastic feel.
  const contentY = useTransform(y, value => value > 0 ? value * 0.4 : 0);
  const indicatorOpacity = useTransform(contentY, [0, 80], [0, 1]);
  const indicatorScale = useTransform(contentY, [0, 80], [0.8, 1]);


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
    
  const handlePanStart = () => {
    const scrollContainer = scrollContainerRef.current;
    if (scrollContainer && scrollContainer.scrollTop === 0) {
      gestureState.current = 'tracking';
    } else {
      gestureState.current = 'idle';
    }
  };

  const handlePan = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;
    
    // If we're tracking a potential pull gesture from the top
    if (gestureState.current === 'tracking') {
      // If the user starts pulling down, we switch to 'pulling' mode and take control.
      if (info.offset.y > 5) {
        gestureState.current = 'pulling';
      } else {
        // If they scroll up, or the browser scrolls the content down, we let the native scroll take over.
        // We do this by simply not intervening.
        return;
      }
    }

    // If we are in 'pulling' mode, we move the content container.
    if (gestureState.current === 'pulling') {
      // We must prevent the default action to stop the browser's native scrolling and pull-to-refresh.
      if (event.cancelable) {
        event.preventDefault();
        event.stopPropagation();
      }
      
      // Update the y motion value based on the gesture's offset.
      // We only care about downward pulls.
      if (info.offset.y > 0) {
        y.set(info.offset.y);
      } else {
        // If user reverses direction, reset.
        y.set(0);
      }
    }
  };

  const handlePanEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (gestureState.current === 'pulling') {
      const pullThreshold = 100; // The pixel distance to trigger the control center
      const velocityThreshold = 500; // The velocity to trigger the control center
      const currentY = y.get();

      if (currentY > pullThreshold || info.velocity.y > velocityThreshold) {
        // Animate the content slightly further for a smoother transition before opening the control center
        animate(y, 300, { type: 'spring', stiffness: 400, damping: 40 });
        setControlCenterOpen(true);
        // After the control center is open, reset the position silently.
        // The control center's exit animation will handle the visual return.
        setTimeout(() => animate(y, 0, {duration: 0}), 300);
      } else {
        // If not pulled far enough, spring back to the top.
        animate(y, 0, { type: 'spring', stiffness: 400, damping: 40 });
      }
    }
    gestureState.current = 'idle';
  };

  return (
    <div 
        className="h-full w-full bg-cover bg-center transition-all duration-500"
        style={{ backgroundImage: settings.wallpaper ? `url(${settings.wallpaper})` : 'none' }}
    >
        <div className="h-full w-full bg-gradient-to-br from-rose-100/80 via-purple-100/80 to-indigo-100/80 dark:from-gray-900/80 dark:via-purple-900/40 dark:to-indigo-900/80 relative overflow-hidden">
            {/* The pull-down indicator, its visibility is tied to the gesture */}
            <motion.div 
                className="absolute top-0 left-0 right-0 flex justify-center pt-4 z-0 pointer-events-none"
                style={{ opacity: indicatorOpacity, scale: indicatorScale }}
            >
                <div className="w-10 h-10 bg-white/50 dark:bg-gray-800/50 rounded-full shadow-lg flex items-center justify-center">
                    <ChevronDownIcon className="w-6 h-6 text-gray-700 dark:text-gray-300" />
                </div>
            </motion.div>
            
            {/* This is the main scrollable container that also moves down */}
            <motion.div
                ref={scrollContainerRef}
                onPanStart={handlePanStart}
                onPan={handlePan}
                onPanEnd={handlePanEnd}
                style={{ y: contentY, touchAction: 'pan-y' }}
                className="h-full w-full overflow-y-auto overscroll-behavior-y-contain absolute inset-0"
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
            </motion.div>
        </div>
    </div>
  );
};

export default Desktop;
