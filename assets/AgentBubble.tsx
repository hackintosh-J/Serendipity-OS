import React, { useState } from 'react';
import { ActiveAssetInstance } from '../types';
import { useOS } from '../contexts/OSContext';
import { astService } from '../services/astService';
import { DownloadIcon, TrashIcon } from './icons';
import { motion, AnimatePresence } from 'framer-motion';
import AgentPreview from '../components/os/AgentPreview';

interface AgentBubbleProps {
  asset: ActiveAssetInstance;
  className?: string;
}

const cardVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.5 },
};

const AgentBubble: React.FC<AgentBubbleProps> = ({ asset, className }) => {
  const { osState, viewAsset, deleteAsset } = useOS();
  const agentDef = osState.installedAgents[asset.agentId];
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  const handleExport = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (agentDef) {
        await astService.exportAsset(asset, agentDef);
    }
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsConfirmingDelete(true);
  }
  
  const confirmDelete = (e: React.MouseEvent) => {
      e.stopPropagation();
      deleteAsset(asset.id);
      setIsConfirmingDelete(false);
  };

  const cancelDelete = (e: React.MouseEvent) => {
      e.stopPropagation();
      setIsConfirmingDelete(false);
  };

  const handleCardClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button, input, a') || isConfirmingDelete) {
        return;
    }
    viewAsset(asset.id);
  };

  if (!agentDef) return null;
  
  const isMinimalPreview = agentDef.size === 'small';

  const containerClasses = 'relative w-full h-full bg-card-glass backdrop-blur-xl rounded-2xl shadow-lg p-4 flex flex-col transition-shadow duration-300';

  return (
    <motion.div
      className={className}
      layoutId={`asset-bubble-${asset.id}`}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      transition={{ type: 'spring', duration: 0.5 }}
    >
      <div
        className={containerClasses}
        onClick={handleCardClick}
        aria-label={`打开 ${asset.name}`}
        role="button"
      >
        <AnimatePresence>
        {isConfirmingDelete && (
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-destructive/90 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center p-4 z-10 text-white text-center"
            >
                <p className="font-semibold mb-4">确定要删除“{asset.name}”吗？</p>
                <div className="flex space-x-3">
                    <button onClick={cancelDelete} className="px-4 py-1.5 bg-white/20 rounded-md text-sm font-medium hover:bg-white/40 transition-colors">取消</button>
                    <button onClick={confirmDelete} className="px-4 py-1.5 bg-white text-destructive rounded-md text-sm font-bold hover:bg-gray-200 transition-colors">删除</button>
                </div>
            </motion.div>
        )}
        </AnimatePresence>

        <header className="flex justify-between items-start mb-3 flex-shrink-0">
          <div className="flex items-center space-x-3 min-w-0">
            {!isMinimalPreview && (
              <div className="w-10 h-10 bg-secondary rounded-lg shadow-inner flex items-center justify-center flex-shrink-0">
                <agentDef.icon className="w-6 h-6 text-secondary-foreground" />
              </div>
            )}
            <h3 className="font-semibold text-card-foreground truncate">{asset.name}</h3>
          </div>
          <div className="flex items-center space-x-0.5 flex-shrink-0 ml-2">
            <button
              onClick={handleExport}
              className="p-2 rounded-full text-muted-foreground hover:bg-secondary/80 hover:text-foreground transition-colors"
              aria-label={`导出 ${asset.name}`}
            >
              <DownloadIcon className="w-4 h-4" />
            </button>
            <button
              onClick={handleDelete}
              className="p-2 rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
              aria-label={`删除 ${asset.name}`}
            >
              <TrashIcon className="w-4 h-4" />
            </button>
          </div>
        </header>

        <main className={`flex-grow min-h-0 flex items-center ${isMinimalPreview ? 'justify-center' : ''} overflow-hidden`}>
          <AgentPreview asset={asset} />
        </main>
      </div>
    </motion.div>
  );
};

export default AgentBubble;