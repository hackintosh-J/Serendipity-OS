


import React, { useMemo } from 'react';
import { useOS } from '../../contexts/OSContext';
import { motion } from 'framer-motion';

const GlanceView: React.FC = () => {
  const { osState, viewAsset } = useOS();
  const { desktopAssetOrder, activeAssets, installedAgents, ui: { aiPanelState } } = osState;
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
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-foreground mb-6">速览</h1>
        <motion.div layout className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-4">
          {orderedAssets.map(asset => {
            const agentDef = installedAgents[asset.agentId];
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
    </motion.div>
  );
};

export default GlanceView;
