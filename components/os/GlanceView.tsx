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

    let startY = 0;
    let isDragging = false;
    let canDrag = false;

    const handlePointerMove = (event: PointerEvent) => {
        if (!isDragging) return;
        
        event.preventDefault(); // Prevent browser's default overscroll behavior

        const deltaY = event.clientY - startY;
        // Follow finger but don't go above the starting point.
        // This is the key fix to prevent the "bounce back" issue.
        y.set(Math.max(0, deltaY));
    };
    
    const handlePointerUp = () => {
        if (!isDragging) return;

        isDragging = false;
        canDrag = false;
        window.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('pointerup', handlePointerUp);
        window.removeEventListener('pointercancel', handlePointerUp);
        
        const pullThreshold = 80; // Distance needed to pull to open
        if (y.get() > pullThreshold) {
            setControlCenterOpen(true);
        } else {
            animate(y, 0, { type: 'spring', stiffness: 500, damping: 50 });
        }
    };

    const handlePointerDown = (event: PointerEvent) => {
      if (!event.isPrimary || isControlCenterOpen) return;
      
      const isAtTop = scrollContainer.scrollTop <= 0;
      
      if (isAtTop) {
        canDrag = true;
        startY = event.clientY;

        const startDrag = (moveEvent: PointerEvent) => {
          // Start dragging only on a clear downward movement
          if (canDrag && moveEvent.clientY > startY) {
            isDragging = true;
            window.removeEventListener('pointermove', startDrag);
            window.addEventListener('pointermove', handlePointerMove, { passive: false });
            handlePointerMove(moveEvent); // Process the initial movement
          } else if (canDrag && moveEvent.clientY < startY) {
            // If user scrolls up first, cancel the pull-down gesture
            canDrag = false;
            window.removeEventListener('pointermove', startDrag);
          }
        };

        window.addEventListener('pointermove', startDrag, { passive: true });
        window.addEventListener('pointerup', handlePointerUp, { once: true });
        window.addEventListener('pointercancel', handlePointerUp, { once: true });
      }
    };
    
    // Use capture phase to catch the event before child elements do.
    scrollContainer.addEventListener('pointerdown', handlePointerDown, { capture: true });

    return () => {
      scrollContainer.removeEventListener('pointerdown', handlePointerDown, { capture: true });
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
    };
  }, [y, setControlCenterOpen, isControlCenterOpen]);

  const sortedAssets = Object.values(osState.activeAssets)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  return (
    <div 
      className="h-full w-full bg-background relative overflow-hidden"
    >
        <motion.div 
            className="absolute top-0 left-0 right-0 flex justify-center pt-4 z-0 pointer-events-none"
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
            className="h-full w-full overflow-y-auto overscroll-behavior-y-contain p-4 sm:p-6 md:p-8"
          >
              <div className="max-w-3xl mx-auto">
                  <h1 className="text-2xl font-bold text-foreground mb-6">速览</h1>
                  <motion.div layout className="grid grid-cols-4 gap-3">
                  {sortedAssets.map(asset => {
                      const agentDef = osState.installedAgents[asset.agentId];
                      if (!agentDef) return null;

                      return (
                      <motion.div
                          key={asset.id}
                          layoutId={`asset-bubble-${asset.id}`}
                          className="bg-card-glass rounded-2xl p-2 cursor-pointer text-center flex flex-col items-center justify-center aspect-square"
                          onClick={() => viewAsset(asset.id)}
                          whileHover={{ scale: 1.05 }}
                      >
                          <div className="w-10 h-10 bg-secondary/80 rounded-lg shadow-inner flex items-center justify-center mb-2">
                              <agentDef.icon className="w-6 h-6 text-secondary-foreground" />
                          </div>
                          <p className="text-xs font-medium text-foreground truncate w-full px-1">{asset.name}</p>
                          <p className="text-[10px] text-muted-foreground">{new Date(asset.createdAt).toLocaleDateString()}</p>
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