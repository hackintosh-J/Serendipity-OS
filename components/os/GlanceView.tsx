

import React, { useState, useMemo } from 'react';
import { useOS } from '../../contexts/OSContext';
import { motion, AnimatePresence } from 'framer-motion';
import GlanceBubble from './GlanceBubble';

const AIStatusIndicator: React.FC = () => {
    const { osState } = useOS();
    const { insightGenerationStatus, insightGenerationMessage } = osState.ui;

    const isVisible = insightGenerationStatus === 'generating' || insightGenerationStatus === 'error';

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, y: -20, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                    exit={{ opacity: 0, y: -20, height: 0 }}
                    className="w-full flex justify-center px-4 pt-4 sticky top-0 z-10"
                >
                    <div className={`max-w-md w-full backdrop-blur-lg rounded-full shadow-md text-sm flex items-center justify-center p-3 space-x-2 ${
                        insightGenerationStatus === 'error' ? 'bg-destructive/80 text-white' : 'bg-card-glass text-foreground'
                    }`}>
                         {insightGenerationStatus === 'generating' && (
                             <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                         )}
                        <span>{insightGenerationMessage || 'AI 正在处理...'}</span>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

const GlanceView: React.FC = () => {
  const { osState, viewAsset } = useOS();
  const { desktopAssetOrder, activeAssets, installedAgents, ui: { aiPanelState } } = osState;
  const isAiPanelOpen = aiPanelState === 'panel';
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const orderedAssets = useMemo(() => {
    // AI sorting is reflected here
    return desktopAssetOrder.map(id => activeAssets[id]).filter(Boolean);
  }, [desktopAssetOrder, activeAssets]);

  const handleBackgroundClick = () => {
    setExpandedId(null);
  };

  return (
    <motion.div
      className="h-full w-full overflow-y-auto overscroll-y-contain"
      style={{ touchAction: 'pan-y', willChange: 'transform' }}
      animate={{ paddingBottom: isAiPanelOpen ? 'calc(55vh + 1.5rem)' : '7rem' }}
      transition={{ type: 'spring', damping: 30, stiffness: 200 }}
      onClick={handleBackgroundClick}
    >
      <AIStatusIndicator />
      <motion.div
        layout
        transition={{ type: 'spring', damping: 25, stiffness: 120 }}
        className="max-w-3xl min-h-full mx-auto flex flex-wrap gap-4 justify-center items-center content-center p-8"
      >
        {orderedAssets.map(asset => {
          const agentDef = installedAgents[asset.agentId];
          if (!agentDef) return null;

          return (
            <GlanceBubble
              key={asset.id}
              asset={asset}
              agent={agentDef}
              isExpanded={expandedId === asset.id}
              onClick={() => setExpandedId(expandedId === asset.id ? null : asset.id)}
              onView={() => viewAsset(asset.id)}
            />
          );
        })}
      </motion.div>
    </motion.div>
  );
};

export default GlanceView;
