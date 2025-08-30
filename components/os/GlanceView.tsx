import React, { useRef, useEffect } from 'react';
import { useOS } from '../../contexts/OSContext';
import { motion, useMotionValue, useTransform, animate, useDragControls } from 'framer-motion';
import { ChevronDownIcon } from '../../assets/icons';

// Define PanInfo locally for robust gesture handling.
type PanInfo = {
  offset: { x: number; y: number; };
  velocity: { x: number; y: number; };
};

const GlanceView: React.FC = () => {
  const { osState, viewAsset, setControlCenterOpen } = useOS();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { ui: { isControlCenterOpen } } = osState;

  const y = useMotionValue(0);
  const dragControls = useDragControls();

  // The dragElastic property provides the resistance.
  const indicatorOpacity = useTransform(y, [0, 80], [0, 1]);
  const indicatorScale = useTransform(y, [0, 80], [0.8, 1]);

  useEffect(() => {
    if (!isControlCenterOpen) {
        // When the control center is dismissed, animate the view back to its resting position.
        animate(y, 0, { type: 'spring', stiffness: 400, damping: 40 });
    }
  }, [isControlCenterOpen, y]);

  const sortedAssets = Object.values(osState.activeAssets)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const handlePointerDown = (event: React.PointerEvent) => {
    if (scrollContainerRef.current?.scrollTop === 0) {
      event.preventDefault();
      dragControls.start(event, { snapToCursor: false });
    }
  };

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const pullThreshold = 100;
    const velocityThreshold = 500;
    const currentY = y.get();

    if (currentY > pullThreshold || info.velocity.y > velocityThreshold) {
      setControlCenterOpen(true);
    } else {
      animate(y, 0, { type: 'spring', stiffness: 400, damping: 40 });
    }
  };


  return (
    <div 
      onPointerDown={handlePointerDown}
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
