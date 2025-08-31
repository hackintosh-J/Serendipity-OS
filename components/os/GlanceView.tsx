import React, { useRef, useEffect, useMemo } from 'react';
import { useOS } from '../../contexts/OSContext';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { ChevronDownIcon } from '../../assets/icons';

const GlanceView: React.FC = () => {
  const { osState, viewAsset, setControlCenterOpen } = useOS();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { ui: { isControlCenterOpen }, desktopAssetOrder, activeAssets } = osState;

  const y = useMotionValue(0);
  const pullDownY = useTransform(y, v => v < 0 ? 0 : Math.pow(v, 0.85)); // Add resistance
  const indicatorOpacity = useTransform(y, [0, 60], [0, 1]);
  const indicatorScale = useTransform(y, [0, 60], [0.8, 1]);

  useEffect(() => {
    if (!isControlCenterOpen) {
      animate(y, 0, { type: 'spring', stiffness: 400, damping: 40 });
    }
  }, [isControlCenterOpen, y]);

  // This effect handles the pull-down gesture
  useEffect(() => {
      const scrollContainer = scrollContainerRef.current;
      if (!scrollContainer) return;

      let startY = 0;
      let isDragging = false;

      const handlePointerMove = (event: PointerEvent) => {
          if (!isDragging) return;
          event.preventDefault(); // Prevent native scroll
          const deltaY = event.clientY - startY;
          y.set(Math.max(0, deltaY)); // Only pull down
      };

      const handlePointerUp = () => {
          if (!isDragging) return;
          isDragging = false;
          window.removeEventListener('pointermove', handlePointerMove);
          window.removeEventListener('pointerup', handlePointerUp);
          window.removeEventListener('pointercancel', handlePointerUp);

          if (y.get() > 80) { // Threshold to open
              setControlCenterOpen(true);
          } else {
              animate(y, 0, { type: 'spring', stiffness: 500, damping: 50 });
          }
      };

      const handlePointerDown = (event: PointerEvent) => {
          if (scrollContainer.scrollTop === 0 && event.isPrimary && !isControlCenterOpen) {
              isDragging = true;
              startY = event.clientY;
              y.set(0);
              window.addEventListener('pointermove', handlePointerMove, { passive: false });
              window.addEventListener('pointerup', handlePointerUp);
              window.addEventListener('pointercancel', handlePointerUp);
          }
      };

      scrollContainer.addEventListener('pointerdown', handlePointerDown);

      return () => {
          scrollContainer.removeEventListener('pointerdown', handlePointerDown);
          window.removeEventListener('pointermove', handlePointerMove);
          window.removeEventListener('pointerup', handlePointerUp);
          window.removeEventListener('pointercancel', handlePointerUp);
      };
  }, [y, setControlCenterOpen, isControlCenterOpen]);


  const orderedAssets = useMemo(() => {
    return desktopAssetOrder.map(id => activeAssets[id]).filter(Boolean);
  }, [desktopAssetOrder, activeAssets]);

  return (
    <div className="h-full w-full relative overflow-hidden">
        <motion.div 
            className="absolute top-0 left-0 right-0 flex justify-center pt-4 z-10 pointer-events-none"
            style={{ opacity: indicatorOpacity, scale: indicatorScale }}
        >
            <div className="w-10 h-10 bg-glass rounded-full shadow-lg flex items-center justify-center">
                <ChevronDownIcon className="w-6 h-6 text-muted-foreground" />
            </div>
        </motion.div>
        
        <motion.div
            style={{ y: pullDownY }}
            className="h-full w-full absolute inset-0"
        >
          <div
            ref={scrollContainerRef}
            className="h-full w-full overflow-y-auto overscroll-behavior-y-contain p-4 sm:p-6"
          >
              <div className="max-w-3xl mx-auto">
                  <h1 className="text-2xl font-bold text-foreground mb-6">速览</h1>
                  <motion.div layout className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-4">
                  {orderedAssets.map(asset => {
                      const agentDef = osState.installedAgents[asset.agentId];
                      if (!agentDef) return null;

                      return (
                      <motion.div
                          key={asset.id}
                          layoutId={`asset-bubble-${asset.id}`}
                          className="bg-card-glass backdrop-blur-lg rounded-2xl p-2 cursor-pointer text-center flex flex-col items-center justify-center aspect-square shadow-sm hover:shadow-lg transition-shadow"
                          onClick={() => viewAsset(asset.id)}
                          whileHover={{ scale: 1.05 }}
                      >
                          <div className="w-10 h-10 bg-secondary/80 rounded-lg shadow-inner flex items-center justify-center mb-2">
                              <agentDef.icon className="w-6 h-6 text-secondary-foreground" />
                          </div>
                          <p className="text-xs font-medium text-foreground truncate w-full px-1">{asset.name}</p>
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