import React from 'react';
import { ActiveAssetInstance, AgentDefinition } from '../../types';
// FIX: Import AnimatePresence from framer-motion.
import { motion, AnimatePresence } from 'framer-motion';
import AgentPreview from './AgentPreview';

interface GlanceBubbleProps {
    asset: ActiveAssetInstance;
    agent: AgentDefinition;
    isExpanded: boolean;
    onClick: () => void;
    onView: () => void;
}

const GlanceBubble: React.FC<GlanceBubbleProps> = ({ asset, agent, isExpanded, onClick, onView }) => {
    const sizeClasses = {
        small: { width: '5rem', height: '5rem' },     // 80px
        medium: { width: '7rem', height: '7rem' },    // 112px
        full: { width: '9rem', height: '9rem' },      // 144px
    };
    const expandedSize = { width: '20rem', height: '20rem' }; // 320px

    const bubbleSize = isExpanded ? expandedSize : (sizeClasses[agent.size || 'medium']);

    const handleBubbleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isExpanded) {
            onView(); // If already expanded, open the full view.
        } else {
            onClick(); // Otherwise, just expand it.
        }
    };

    return (
        <motion.div
            layoutId={`asset-bubble-${asset.id}`}
            onClick={handleBubbleClick}
            className={`flex-shrink-0 bg-card-glass backdrop-blur-xl shadow-lg cursor-pointer flex flex-col items-center justify-center p-2 transition-shadow duration-300 ease-in-out relative hover:shadow-xl`}
            style={{
                width: bubbleSize.width,
                height: bubbleSize.height,
            }}
            animate={{
                borderRadius: isExpanded ? '1.5rem' : '50%',
            }}
            transition={{ type: 'spring', damping: 25, stiffness: 170 }}
        >
            <AnimatePresence initial={false}>
                {isExpanded ? (
                    <motion.div 
                        key="content"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1, transition: { delay: 0.1, duration: 0.2 } }}
                        exit={{ opacity: 0, transition: { duration: 0.1 } }}
                        className="w-full h-full overflow-hidden flex flex-col p-2"
                    >
                        <header className="flex-shrink-0 flex items-center space-x-3 mb-2">
                            <div className="w-8 h-8 bg-secondary rounded-lg shadow-inner flex items-center justify-center flex-shrink-0">
                                <agent.icon className="w-5 h-5 text-secondary-foreground" />
                            </div>
                            <h3 className="font-semibold text-card-foreground truncate">{asset.name}</h3>
                        </header>
                        <main className="flex-grow min-h-0 flex items-center justify-center overflow-hidden">
                            <AgentPreview asset={asset} />
                        </main>
                    </motion.div>
                ) : (
                    <motion.div
                        key="icon"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1, transition: { delay: 0.1, duration: 0.2 } }}
                        exit={{ opacity: 0, transition: { duration: 0.1 } }}
                        className="flex flex-col items-center justify-center text-center"
                    >
                        <agent.icon className="w-1/3 h-1/3 text-foreground" />
                        <p className="text-xs font-medium text-foreground truncate w-full px-1 mt-2">{asset.name}</p>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default GlanceBubble;