

import React, { useRef, useEffect, useMemo } from 'react';
import { useOS } from '../../contexts/OSContext';
import AgentBubble from '../../assets/AgentBubble';
import { motion, useMotionValue, useTransform, animate, Reorder } from 'framer-motion';
import { ChevronDownIcon } from '../../assets/icons';
import { ActiveAssetInstance } from '../../types';

const Desktop: React.FC = () => {
    const { osState, dispatch, setControlCenterOpen } = useOS();
    const { ui: { isControlCenterOpen }, activeAssets, desktopAssetOrder, installedAgents } = osState;
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const y = useMotionValue(0);
    const pullDownY = useTransform(y, (v) => v < 0 ? 0 : Math.pow(v, 0.85)); // Add resistance
    const indicatorOpacity = useTransform(y, [0, 60], [0, 1]);
    const indicatorScale = useTransform(y, [0, 60], [0.8, 1]);

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
             // Only trigger pull-down if not dragging an agent bubble
            if (scrollContainer.scrollTop === 0 && event.isPrimary && !isControlCenterOpen && !(event.target as HTMLElement).closest('[data-reorder-handle]')) {
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

    useEffect(() => {
        if (!isControlCenterOpen) {
            animate(y, 0, { type: 'spring', stiffness: 400, damping: 40 });
        }
    }, [isControlCenterOpen, y]);

    const orderedAssets = useMemo(() => {
        return desktopAssetOrder.map(id => activeAssets[id]).filter(Boolean);
    }, [desktopAssetOrder, activeAssets]);

    const handleReorder = (newOrderAssets: ActiveAssetInstance[]) => {
        const cleanedOrderIds: string[] = [];
        let unprocessedAssets = [...newOrderAssets];

        while (unprocessedAssets.length > 0) {
            const currentAsset = unprocessedAssets.shift(); // Takes the first one
            if (!currentAsset) continue;

            cleanedOrderIds.push(currentAsset.id);
            
            const agentDef = installedAgents[currentAsset.agentId];
            const currentIsSmall = agentDef?.size === 'small';

            if (currentIsSmall) {
                // It's a small item. To maintain the grid, we should try to pair it
                // with another small item if one exists.
                let partnerIndex = -1;
                // Find the next available small item in the unprocessed list.
                for (let i = 0; i < unprocessedAssets.length; i++) {
                    const partnerAsset = unprocessedAssets[i];
                    const partnerAgentDef = installedAgents[partnerAsset.agentId];
                    if (partnerAgentDef?.size === 'small') {
                        partnerIndex = i;
                        break;
                    }
                }

                if (partnerIndex !== -1) {
                    // A partner was found. Move it from its current position
                    // to be right after the current small item.
                    const [partnerAsset] = unprocessedAssets.splice(partnerIndex, 1);
                    cleanedOrderIds.push(partnerAsset.id);
                }
            }
        }
        
        dispatch({ type: 'UPDATE_ASSET_ORDER', payload: cleanedOrderIds });
    };

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
            >
                <div
                    ref={scrollContainerRef}
                    className="h-full w-full overflow-y-auto overscroll-behavior-y-contain p-4 sm:p-6"
                >
                    <Reorder.Group
                        as="div"
                        values={orderedAssets}
                        onReorder={handleReorder}
                        className="max-w-2xl mx-auto grid grid-cols-2 gap-4"
                    >
                       {orderedAssets.map(asset => {
                           const agentDef = installedAgents[asset.agentId];
                           if (!agentDef) return null;

                           const sizeClasses = {
                                small: 'col-span-1 h-36',
                                medium: 'col-span-2 h-52',
                                full: 'col-span-2 h-72',
                           };
                           const itemClass = sizeClasses[agentDef.size || 'medium'];

                           return (
                               <AgentBubble
                                   key={asset.id}
                                   asset={asset}
                                   className={itemClass}
                               />
                           )
                       })}
                    </Reorder.Group>
                </div>
            </motion.div>
        </div>
    );
};


export default Desktop;
