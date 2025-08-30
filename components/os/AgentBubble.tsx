import React from 'react';
import { ActiveAssetInstance, AgentDefinition } from '../../types.ts';
import { useOS } from '../../contexts/OSContext.tsx';
import { astService } from '../../services/astService.ts';
import { CloudIcon, DownloadIcon } from '../../assets/icons.tsx';
import { motion } from 'framer-motion';

interface AgentBubbleProps {
  asset: ActiveAssetInstance;
}

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.98 },
  visible: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, height: 0, padding: 0, margin: 0, transition: { duration: 0.3 } },
};

const AgentBubble: React.FC<AgentBubbleProps> = ({ asset }) => {
  const { osState, viewAsset } = useOS();
  const agentDef = osState.installedAgents[asset.agentId];

  const handleExport = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (agentDef) {
        astService.exportAsset(asset, agentDef);
    }
  }

  const handleCardClick = () => {
    viewAsset(asset.id);
  };
  
  const CardPreview: React.FC = () => {
    switch(asset.agentId) {
        case 'agent.system.memo':
            return <p className="text-sm text-gray-600 whitespace-pre-wrap break-words">{asset.state.content.substring(0, 200)}{asset.state.content.length > 200 ? '...' : ''}</p>;
        case 'agent.system.browser':
             return <p className="text-sm text-gray-600 italic">安全的沙盒化浏览器，用于在新标签页中打开网页。</p>;
        case 'agent.system.weather':
            const mockWeatherData = { temp: 24, condition: '晴' };
            const weatherData = asset.state.data || mockWeatherData;
            return (
                <div className="flex items-center space-x-4">
                    <CloudIcon className="w-10 h-10 text-blue-500" />
                    <div>
                        <p className="text-2xl font-semibold">{weatherData.temp}°</p>
                        <p className="text-gray-600">{asset.state.location} - {weatherData.condition}</p>
                    </div>
                </div>
            );
        case 'agent.system.help':
            return <p className="text-sm text-gray-600 italic">操作指南和核心理念介绍。</p>;
        default:
            return <p className="text-sm text-gray-500">无法显示预览。</p>
    }
  }

  if (!agentDef) return null;

  return (
    <motion.div
      layoutId={`asset-card-${asset.id}`}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      transition={{ type: 'spring', duration: 0.5 }}
      whileHover={{ scale: 1.02, y: -4 }}
      className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg p-4 cursor-pointer flex flex-col"
      onClick={handleCardClick}
      aria-label={`打开 ${asset.name}`}
    >
      <header className="flex justify-between items-start mb-3">
        <div className="flex items-center space-x-3 min-w-0">
          <div className="w-10 h-10 bg-white rounded-lg shadow-inner flex items-center justify-center flex-shrink-0">
            <agentDef.icon className="w-6 h-6 text-gray-700" />
          </div>
          <h3 className="font-semibold text-gray-800 truncate">{asset.name}</h3>
        </div>
        <div className="flex items-center space-x-1 flex-shrink-0 ml-2">
             <button
              onClick={handleExport}
              className="p-2 rounded-full text-gray-400 hover:bg-blue-100 hover:text-blue-600 transition-colors"
              aria-label={`导出 ${asset.name}`}
            >
              <DownloadIcon className="w-4 h-4" />
            </button>
        </div>
      </header>

      <main className="flex-grow mb-3 min-h-[4rem]">
        <CardPreview />
      </main>
      
      <footer className="text-xs text-gray-400 mt-2 self-end">
        更新于: {new Date(asset.updatedAt).toLocaleTimeString()}
      </footer>
    </motion.div>
  );
};

export default AgentBubble;