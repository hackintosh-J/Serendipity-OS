import React from 'react';

// The state for a single Active Asset (AA) instance
export interface ActiveAssetInstance {
  id: string;
  agentId: string;
  name: string;
  state: any;
  position: { x: number; y: number }; // Retained for potential future spatial UIs, but unused in stream view.
  createdAt: string; // ISO 8601 date string
  updatedAt: string; // ISO 8601 date string
}

// The definition for an Agent
export interface AgentDefinition {
  id: string;
  name: string;
  description: string;
  icon: React.FC<{ className?: string }>;
  component: React.FC<{ instance: ActiveAssetInstance; updateState: (newState: any) => void; close: () => void; }>;
  defaultState: any;
}

// System-wide settings
export interface SystemSettings {
  userName: string;
  theme: 'light'; // For future expansion
}

export enum ModalType {
    NONE = 'NONE',
    SETTINGS = 'SETTINGS',
    AGENT_LIBRARY = 'AGENT_LIBRARY',
    CREATE_ASSET_PROMPT = 'CREATE_ASSET_PROMPT',
}

export type AIPanelState = 'closed' | 'input' | 'panel';

// UI-related state, not persisted in .ast files
export interface UIState {
    activeModal: ModalType;
    viewingAssetId: string | null;
    notifications: any[];
    aiPanelState: AIPanelState;
    assetCreationData: { agentId: string; agentName: string; } | null;
}

// The entire state of the operating system
export interface OSState {
  isInitialized: boolean;
  settings: SystemSettings;
  installedAgents: { [key: string]: AgentDefinition };
  activeAssets: { [key: string]: ActiveAssetInstance };
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
  | { type: 'PROMPT_CREATE_ASSET'; payload: { agentId: string; agentName: string; } }
  | { type: 'IMPORT_STATE'; payload: Partial<OSState> };

// Props for Agent components
export interface AgentComponentProps {
    instance: ActiveAssetInstance;
    updateState: (newState: any) => void;
    close: () => void;
}