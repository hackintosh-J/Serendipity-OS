import React, { useMemo } from 'react';
import { useOS } from '../../contexts/OSContext';
import AgentBubble from './AgentBubble';
import { motion, AnimatePresence } from 'framer-motion';
import { ActiveAssetInstance } from '../../types';

const Desktop: React.FC = () => {
  const { osState } = useOS();

  const assetPriority = (asset: ActiveAssetInstance) => {
    if (asset.agentId === 'agent.system.clock' || asset.agentId === 'agent.system.weather' || asset.agentId === 'agent.system.calculator') return 0;
    return 1;
  };

  const sortedAssets = useMemo(() => Object.values(osState.activeAssets)
    .sort((a, b) => {
        const priorityA = assetPriority(a);
        const priorityB = assetPriority(b);
        if (priorityA !== priorityB) return priorityA - priorityB;
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    }), [osState.activeAssets]);

  return (
    <div className="h-full w-full bg-gradient-to-br from-rose-100 via-purple-100 to-indigo-100 overflow-y-auto p-4 sm:p-6">
      <motion.div 
        layout 
        className="max-w-3xl mx-auto grid grid-cols-2 gap-4 sm:gap-6"
      >
        <AnimatePresence>
          {sortedAssets.map(asset => {
            const agentDef = osState.installedAgents[asset.agentId];
            const sizeClass = agentDef?.size === 'small' ? 'col-span-1' : 'col-span-2';
            return (
              <motion.div key={asset.id} layout className={sizeClass}>
                <AgentBubble asset={asset} />
              </motion.div>
            )
          })}
        </AnimatePresence>
         {sortedAssets.length === 0 && (
            <div className="text-center py-20 col-span-2">
                <h2 className="text-xl font-semibold text-gray-700">空空如也</h2>
                <p className="text-gray-500 mt-2">点击下方的 AI 图标开始创建你的第一个智能资产吧！</p>
            </div>
        )}
      </motion.div>
    </div>
  );
};

export default Desktop;