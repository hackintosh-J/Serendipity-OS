import React, { useMemo, useRef, useState } from 'react';
import { useOS } from '../../contexts/OSContext';
import AgentBubble from '../../assets/AgentBubble';
import { motion, AnimatePresence, PanInfo, useAnimation } from 'framer-motion';
import { ActiveAssetInstance } from '../../types';
import { ChevronDownIcon } from '../../assets/icons';

const Desktop: React.FC = () => {
  const { osState, setControlCenterOpen } = useOS();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canPullToOpen, setCanPullToOpen] = useState(false);
  const pullIndicatorControls = useAnimation();
  const { settings } = osState;

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
      setCanPullToOpen(true);
    } else {
      setCanPullToOpen(false);
    }
  };

  const handlePan = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (!canPullToOpen || info.offset.y < 0) return;

    const pullDistance = Math.min(info.offset.y, 150);
    const progress = pullDistance / 150;

    pullIndicatorControls.start({
      opacity: progress,
      scale: 0.8 + progress * 0.2,
      y: pullDistance / 2,
    });
  };

  const handlePanEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const pullThreshold = 50; // Lowered from 100 to 50 for easier triggering
    if (canPullToOpen && info.offset.y > pullThreshold) {
      setControlCenterOpen(true);
    }
    pullIndicatorControls.start({ opacity: 0, scale: 0.8, y: 0, transition: { duration: 0.2 } });
    setCanPullToOpen(false);
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