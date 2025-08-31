import React, { useRef, useState, useEffect } from 'react';
import { useOS } from '../../contexts/OSContext';
import AgentBubble from '../../assets/AgentBubble';
import { motion, PanInfo, useMotionValue, useTransform, animate } from 'framer-motion';
import { ChevronDownIcon } from '../../assets/icons';

// Simple hook to detect mobile screen size
const useIsMobile = () => {
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);
    return isMobile;
};


const MobileGridView: React.FC = () => {
    const { osState, setControlCenterOpen } = useOS();
    const { ui: { isControlCenterOpen } } = osState;
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const y = useMotionValue(0);
    const pullDownY = useTransform(y, (v) => v < 0 ? 0 : Math.pow(v, 0.85));
    const indicatorOpacity = useTransform(y, [0, 60], [0, 1]);
    const indicatorScale = useTransform(y, [0, 60], [0.8, 1]);

    useEffect(() => {
        if (!isControlCenterOpen) {
            animate(y, 0, { type: 'spring', stiffness: 400, damping: 40 });
        }
    }, [isControlCenterOpen, y]);

    const sortedAssets = Object.values(osState.activeAssets)
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

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
                className="h-full w-full absolute inset-0"
                style={{ y: pullDownY }}
                onPanStart={(event) => {
                    const target = event.target as HTMLElement;
                    const scrollTarget = scrollContainerRef.current;
                    if (scrollTarget?.scrollTop === 0 && target.closest('[data-is-bubble-header]')) {
                        // Prevent pull-down when dragging a bubble's header
                        return;
                    }
                    if (scrollTarget?.scrollTop === 0) {
                       y.set(0);
                    }
                }}
                onPan={(event, info) => {
                    const scrollTarget = scrollContainerRef.current;
                    if (scrollTarget && scrollTarget.scrollTop === 0 && info.offset.y > 0) {
                        event.preventDefault(); // Prevent native scroll
                        y.set(info.offset.y);
                    }
                }}
                onPanEnd={() => {
                   if (y.get() > 80) {
                        setControlCenterOpen(true);
                    } else {
                        animate(y, 0, { type: 'spring', stiffness: 500, damping: 50 });
                    }
                }}
            >
                <div
                    ref={scrollContainerRef}
                    className="h-full w-full overflow-y-auto overscroll-behavior-y-contain p-4 sm:p-6"
                >
                    <div className="grid grid-cols-1 gap-4 max-w-2xl mx-auto">
                        {sortedAssets.map(asset => {
                             const agentDef = osState.installedAgents[asset.agentId];
                             if (!agentDef) return null;
                             const sizeClasses = {
                                small: 'h-36',
                                medium: 'h-52',
                                full: 'h-72',
                              };
                              const heightClass = sizeClasses[agentDef.size || 'medium'];

                            return (
                                <div key={asset.id} className={heightClass}>
                                    <AgentBubble asset={asset} isDraggable={false} />
                                _</div>
                            )
                        })}
                    </div>
                </div>
            </motion.div>
        </div>
    );
};


const SpatialCanvasView: React.FC = () => {
    const { osState, dispatch, setControlCenterOpen } = useOS();
    const { ui: { isControlCenterOpen } } = osState;

    const [view, setView] = useState({ x: 0, y: 0, scale: 0.8 });
    const constraintsRef = useRef(null);

    const handleWheel = (event: React.WheelEvent) => {
        const point = { x: event.clientX, y: event.clientY };
        const newScale = view.scale * (1 - event.deltaY / 1000);
        const clampedScale = Math.min(Math.max(newScale, 0.2), 2);
        
        const oldPoint = {
            x: (point.x - view.x) / view.scale,
            y: (point.y - view.y) / view.scale,
        };
        const newPoint = {
            x: (point.x - view.x) / clampedScale,
            y: (point.y - view.y) / clampedScale,
        };

        setView(v => ({
            ...v,
            scale: clampedScale,
            x: v.x + (newPoint.x - oldPoint.x) * clampedScale,
            y: v.y + (newPoint.y - oldPoint.y) * clampedScale,
        }));
    };
    
    const handleAssetDragEnd = (assetId: string, info: PanInfo) => {
        const asset = osState.activeAssets[assetId];
        if (asset) {
            const newPosition = {
                x: asset.position.x + info.offset.x / view.scale,
                y: asset.position.y + info.offset.y / view.scale,
            };
            dispatch({ type: 'UPDATE_ASSET_METADATA', payload: { assetId, position: newPosition } });
        }
    };
    
    const y = useMotionValue(0);
    const pullDownY = useTransform(y, (v) => v < 0 ? 0 : Math.pow(v, 0.85));
    const indicatorOpacity = useTransform(y, [0, 60], [0, 1]);
    const indicatorScale = useTransform(y, [0, 60], [0.8, 1]);

    useEffect(() => {
        if (!isControlCenterOpen) {
            animate(y, 0, { type: 'spring', stiffness: 400, damping: 40 });
        }
    }, [isControlCenterOpen, y]);

    const handleContainerPan = (e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      const target = e.target as HTMLElement;
      if (target.closest('[role="button"]')) {
        return;
      }
       setView(v => ({ ...v, x: v.x + info.delta.x, y: v.y + info.delta.y }));
    };

    return (
        <div 
            ref={constraintsRef}
            className="h-full w-full relative overflow-hidden"
            onWheel={handleWheel}
        >
            <motion.div 
                className="absolute top-0 left-0 right-0 flex justify-center pt-4 z-10 pointer-events-none"
                style={{ opacity: indicatorOpacity, scale: indicatorScale }}
            >
                <div className="w-10 h-10 bg-glass rounded-full shadow-lg flex items-center justify-center">
                    <ChevronDownIcon className="w-6 h-6 text-muted-foreground" />
                </div>
            </motion.div>
        
            <motion.div
                className="h-full w-full absolute inset-0 cursor-grab active:cursor-grabbing"
                style={{ y: pullDownY }}
                onPanStart={(event) => {
                    const target = event.target as HTMLElement;
                    if (target.dataset.isCanvas) {
                       y.set(0);
                    }
                }}
                onPan={(event, info) => {
                    const target = event.target as HTMLElement;
                    if (target.dataset.isCanvas) {
                        y.set(y.get() + info.delta.y);
                    }
                }}
                onPanEnd={() => {
                   if (y.get() > 80) {
                        setControlCenterOpen(true);
                    } else {
                        animate(y, 0, { type: 'spring', stiffness: 500, damping: 50 });
                    }
                }}
            >
                <motion.div
                    data-is-canvas="true"
                    className="w-full h-full relative"
                    style={{ x: view.x, y: view.y, scale: view.scale, touchAction: 'none' }}
                    onPan={handleContainerPan}
                >
                    {Object.values(osState.activeAssets).map(asset => (
                        <AgentBubble 
                            key={asset.id} 
                            asset={asset}
                            isDraggable={true}
                            scale={view.scale}
                            onDragEnd={handleAssetDragEnd}
                        />
                    ))}
                </motion.div>
            </motion.div>
        </div>
    );
};


const Desktop: React.FC = () => {
    const isMobile = useIsMobile();
    return isMobile ? <MobileGridView /> : <SpatialCanvasView />;
};

export default Desktop;