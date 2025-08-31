import React, { useState, useEffect } from 'react';
import { ActiveAssetInstance } from '../../types';
import { useOS } from '../../contexts/OSContext';
import { CloudIcon, CalculatorIcon, CalendarIcon, CheckSquareIcon, ImageIcon, MicIcon, PlayIcon } from '../../assets/icons';
import { storageService } from '../../services/storageService';

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

const PhotosPreview: React.FC<{ photos: { storageKey: string }[] }> = ({ photos }) => {
    const [imageUrls, setImageUrls] = useState<string[]>([]);
    const recentPhotos = photos.slice(-4).reverse();

    useEffect(() => {
        let isMounted = true;
        const fetchImages = async () => {
            const urls = await Promise.all(
                recentPhotos.map(p => storageService.getItem<string>(p.storageKey))
            );
            if (isMounted) {
                setImageUrls(urls.filter((url): url is string => !!url));
            }
        };
        if (recentPhotos.length > 0) {
            fetchImages();
        }
        return () => { isMounted = false; };
    }, [JSON.stringify(recentPhotos.map(p => p.storageKey))]);

    if (photos.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                <ImageIcon className="w-10 h-10 mx-auto mb-2 text-primary" />
                <p className="text-sm">相册为空</p>
            </div>
        );
    }
    
    return (
        <div className="grid grid-cols-2 gap-1 w-full h-full p-1">
            {recentPhotos.map((photo, index) => (
                <div key={photo.storageKey || index} className="aspect-square bg-secondary rounded-md overflow-hidden">
                    {imageUrls[index] ? (
                        <img src={imageUrls[index]} className="w-full h-full object-cover" alt="photo preview" />
                    ) : (
                        <div className="w-full h-full bg-secondary animate-pulse"></div>
                    )}
                </div>
            ))}
        </div>
    );
};

interface AgentPreviewProps {
    asset: ActiveAssetInstance;
}

const AgentPreview: React.FC<AgentPreviewProps> = ({ asset }) => {
    const { dispatch } = useOS();

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

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
        case 'agent.system.photos': {
            const photos = asset.state.photos || [];
            return <PhotosPreview photos={photos} />;
        }
        case 'agent.system.voice_memo': {
            const recordings = asset.state.recordings || [];
            if (recordings.length === 0) {
                return <div className="text-center text-muted-foreground"><MicIcon className="w-10 h-10 mx-auto mb-2 text-primary" /><p>无录音</p></div>;
            }
            return (
                <div className="w-full space-y-1 pr-2">
                    {recordings.slice(-3).reverse().map((rec: any) => (
                        <div key={rec.id} className="flex items-center text-sm bg-secondary/50 p-1.5 rounded-md">
                            <PlayIcon className="w-4 h-4 mr-2 text-primary flex-shrink-0" />
                            <span className="text-muted-foreground truncate flex-grow">{rec.name}</span>
                            <span className="text-xs text-muted-foreground/80 flex-shrink-0 ml-2">{formatDuration(rec.duration)}</span>
                        </div>
                    ))}
                </div>
            );
        }
        default:
            return <p className="text-sm text-muted-foreground">无法显示预览。</p>
    }
};

export default AgentPreview;
