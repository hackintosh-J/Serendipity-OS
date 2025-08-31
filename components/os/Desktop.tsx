


import React, { useMemo } from 'react';
import { useOS } from '../../contexts/OSContext';
import AgentBubble from '../../assets/AgentBubble';
import { motion } from 'framer-motion';

const Desktop: React.FC = () => {
    const { osState } = useOS();
    const { activeAssets, desktopAssetOrder, installedAgents, ui: { aiPanelState } } = osState;
    const isAiPanelOpen = aiPanelState === 'panel';

    const orderedAssets = useMemo(() => {
        return desktopAssetOrder.map(id => activeAssets[id]).filter(Boolean);
    }, [desktopAssetOrder, activeAssets]);

    return (
        <motion.div
            className="h-full w-full overflow-y-auto overscroll-behavior-y-contain px-4 sm:px-6 pt-4 sm:pt-6"
            style={{ touchAction: 'pan-y', willChange: 'transform' }}
            animate={{ paddingBottom: isAiPanelOpen ? 'calc(55vh + 1.5rem)' : '7rem' }}
            transition={{ type: 'spring', damping: 30, stiffness: 200 }}
        >
            <motion.div
                layout
                transition={{ type: 'spring', damping: 25, stiffness: 120 }}
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
            </motion.div>
        </motion.div>
    );
};


export default Desktop;
