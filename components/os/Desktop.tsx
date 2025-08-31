import React, { useRef, useEffect } from 'react';
import { useOS } from '../../contexts/OSContext';
import AgentBubble from '../../assets/AgentBubble';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { ChevronDownIcon } from '../../assets/icons';

const Desktop: React.FC = () => {
    const { osState, setControlCenterOpen } = useOS();
    const { ui: { isControlCenterOpen } } = osState;
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const y = useMotionValue(0);
    const pullDownY = useTransform(y, (v) => v < 0 ? 0 : Math.pow(v, 0.85)); // Add resistance
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


    const sortedAssets = Object.values(osState.activeAssets)
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    // Group assets to allow small assets to sit side-by-side
    const groupedAssets = sortedAssets.reduce<any[][]>((acc, asset) => {
        const agentDef = osState.installedAgents[asset.agentId];
        if (agentDef && agentDef.size === 'small') {
            const lastGroup = acc[acc.length - 1];
            // If the last group is also a small item and has only one item, add to it.
            if (lastGroup && lastGroup.length === 1 && osState.installedAgents[lastGroup[0].agentId]?.size === 'small') {
                lastGroup.push(asset);
            } else {
                acc.push([asset]); // Start a new group for the small asset
            }
        } else {
            acc.push([asset]); // Full/medium assets get their own group
        }
        return acc;
    }, []);


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
                    <div className="max-w-2xl mx-auto space-y-4">
                       {groupedAssets.map((group, groupIndex) => {
                           if (group.length > 1) {
                               // Render a row of small assets
                               return (
                                   <div key={`group-${groupIndex}`} className="flex flex-col sm:flex-row gap-4">
                                       {group.map(asset => {
                                            const agentDef = osState.installedAgents[asset.agentId];
                                            if (!agentDef) return null;
                                            return (
                                                <div key={asset.id} className="h-36 w-full sm:w-1/2">
                                                    <AgentBubble asset={asset} />
                                                </div>
                                            )
                                       })}
                                   </div>
                               )
                           }

                           // Render a single, larger asset
                           const asset = group[0];
                           const agentDef = osState.installedAgents[asset.agentId];
                           if (!agentDef) return null;
                           const sizeClasses = {
                                small: 'h-36', // Fallback for single small asset
                                medium: 'h-52',
                                full: 'h-72',
                           };
                           const heightClass = sizeClasses[agentDef.size || 'medium'];

                           return (
                               <div key={asset.id} className={heightClass}>
                                   <AgentBubble asset={asset} />
                               </div>
                           )
                       })}
                    </div>
                </div>
            </motion.div>
        </div>
    );
};


export default Desktop;