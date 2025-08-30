import { OSState, ModalType, AgentDefinition, AIPanelState } from './types';
import { MemoAgent, BrowserAgent, WeatherAgent, HelpAgent } from './components/agents';
import { MemoIcon, BrowserIcon, CloudIcon, HelpCircleIcon } from './assets/icons';
import React from 'react';

const memoAgent: AgentDefinition = {
    id: 'agent.system.memo',
    name: '备忘录',
    description: '一个简单的文本备忘录。',
    icon: MemoIcon,
    component: MemoAgent,
    defaultState: { content: '' },
};

const browserAgent: AgentDefinition = {
    id: 'agent.system.browser',
    name: '网页浏览器',
    description: '一个安全的沙盒化浏览器。',
    icon: BrowserIcon,
    component: BrowserAgent,
    defaultState: { url: 'about:blank', inputValue: '' },
};

const weatherAgent: AgentDefinition = {
    id: 'agent.system.weather',
    name: '天气',
    description: '查看当前天气和预报。',
    icon: CloudIcon,
    component: WeatherAgent,
    defaultState: { location: '北京', data: null, lastUpdated: null },
};

const helpAgent: AgentDefinition = {
    id: 'agent.system.help',
    name: '使用指南',
    description: '了解 Serendipity OS 的核心理念和使用方法。',
    icon: HelpCircleIcon,
    component: HelpAgent,
    defaultState: {},
};


export const PRE_INSTALLED_AGENTS: { [key: string]: AgentDefinition } = {
    [memoAgent.id]: memoAgent,
    [browserAgent.id]: browserAgent,
    [weatherAgent.id]: weatherAgent,
    [helpAgent.id]: helpAgent
};

const initialWelcomeAssetState = {
    content: `# 欢迎来到 Serendipity OS！

这是一个基于AI原生交互和智能代理（Agent）范式的未来派移动操作系统。

## 核心理念

1.  **AI即界面:** 与AI助手直接对话来完成任务。
2.  **Agent即应用:** 每一个“气泡”都是一个包含数据和功能的应用实例（我们称之为“活动资产”或AA）。
3.  **情景即文件系统:** 系统会根据上下文自动组织你的资产，无需手动管理文件夹。

## 如何开始？

- **点击Dock栏的AI图标** 与您的AI助手交谈。
- **在AI助手中点击“创建”** 查看所有可用的Agent并创建新的资产。
- **点击卡片** 打开它并进行交互。
- **访问设置**（齿轮图标）来配置您的Gemini API密钥，这是激活AI功能所必需的。

祝您探索愉快！`
};

export const INITIAL_OS_STATE: OSState = {
  isInitialized: false,
  settings: {
    userName: '探索者',
    theme: 'light',
  },
  installedAgents: PRE_INSTALLED_AGENTS,
  activeAssets: {
    'welcome-asset': {
        id: 'welcome-asset',
        agentId: 'agent.system.memo',
        name: '欢迎使用',
        state: initialWelcomeAssetState,
        position: { x: 50, y: 100 },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    },
    'help-asset': {
        id: 'help-asset',
        agentId: 'agent.system.help',
        name: '操作指南',
        state: {},
        position: { x: 250, y: 150 },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    }
  },
  ui: {
    activeModal: ModalType.NONE,
    viewingAssetId: null,
    notifications: [],
    aiPanelState: 'closed',
    assetCreationData: null,
  },
};