

import React from 'react';
import { OSState, ModalType, AgentDefinition, AIPanelState, AgentComponentProps } from './types';
import { MemoAgent, BrowserAgent, WeatherAgent, HelpAgent, ClockAgent, CalculatorAgent, CalendarAgent, TodoAgent, MediaPlayerAgent, CameraAgent, PhotosAgent } from './components/agents/index';
import { MemoIcon, BrowserIcon, CloudIcon, HelpCircleIcon, ClockIcon, CalculatorIcon, CalendarIcon, CheckSquareIcon, StarIcon, SparklesIcon, DownloadIcon, PlayIcon, CameraIcon, ImageIcon } from './assets/icons';
import Button from './components/shared/Button';

// --- AI Insight Agent Component ---
// Defined here to avoid creating new files, respecting the project constraints.
const InsightAgentComponent: React.FC<AgentComponentProps> = ({ instance, updateState, close, dispatch }) => {
    const { state } = instance;
    const { content, generated_image } = state;

    const handleSetWallpaper = () => {
        if(generated_image) {
            const wallpaperUrl = `data:image/jpeg;base64,${generated_image}`;
            dispatch({ type: 'UPDATE_SETTINGS', payload: { wallpaper: wallpaperUrl } });
            updateState({ ...state, wallpaper_feedback: '壁纸已设置！' });
        }
    };
    
    const handleArchive = () => {
        dispatch({ type: 'ARCHIVE_INSIGHT', payload: { assetId: instance.id } });
        close();
    };

    // FIX: Replaced JSX with React.createElement to compile in a .ts file.
    return React.createElement('div', { className: "p-4 bg-transparent rounded-lg -m-4 text-card-foreground" },
        React.createElement('h2', { className: "text-xl font-bold mb-4" }, instance.name),
        React.createElement('p', { className: "leading-relaxed mb-6 whitespace-pre-wrap" }, content),
        generated_image && React.createElement('div', { className: "space-y-4" },
            React.createElement('img', { src: `data:image/jpeg;base64,${generated_image}`, alt: "AI-generated content", className: "w-full rounded-lg shadow-md" }),
            React.createElement('div', { className: 'flex space-x-4' },
                React.createElement(Button, { onClick: handleSetWallpaper, children: "设置为壁纸" }),
                React.createElement(Button, { onClick: handleArchive, variant: 'secondary', icon: DownloadIcon, children: "存档" })
            )
        ),
        state.wallpaper_feedback && React.createElement('p', { className: "text-sm text-primary mt-4 font-semibold" }, state.wallpaper_feedback)
    );
};


const memoAgent: AgentDefinition = {
    id: 'agent.system.memo',
    name: '备忘录',
    description: '一个简单的文本备忘录。',
    icon: MemoIcon,
    component: MemoAgent,
    defaultState: { content: '' },
    size: 'medium',
};

const browserAgent: AgentDefinition = {
    id: 'agent.system.browser',
    name: '网页浏览器',
    description: '一个安全的沙盒化浏览器。',
    icon: BrowserIcon,
    component: BrowserAgent,
    defaultState: { url: 'about:blank', inputValue: '' },
    size: 'full',
};

const weatherAgent: AgentDefinition = {
    id: 'agent.system.weather',
    name: '天气',
    description: '查看当前天气和预报。',
    icon: CloudIcon,
    component: WeatherAgent,
    defaultState: { location: '北京', data: null, lastUpdated: null },
    size: 'small',
};

const helpAgent: AgentDefinition = {
    id: 'agent.system.help',
    name: '使用指南',
    description: '了解 Serendipity OS 的核心理念和使用方法。',
    icon: HelpCircleIcon,
    component: HelpAgent,
    defaultState: {},
    size: 'full',
};

const clockAgent: AgentDefinition = {
    id: 'agent.system.clock',
    name: '时钟',
    description: '显示当前时间。',
    icon: ClockIcon,
    component: ClockAgent,
    defaultState: {},
    size: 'small',
};

const calculatorAgent: AgentDefinition = {
    id: 'agent.system.calculator',
    name: '计算器',
    description: '执行基本的数学计算。',
    icon: CalculatorIcon,
    component: CalculatorAgent,
    defaultState: { display: '0', firstOperand: null, operator: null, waitingForSecondOperand: false },
    size: 'medium',
};

const calendarAgent: AgentDefinition = {
    id: 'agent.system.calendar',
    name: '日历',
    description: '管理您的日程和待办事项。',
    icon: CalendarIcon,
    component: CalendarAgent,
    defaultState: { events: {}, viewDate: new Date().toISOString() },
    size: 'full',
};

const todoAgent: AgentDefinition = {
    id: 'agent.system.todo',
    name: '待办清单',
    description: '跟踪您的任务。',
    icon: CheckSquareIcon,
    component: TodoAgent,
    defaultState: { todos: [] },
    size: 'medium',
};

const mediaPlayerAgent: AgentDefinition = {
    id: 'agent.system.media_player',
    name: '媒体播放器',
    description: '播放本地音频和视频文件。',
    icon: PlayIcon,
    component: MediaPlayerAgent,
    defaultState: { storageKey: null, fileName: null, fileType: null },
    size: 'medium',
};

const cameraAgent: AgentDefinition = {
    id: 'agent.system.camera',
    name: 'AI相机',
    description: '捕捉照片并保存到您的相册。',
    icon: CameraIcon,
    component: CameraAgent,
    defaultState: {},
    size: 'medium',
};

const photosAgent: AgentDefinition = {
    id: 'agent.system.photos',
    name: '智能相册',
    description: '存储和浏览您拍摄的照片。',
    icon: ImageIcon,
    component: PhotosAgent,
    defaultState: { photos: [] },
    size: 'full',
};


const insightAgent: AgentDefinition = {
    id: 'agent.system.insight',
    name: 'AI洞察',
    description: '由AI主动生成的惊喜和建议。',
    icon: StarIcon,
    component: InsightAgentComponent,
    defaultState: { content: 'AI正在为您准备惊喜...', type: null, image_prompt: null, generated_image: null, generationStatus: 'complete' },
    size: 'medium',
};

export const PRE_INSTALLED_AGENTS: { [key: string]: AgentDefinition } = {
    [memoAgent.id]: memoAgent,
    [browserAgent.id]: browserAgent,
    [weatherAgent.id]: weatherAgent,
    [clockAgent.id]: clockAgent,
    [calculatorAgent.id]: calculatorAgent,
    [calendarAgent.id]: calendarAgent,
    [todoAgent.id]: todoAgent,
    [mediaPlayerAgent.id]: mediaPlayerAgent,
    [cameraAgent.id]: cameraAgent,
    [photosAgent.id]: photosAgent,
    [helpAgent.id]: helpAgent,
    [insightAgent.id]: insightAgent
};

const initialWelcomeAssetState = {
    content: `# 欢迎来到 Serendipity OS！

这是一个基于AI原生交互和智能代理（Agent）范式的未来派移动操作系统。

## 核心理念

1.  **AI即界面:** 与AI助手直接对话来完成任务。
2.  **Agent即应用:** 每一个“气泡”都是一个包含数据和功能的应用实例（我们称之为“活动资产”或AA）。
3.  **情景即文件系统:** 系统会根据上下文自动组织你的资产，无需手动管理文件夹。

## 如何开始？

- **在桌面顶部下拉** 打开控制中心。
- **拖拽和缩放** 来探索您的空间画布 (仅限桌面端)。
- **点击Dock栏的AI图标** 与您的AI助手交谈。
- **在AI助手中点击“创建”** 查看所有可用的Agent并创建新的资产。
- **点击气泡** 打开它并进行交互。
- **请求AI** 例如 "北京的天气怎么样？" 或 "提醒我明天下午三点开会" 来与资产交互。

祝您探索愉快！`
};

const initialAssets = {
    'welcome-asset': {
        id: 'welcome-asset',
        agentId: 'agent.system.memo',
        name: '欢迎使用',
        state: initialWelcomeAssetState,
        position: { x: 20, y: 20 },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    },
    'clock-asset': {
        id: 'clock-asset',
        agentId: 'agent.system.clock',
        name: '时钟',
        state: {},
        position: { x: 400, y: 20 },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    },
    'weather-beijing-asset': {
        id: 'weather-beijing-asset',
        agentId: 'agent.system.weather',
        name: '北京天气',
        state: { location: '北京', data: null, lastUpdated: null },
        position: { x: 400, y: 180 },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    },
    'my-calendar': {
        id: 'my-calendar',
        agentId: 'agent.system.calendar',
        name: '我的日历',
        state: { events: {
            [new Date().toISOString().split('T')[0]]: [
                { time: '09:00', text: '开始新的一天！' }
            ]
        }, viewDate: new Date().toISOString() },
        position: { x: 20, y: 250 },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    },
    'shopping-list': {
        id: 'shopping-list',
        agentId: 'agent.system.todo',
        name: '购物清单',
        state: { todos: [ 
            {id: '1', text: '牛奶', completed: false}, 
            {id: '2', text: '面包', completed: true},
            {id: '3', text: '鸡蛋', completed: false} 
        ] },
        position: { x: 600, y: 80 },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    }
};

export const INITIAL_OS_STATE: OSState = {
  isInitialized: false,
  settings: {
    userName: '探索者',
    themeName: 'default',
    themeMode: 'light',
    geminiApiKey: null,
    wallpaper: null,
  },
  installedAgents: PRE_INSTALLED_AGENTS,
  activeAssets: initialAssets,
  desktopAssetOrder: Object.keys(initialAssets), // Initialize order from assets
  insightHistory: [],
  ui: {
    activeModal: ModalType.NONE,
    viewingAssetId: null,
    notifications: [],
    aiPanelState: 'closed',
    assetCreationData: null,
    isControlCenterOpen: false,
    currentView: 'desktop',
  },
};