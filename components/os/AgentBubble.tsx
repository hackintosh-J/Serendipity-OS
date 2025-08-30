import React, { useState, useEffect } from 'react';
import { ActiveAssetInstance } from '../../types';
import { useOS } from '../../contexts/OSContext';
import { astService } from '../../services/astService';
import { CloudIcon, DownloadIcon, ClockIcon, CalculatorIcon, TrashIcon } from '../../assets/icons';
import { motion } from 'framer-motion';

interface AgentBubbleProps {
  asset: ActiveAssetInstance;
}

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.98 },
  visible: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, height: 0, padding: 0, margin: 0, transition: { duration: 0.3 } },
};

const agentColorMapping: { [key: string]: { bg: string; text: string; } } = {
    'agent.system.memo': { bg: 'bg-yellow-100', text: 'text-yellow-800' },
    'agent.system.browser': { bg: 'bg-sky-100', text: 'text-sky-800' },
    'agent.system.weather': { bg: 'bg-cyan-100', text: 'text-cyan-800' },
    'agent.system.help': { bg: 'bg-emerald-100', text: 'text-emerald-800' },
    'agent.system.calculator': { bg: 'bg-orange-100', text: 'text-orange-800' },
    'agent.system.clock': { bg: 'bg-indigo-100', text: 'text-indigo-800' },
    'agent.system.calendar': { bg: 'bg-red-100', text: 'text-red-800' },
    'agent.system.todo': { bg: 'bg-green-100', text: 'text-green-800' },
    'default': { bg: 'bg-gray-100', text: 'text-gray-800' },
};

const LiveClockPreview: React.FC = () => {
    const [time, setTime] = useState(new Date());
    useEffect(() => {
        const timerId = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timerId);
    }, []);
    return (
        <div className="flex items-center justify-center text-gray-700">
            <p className="text-3xl font-mono tabular-nums">
                {time.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
            </p>
        </div>
    );
};

const AgentBubble: React.FC<AgentBubbleProps> = ({ asset }) => {
  const { osState, viewAsset, dispatch, deleteAsset } = useOS();
  const agentDef = osState.installedAgents[asset.agentId];

  // Simulate weather updates
  useEffect(() => {
    if (asset.agentId === 'agent.system.weather' && asset.state.data) {
        const thirtyMinutes = 30 * 60 * 1000;
        const lastUpdated = new Date(asset.state.lastUpdated).getTime();
        if (Date.now() - lastUpdated > thirtyMinutes) {
            const newData = { ...asset.state.data, temp: asset.state.data.temp + (Math.random() - 0.5) * 2 };
            dispatch({ type: 'UPDATE_ASSET_STATE', payload: { assetId: asset.id, newState: { ...asset.state, data: newData, lastUpdated: new Date().toISOString() } } });
        }
    }
  }, [asset.agentId, asset.id, asset.state, dispatch]);


  const handleExport = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (agentDef) {
        astService.exportAsset(asset, agentDef);
    }
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`您确定要删除“${asset.name}”吗？此操作无法撤销。`)) {
        deleteAsset(asset.id);
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
             return <p className="text-sm text-gray-600 italic">一个安全的沙盒化浏览器。</p>;
        case 'agent.system.weather':
            if (!asset.state.data) {
                return <p className="text-sm text-gray-600 italic">向AI提问以获取天气数据，例如：“{asset.state.location}的天气怎么样？”</p>;
            }
            const weatherData = asset.state.data;
            return (
                <div className="flex items-center space-x-4">
                    <CloudIcon className="w-10 h-10 text-blue-500" />
                    <div>
                        <p className="text-2xl font-semibold">{weatherData.temp.toFixed(0)}°</p>
                        <p className="text-gray-600">{asset.state.location} - {weatherData.condition}</p>
                    </div>
                </div>
            );
        case 'agent.system.help':
            return <p className="text-sm text-gray-600 italic">操作指南和核心理念介绍。</p>;
        case 'agent.system.clock':
            return <LiveClockPreview />;
        case 'agent.system.calculator':
            return (
                 <div className="flex items-center space-x-4 text-gray-700">
                    <CalculatorIcon className="w-10 h-10 text-orange-500" />
                    <p className="text-lg">一个标准的计算器。</p>
                </div>
            );
        case 'agent.system.calendar':
            return <p className="text-sm text-gray-600 italic">管理您的日程和事件。</p>;
        case 'agent.system.todo': {
            const todos = asset.state.todos || [];
            const remaining = todos.filter((t: any) => !t.completed).length;
            return <p className="text-sm text-gray-600">{remaining > 0 ? `还有 ${remaining} 项待办` : '所有任务已完成！'}</p>;
        }
        default:
            return <p className="text-sm text-gray-500">无法显示预览。</p>
    }
  }

  if (!agentDef) return null;
  
  const colors = agentColorMapping[asset.agentId] || agentColorMapping['default'];
  const isMinimalPreview = asset.agentId === 'agent.system.clock' || asset.agentId === 'agent.system.weather';

  return (
    <motion.div
      layoutId={`asset-bubble-${asset.id}`}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      transition={{ type: 'spring', duration: 0.5 }}
      whileHover={{ scale: 1.02, y: -4, transition: { type: 'spring', duration: 0.2 } }}
      className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg p-4 cursor-pointer flex flex-col transition-shadow duration-300 hover:shadow-purple-200/80 h-full"
      onClick={handleCardClick}
      aria-label={`打开 ${asset.name}`}
    >
      <header className="flex justify-between items-start mb-3">
        <div className="flex items-center space-x-3 min-w-0">
          {!isMinimalPreview && (
            <div className={`w-10 h-10 ${colors.bg} rounded-lg shadow-inner flex items-center justify-center flex-shrink-0`}>
              <agentDef.icon className={`w-6 h-6 ${colors.text}`} />
            </div>
          )}
          <h3 className="font-semibold text-gray-800 truncate">{asset.name}</h3>
        </div>
        <div className="flex items-center space-x-1 flex-shrink-0 ml-2">
             <button
              onClick={handleExport}
              className="p-2 rounded-full text-gray-400 hover:bg-purple-100 hover:text-purple-600 transition-colors"
              aria-label={`导出 ${asset.name}`}
            >
              <DownloadIcon className="w-4 h-4" />
            </button>
             <button
              onClick={handleDelete}
              className="p-2 rounded-full text-gray-400 hover:bg-red-100 hover:text-red-600 transition-colors"
              aria-label={`删除 ${asset.name}`}
            >
              <TrashIcon className="w-4 h-4" />
            </button>
        </div>
      </header>

      <main className={`flex-grow mb-3 min-h-[4rem] flex items-center ${isMinimalPreview ? 'justify-center' : ''}`}>
        <CardPreview />
      </main>
      
      <footer className="text-xs text-gray-400 mt-2 self-end">
        更新于: {new Date(asset.updatedAt).toLocaleTimeString()}
      </footer>
    </motion.div>
  );
};

export default AgentBubble;