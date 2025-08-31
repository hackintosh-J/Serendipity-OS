
import React from 'react';

// The state for a single Active Asset (AA) instance
export interface ActiveAssetInstance {
  id: string;
  agentId: string;
  name: string;
  state: any;
  position: { x: number; y: number }; // Retained for potential future use, but not for grid desktop
  createdAt: string; // ISO 8601 date string
  updatedAt: string; // ISO 8601 date string
}

// The definition for an Agent
export interface AgentDefinition {
  id: string;
  name: string;
  description: string;
  icon: React.FC<{ className?: string }>;
  component: React.FC<AgentComponentProps>;
  defaultState: any;
  size?: 'small' | 'medium' | 'full'; // Added medium
}

// System-wide settings
export interface SystemSettings {
  userName: string;
  themeName: string; // e.g., 'default', 'nebula'
  themeMode: 'light' | 'dark';
  geminiApiKey: string | null;
  wallpaper: string | null; // Kept for compatibility, but themes can override
}

export enum ModalType {
    NONE = 'NONE',
    AGENT_LIBRARY = 'AGENT_LIBRARY',
    CREATE_ASSET_PROMPT = 'CREATE_ASSET_PROMPT',
    INSIGHT_HISTORY = 'INSIGHT_HISTORY',
}

export type AIPanelState = 'closed' | 'input' | 'panel';

// UI-related state, not persisted in .ast files
export interface UIState {
    activeModal: ModalType;
    viewingAssetId: string | null;
    notifications: any[];
    aiPanelState: AIPanelState;
    assetCreationData: { agentId: string; agentName: string; } | null;
    isControlCenterOpen: boolean;
    currentView: 'desktop' | 'glance'; // 'glance' is now obsolete but kept for type safety
}

// The entire state of the operating system
export interface OSState {
  isInitialized: boolean;
  settings: SystemSettings;
  installedAgents: { [key: string]: AgentDefinition };
  activeAssets: { [key: string]: ActiveAssetInstance };
  desktopAssetOrder: string[]; // <-- New property for draggable grid order
  insightHistory: ActiveAssetInstance[];
  ui: UIState;
}


// Actions for the state reducer
export type OSAction =
  | { type: 'INITIALIZE_STATE'; payload: OSState }
  | { type: 'CREATE_ASSET'; payload: { agentId: string; name: string; initialState?: any; position?: { x: number; y: number } } }
  | { type: 'UPDATE_ASSET_STATE'; payload: { assetId: string; newState: any } }
  | { type: 'UPDATE_ASSET_METADATA'; payload: { assetId: string; name?: string; position?: { x: number; y: number } } }
  | { type: 'DELETE_ASSET'; payload: { assetId: string } }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<SystemSettings> }
  | { type: 'VIEW_ASSET'; payload: { assetId: string } }
  | { type: 'CLOSE_ASSET_VIEW' }
  | { type: 'SET_ACTIVE_MODAL'; payload: ModalType }
  | { type: 'SET_AI_PANEL_STATE'; payload: AIPanelState }
  | { type: 'PROMPT_CREATE_ASSET'; payload: { agentId: string; agentName:string; } }
  | { type: 'IMPORT_STATE'; payload: Partial<OSState> }
  | { type: 'TOGGLE_CONTROL_CENTER'; payload: boolean }
  | { type: 'SET_CURRENT_VIEW'; payload: 'desktop' | 'glance' }
  | { type: 'ARCHIVE_INSIGHT'; payload: { assetId: string } }
  | { type: 'DELETE_ARCHIVED_INSIGHT'; payload: { assetId: string } }
  | { type: 'RESTORE_ARCHIVED_INSIGHT'; payload: { assetId: string } }
  | { type: 'UPDATE_ASSET_ORDER'; payload: string[] }; // <-- New action type

// Props for Agent components
export interface AgentComponentProps {
    instance: ActiveAssetInstance;
    updateState: (newState: any) => void;
    close: () => void;
    dispatch: React.Dispatch<OSAction>;
}
