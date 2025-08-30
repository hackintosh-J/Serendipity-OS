
import React from 'react';
import { ActiveAssetInstance, AgentDefinition } from '../../types';
import { XIcon } from '../../assets/icons';
import { motion } from 'framer-motion';

interface AssetViewerProps {
  asset: ActiveAssetInstance;
  agent: AgentDefinition;
  updateState: (newState: any) => void;
  close: () => void;
}

const viewerVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
};


const AssetViewer: React.FC<AssetViewerProps> = ({ asset, agent, updateState, close }) => {
  const AgentComponent = agent.component;

  return (
    <motion.div
      layoutId={`asset-card-${asset.id}`}
      variants={viewerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      transition={{ type: 'spring', damping: 30, stiffness: 250 }}
      className="fixed inset-0 bg-gray-100 z-50 flex flex-col"
      aria-modal="true"
      role="dialog"
    >
      <header 
        className="h-14 flex-shrink-0 bg-white/80 backdrop-blur-lg flex items-center justify-between px-4 border-b border-gray-200/80"
      >
        <div className="flex items-center space-x-3">
            <agent.icon className="w-6 h-6 text-gray-700" />
            <span className="font-semibold text-lg text-gray-800">{asset.name}</span>
        </div>
        <button 
          onClick={close} 
          className="p-2 rounded-full hover:bg-gray-200 text-gray-500 hover:text-gray-800 transition-colors" 
          title="关闭"
          aria-label="关闭视图"
        >
            <XIcon className="w-6 h-6" />
        </button>
      </header>
      <div className="flex-grow p-4 overflow-y-auto">
        <AgentComponent instance={asset} updateState={updateState} close={close} />
      </div>
    </motion.div>
  );
};

export default AssetViewer;