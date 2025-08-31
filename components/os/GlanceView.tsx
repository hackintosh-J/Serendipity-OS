
import React, { useState, useMemo } from 'react';
import { useOS } from '../../contexts/OSContext';
import { motion } from 'framer-motion';
import GlanceBubble from './GlanceBubble';

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