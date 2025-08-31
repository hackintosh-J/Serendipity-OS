import React from 'react';
import { ActiveAssetInstance } from '../types';
import { useOS } from '../contexts/OSContext';
import { astService } from '../services/astService';
import { CloudIcon, DownloadIcon, TrashIcon, CalculatorIcon, CalendarIcon, CheckSquareIcon } from './icons';
import { motion } from 'framer-motion';

interface AgentBubbleProps {
  asset: ActiveAssetInstance;
  className?: string;
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

const AgentBubble: React.FC<AgentBubbleProps> = ({ asset, className }) => {
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
    if ((e.target as HTMLElement).closest('button, input, a')) {
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
            const lines = content.split('\n').filter(line => line.trim() !== '');
            const previewText = lines.slice(0, 4).join('\n');
            const hasMore = lines.length > 4 || previewText.length < content.length;
            
            if (!previewText) {
                 return <p className="text-sm text-muted-foreground italic">空备忘录</p>;
            }

            return <p className="text-sm text-card-foreground whitespace-pre-wrap break-words overflow-hidden">{previewText}{hasMore ? '...' : ''}</p>;
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
        case 'agent.system.calendar': {
            const { events } = asset.state;
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const upcomingEvents = Object.entries(events)
                .flatMap(([dateStr, dateEvents]: [string, any[]]) => {
                    const eventDate = new Date(dateStr);
                    eventDate.setDate(eventDate.getDate() + 1); // Adjust for timezone issues if any
                    if (eventDate >= today) {
                        return dateEvents.map(event => ({ ...event, date: new Date(dateStr) }));
                    }
                    return [];
                })
                .sort((a, b) => a.date.getTime() + a.time.localeCompare(b.time) - (b.date.getTime() + b.time.localeCompare(a.time)))
                .slice(0, 3);
            
            if (upcomingEvents.length === 0) {
                 return <div className="text-center text-muted-foreground"><CalendarIcon className="w-10 h-10 mx-auto mb-2 text-primary" /><p>无 upcoming 日程</p></div>;
            }

            return (
                <div className="w-full space-y-2">
                    {upcomingEvents.map((event, index) => (
                        <div key={index} className="flex items-center text-sm">
                            <div className="font-semibold text-primary w-20 flex-shrink-0">{new Date(event.date).toLocaleDateString('zh-CN', {month: 'short', day: 'numeric'})} {event.time}</div>
                            <div className="text-muted-foreground truncate">{event.text}</div>
                        </div>
                    ))}
                </div>
            )
        }
        case 'agent.system.todo': {
            const todos = asset.state.todos || [];
            const handleToggle = (e: React.ChangeEvent<HTMLInputElement>, todoId: string) => {
                e.stopPropagation();
                const updatedTodos = todos.map((t: any) => t.id === todoId ? {...t, completed: !t.completed} : t);
                dispatch({ type: 'UPDATE_ASSET_STATE', payload: { assetId: asset.id, newState: { ...asset.state, todos: updatedTodos } } });
            }

            if (todos.length === 0) {
                return <div className="text-center text-muted-foreground"><CheckSquareIcon className="w-10 h-10 mx-auto mb-2 text-primary" /><p>所有任务已完成！</p></div>;
            }

            return (
                <div className="w-full space-y-2">
                    {todos.slice(0, 4).map((todo: any) => (
                        <div key={todo.id} className="flex items-center">
                            <input
                                type="checkbox"
                                checked={todo.completed}
                                onChange={(e) => handleToggle(e, todo.id)}
                                onClick={(e) => e.stopPropagation()}
                                className="h-4 w-4 rounded border-border text-primary focus:ring-primary cursor-pointer bg-secondary flex-shrink-0"
                            />
                            <span className={`ml-3 text-sm text-card-foreground truncate ${todo.completed ? 'line-through text-muted-foreground' : ''}`}>
                                {todo.text}
                            </span>
                        </div>
                    ))}
                    {todos.length > 4 && <p className="text-xs text-muted-foreground text-center mt-2">还有 {todos.length - 4} 项...</p>}
                </div>
            )
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
          <CardPreview />
        </main>
      </div>
    </motion.div>
  );
};

export default AgentBubble;