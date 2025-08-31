import React from 'react';
import { ActiveAssetInstance } from '../types';
import { useOS } from '../contexts/OSContext';
import { astService } from '../services/astService';
import { CloudIcon, DownloadIcon, TrashIcon, CalculatorIcon } from './icons';
import { motion } from 'framer-motion';

interface AgentBubbleProps {
  asset: ActiveAssetInstance;
}

const cardVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.5 },
};

const LiveClockPreview: React.FC = () => {
    const [time, setTime] = React.useState(new Date());
    React.useEffect(() => {
        const timerId = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timerId);
    }, []);
    return (
        <div className="flex items-center justify-center text-card-foreground">
            <p className="text-3xl font-mono tabular-nums">
                {time.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
            </p>
        </div>
    );
};

const AgentBubble: React.FC<AgentBubbleProps> = ({ asset }) => {
  const { osState, viewAsset, dispatch, deleteAsset } = useOS();
  const agentDef = osState.installedAgents[asset.agentId];

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

  const handleCardClick = (e: React.MouseEvent) => {
    // Prevent click from triggering when a button inside is clicked
    if ((e.target as HTMLElement).closest('button')) {
        return;
    }
    viewAsset(asset.id);
  };
  
  const CardPreview: React.FC = () => {
    if (!asset.state) {
        return <p className="text-sm text-destructive">资产状态错误。</p>;
    }

    switch(asset.agentId) {
        case 'agent.system.memo': {
            const content = asset.state.content || '';
            return <p className="text-sm text-muted-foreground whitespace-pre-wrap break-words overflow-hidden">{content.substring(0, 200)}{content.length > 200 ? '...' : ''}</p>;
        }
        case 'agent.system.browser':
             return <p className="text-sm text-muted-foreground italic">一个安全的沙盒化浏览器。</p>;
        case 'agent.system.weather':
            if (!asset.state.data) {
                return <p className="text-sm text-muted-foreground italic">向AI提问以获取天气数据，例如：“{asset.state.location}的天气怎么样？”</p>;
            }
            const weatherData = asset.state.data;
            return (
                <div className="flex items-center space-x-4">
                    <CloudIcon className="w-10 h-10 text-accent" />
                    <div>
                        <p className="text-2xl font-semibold text-card-foreground">{weatherData.temp.toFixed(0)}°</p>
                        <p className="text-muted-foreground">{asset.state.location} - {weatherData.condition}</p>
                    </div>
                </div>
            );
        case 'agent.system.help':
            return <p className="text-sm text-muted-foreground italic">操作指南和核心理念介绍。</p>;
        case 'agent.system.clock':
            return <LiveClockPreview />;
        case 'agent.system.calculator':
            return (
                 <div className="flex items-center space-x-4 text-card-foreground">
                    <CalculatorIcon className="w-10 h-10 text-primary" />
                    <p className="text-lg">一个标准的计算器。</p>
                </div>
            );
        case 'agent.system.calendar':
            return <p className="text-sm text-muted-foreground italic">管理您的日程和事件。</p>;
        case 'agent.system.todo': {
            const todos = asset.state.todos || [];
            const remaining = todos.filter((t: any) => !t.completed).length;
            return <p className="text-sm text-muted-foreground">{remaining > 0 ? `还有 ${remaining} 项待办` : '所有任务已完成！'}</p>;
        }
        case 'agent.system.insight': {
            return <p className="text-sm text-muted-foreground italic">{asset.state.content || 'AI正在为您准备惊喜...'}</p>;
        }
        default:
            return <p className="text-sm text-muted-foreground">无法显示预览。</p>
    }
  }

  if (!agentDef) return null;
  
  const isMinimalPreview = agentDef.size === 'small';

  const containerClasses = 'relative w-full h-full bg-card-glass backdrop-blur-xl rounded-2xl shadow-lg p-4 cursor-pointer flex flex-col transition-shadow duration-300 hover:shadow-primary/30';

  return (
    <motion.div
      layoutId={`asset-bubble-${asset.id}`}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      transition={{ type: 'spring', duration: 0.5 }}
      className={containerClasses}
      onClick={handleCardClick}
      aria-label={`打开 ${asset.name}`}
      role="button"
    >
      <header data-is-bubble-header="true" className="flex justify-between items-start mb-3 flex-shrink-0">
        <div className="flex items-center space-x-3 min-w-0">
          {!isMinimalPreview && (
            <div className="w-10 h-10 bg-secondary rounded-lg shadow-inner flex items-center justify-center flex-shrink-0">
              <agentDef.icon className="w-6 h-6 text-secondary-foreground" />
            </div>
          )}
          <h3 className="font-semibold text-card-foreground truncate">{asset.name}</h3>
        </div>
        <div className="flex items-center space-x-1 flex-shrink-0 ml-2">
             <button
              onClick={handleExport}
              className="p-2 rounded-full text-muted-foreground hover:bg-secondary hover:text-primary transition-colors"
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

      <main className={`flex-grow min-h-0 flex items-center ${isMinimalPreview ? 'justify-center' : ''} overflow-hidden pointer-events-none`}>
        <CardPreview />
      </main>
      
      <footer className="text-xs text-muted-foreground/80 mt-2 self-end flex-shrink-0 pointer-events-none">
        更新于: {new Date(asset.updatedAt).toLocaleTimeString()}
      </footer>
    </motion.div>
  );
};

export default AgentBubble;