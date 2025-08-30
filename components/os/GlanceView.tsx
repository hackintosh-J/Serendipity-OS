import React from 'react';
import { useOS } from '../../contexts/OSContext';
import { motion } from 'framer-motion';
import { ActiveAssetInstance } from '../../types';

const GlanceView: React.FC = () => {
  const { osState, viewAsset } = useOS();

  const sortedAssets = Object.values(osState.activeAssets)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    
  return (
    <div className="h-full w-full bg-gradient-to-br from-indigo-100 via-sky-100 to-teal-100 overflow-y-auto p-4 sm:p-6 md:p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">速览</h1>
        <motion.div layout className="grid grid-cols-4 gap-3">
          {sortedAssets.map(asset => {
            const agentDef = osState.installedAgents[asset.agentId];
            if (!agentDef) return null;

            return (
              <motion.div
                key={asset.id}
                layoutId={`asset-bubble-${asset.id}`}
                className="bg-white/80 rounded-2xl p-2 cursor-pointer text-center flex flex-col items-center justify-center aspect-square"
                onClick={() => viewAsset(asset.id)}
                whileHover={{ scale: 1.05 }}
              >
                <div className="w-10 h-10 bg-white/80 rounded-lg shadow-inner flex items-center justify-center mb-2">
                    <agentDef.icon className="w-6 h-6 text-gray-700" />
                </div>
                <p className="text-xs font-medium text-gray-800 truncate w-full px-1">{asset.name}</p>
                <p className="text-[10px] text-gray-500">{new Date(asset.createdAt).toLocaleDateString()}</p>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
};

export default GlanceView;