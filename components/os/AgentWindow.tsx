import React from 'react';
import { ActiveAssetInstance, AgentDefinition, OSAction } from '../../types';
import { XIcon } from '../../assets/icons';
import { motion } from 'framer-motion';

interface AssetViewerProps {
  asset: ActiveAssetInstance;
  agent: AgentDefinition;
  updateState: (newState: any) => void;
  close: () => void;
  dispatch: React.Dispatch<OSAction>;
}

const viewerVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
};


const AssetViewer: React.FC<AssetViewerProps> = ({ asset, agent, updateState, close, dispatch }) => {
  const AgentComponent = agent.component;

  return (
    <motion.div
      layoutId={`asset-bubble-${asset.id}`}
      variants={viewerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      transition={{ type: 'spring', damping: 30, stiffness: 250 }}
      className="fixed inset-0 bg-gray-100 dark:bg-gray-900 z-50 flex flex-col"
      aria-modal="true"
      role="dialog"
    >
      <header 
        className="h-14 flex-shrink-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg flex items-center justify-between px-4 border-b border-gray-200/80 dark:border-gray-700/80"
      >
        <div className="flex items-center space-x-3">
            {asset.agentId !== 'agent.system.clock' && <agent.icon className="w-6 h-6 text-gray-700 dark:text-gray-300" />}
            <span className="font-semibold text-lg text-gray-800 dark:text-gray-200">{asset.name}</span>
        </div>
        <button 
          onClick={close} 
          className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-100 transition-colors" 
          title="关闭"
          aria-label="关闭视图"
        >
            <XIcon className="w-6 h-6" />
        </button>
      </header>
      <div className="flex-grow p-4 overflow-y-auto overscroll-behavior-y-contain">
        <AgentComponent instance={asset} updateState={updateState} close={close} dispatch={dispatch} />
      </div>
    </motion.div>
  );
};

export default AssetViewer;