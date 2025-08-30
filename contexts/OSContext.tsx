import React, { createContext, useContext, useReducer, useEffect, useCallback, ReactNode } from 'react';
import { OSState, OSAction, ActiveAssetInstance, ModalType, AIPanelState } from '../types';
import { INITIAL_OS_STATE } from '../constants';
import { geminiService } from '../services/geminiService';

const OS_STATE_LOCAL_STORAGE_KEY = 'serendipity_os_state';

// Reducer function to manage state transitions
const osReducer = (state: OSState, action: OSAction): OSState => {
  switch (action.type) {
    case 'INITIALIZE_STATE':
        return { ...action.payload, isInitialized: true };

    case 'CREATE_ASSET': {
      const { agentId, name, initialState, position } = action.payload;
      const agent = state.installedAgents[agentId];
      if (!agent) return state;
      const newAsset: ActiveAssetInstance = {
        id: `aa-${crypto.randomUUID()}`,
        agentId,
        name,
        state: initialState ?? agent.defaultState,
        position: position ?? { x: Math.random() * 300, y: Math.random() * 400 },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      return {
        ...state,
        activeAssets: { ...state.activeAssets, [newAsset.id]: newAsset },
      };
    }
    
    case 'UPDATE_ASSET_STATE': {
      const { assetId, newState } = action.payload;
      const asset = state.activeAssets[assetId];
      if (!asset) return state;
      const updatedAsset = { ...asset, state: newState, updatedAt: new Date().toISOString() };
      return {
        ...state,
        activeAssets: { ...state.activeAssets, [assetId]: updatedAsset },
      };
    }

    case 'UPDATE_ASSET_METADATA': {
      const { assetId, name, position } = action.payload;
      const asset = state.activeAssets[assetId];
      if (!asset) return state;
      const updatedAsset = {
        ...asset,
        name: name ?? asset.name,
        position: position ?? asset.position,
        updatedAt: new Date().toISOString(),
      };
      return {
        ...state,
        activeAssets: { ...state.activeAssets, [assetId]: updatedAsset },
      };
    }

    case 'DELETE_ASSET': {
      const { assetId } = action.payload;
      
      const newActiveAssets = { ...state.activeAssets };
      delete newActiveAssets[assetId];
      
      const newUIState = state.ui.viewingAssetId === assetId 
        ? { ...state.ui, viewingAssetId: null } 
        : state.ui;
        
      return { 
        ...state,
        activeAssets: newActiveAssets,
        ui: newUIState,
      };
    }

    case 'UPDATE_SETTINGS':
      return {
        ...state,
        settings: { ...state.settings, ...action.payload },
      };
      
    case 'VIEW_ASSET':
      return { ...state, ui: { ...state.ui, viewingAssetId: action.payload.assetId } };
      
    case 'CLOSE_ASSET_VIEW':
      return { ...state, ui: { ...state.ui, viewingAssetId: null } };

    case 'SET_ACTIVE_MODAL': {
        const shouldClearData = action.payload === ModalType.NONE;
        return {
          ...state,
          ui: {
            ...state.ui,
            activeModal: action.payload,
            aiPanelState: 'closed',
            assetCreationData: shouldClearData ? null : state.ui.assetCreationData
          },
        };
    }

    case 'PROMPT_CREATE_ASSET':
        return {
            ...state,
            ui: {
                ...state.ui,
                activeModal: ModalType.CREATE_ASSET_PROMPT,
                assetCreationData: action.payload,
            }
        };

    case 'SET_AI_PANEL_STATE':
        return { ...state, ui: { ...state.ui, aiPanelState: action.payload, activeModal: ModalType.NONE }};
    
    case 'TOGGLE_CONTROL_CENTER':
        return { ...state, ui: { ...state.ui, isControlCenterOpen: action.payload }};

    case 'SET_CURRENT_VIEW':
        return { ...state, ui: { ...state.ui, currentView: action.payload }};
        
    case 'ARCHIVE_INSIGHT': {
      const { assetId } = action.payload;
      const asset = state.activeAssets[assetId];
      if (!asset) return state;

      const newActiveAssets = { ...state.activeAssets };
      delete newActiveAssets[assetId];

      const newInsightHistory = [...state.insightHistory, asset];
      
      return {
        ...state,
        activeAssets: newActiveAssets,
        insightHistory: newInsightHistory,
      };
    }

    case 'DELETE_ARCHIVED_INSIGHT': {
        const { assetId } = action.payload;
        return {
            ...state,
            insightHistory: state.insightHistory.filter(asset => asset.id !== assetId),
        };
    }

    case 'RESTORE_ARCHIVED_INSIGHT': {
        const { assetId } = action.payload;
        const asset = state.insightHistory.find(a => a.id === assetId);
        if (!asset) return state;
        
        return {
            ...state,
            activeAssets: { ...state.activeAssets, [assetId]: asset },
            insightHistory: state.insightHistory.filter(a => a.id !== assetId),
        };
    }


    case 'IMPORT_STATE': {
        const importedState = action.payload;
        // Merge assets and settings
        const newActiveAssets = { ...state.activeAssets, ...importedState.activeAssets };
        const newSettings = { ...state.settings, ...importedState.settings };
        const newInsightHistory = [...state.insightHistory, ...(importedState.insightHistory || [])];
        
        // Re-hydrate imported agent definitions to ensure they have their functions.
        const newInstalledAgents = { ...state.installedAgents };
        if (importedState.installedAgents) {
            Object.keys(importedState.installedAgents).forEach(agentId => {
                const existingAgent = state.installedAgents[agentId];
                const importedAgent = importedState.installedAgents![agentId];
                if (existingAgent) {
                    newInstalledAgents[agentId] = { ...existingAgent, ...importedAgent };
                } else {
                    console.warn(`Imported an agent definition for "${importedAgent.name}" (${agentId}) which is not supported by this version of the OS. It may not function correctly.`);
                    newInstalledAgents[agentId] = importedAgent;
                }
            });
        }

        return {
            ...state,
            settings: newSettings,
            installedAgents: newInstalledAgents,
            activeAssets: newActiveAssets,
            insightHistory: newInsightHistory,
        };
    }

    default:
      return state;
  }
};


// Context
interface IOSContext {
  osState: OSState;
  dispatch: React.Dispatch<OSAction>;
  createAsset: (agentId: string, name: string, initialState?: any, position?: { x: number, y: number }) => void;
  deleteAsset: (assetId: string) => void;
  viewAsset: (assetId: string) => void;
  closeAssetView: () => void;
  setActiveModal: (modal: ModalType) => void;
  setAIPanelState: (state: AIPanelState) => void;
  setControlCenterOpen: (isOpen: boolean) => void;
  setCurrentView: (view: 'desktop' | 'glance') => void;
  toggleTheme: () => void;
  triggerInsightGeneration: () => Promise<void>;
  deleteArchivedInsight: (assetId: string) => void;
  restoreArchivedInsight: (assetId: string) => void;
}

const OSContext = createContext<IOSContext | undefined>(undefined);

// Provider Component
export const OSProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [osState, dispatch] = useReducer(osReducer, INITIAL_OS_STATE);

  useEffect(() => {
    try {
      const savedStateJSON = localStorage.getItem(OS_STATE_LOCAL_STORAGE_KEY);
      if (savedStateJSON) {
        const savedState = JSON.parse(savedStateJSON);
        
        const rehydratedState: OSState = {
          ...INITIAL_OS_STATE,
          settings: { ...INITIAL_OS_STATE.settings, ...(savedState.settings || {}) },
          activeAssets: savedState.activeAssets || {},
          insightHistory: savedState.insightHistory || [],
          installedAgents: INITIAL_OS_STATE.installedAgents,
          ui: { ...INITIAL_OS_STATE.ui }, // UI state is never persisted
        };

        dispatch({ type: 'INITIALIZE_STATE', payload: rehydratedState });
      } else {
        dispatch({ type: 'INITIALIZE_STATE', payload: INITIAL_OS_STATE });
      }
    } catch (error) {
      console.error("Failed to load state from localStorage:", error);
      dispatch({ type: 'INITIALIZE_STATE', payload: INITIAL_OS_STATE });
    }
  }, []);

  useEffect(() => {
    if (osState.isInitialized) {
      try {
        const stateToSave = {
          settings: osState.settings,
          activeAssets: osState.activeAssets,
          insightHistory: osState.insightHistory,
        };
        localStorage.setItem(OS_STATE_LOCAL_STORAGE_KEY, JSON.stringify(stateToSave));
      } catch (error) {
        console.error("Failed to save state to localStorage:", error);
      }
    }
  }, [osState]);
  
  const generateAndCreateInsight = useCallback(async () => {
    const { settings } = osState;
    if (!settings.geminiApiKey) {
        console.log("Cannot generate insight without Gemini API key.");
        return;
    }

    // Prevents multiple generations at once. A proper implementation would use a loading state.
    if (Object.values(osState.activeAssets).some(a => a.name === '正在生成...')) {
        return;
    }
    
    const loadingAssetId = `loading-${crypto.randomUUID()}`;
    // Create a temporary placeholder
    dispatch({
        type: 'CREATE_ASSET',
        payload: {
            agentId: 'agent.system.insight',
            name: '正在生成...',
            initialState: { content: 'AI正在为您准备惊喜...' }
        }
    });

    const insight = await geminiService.generateInsight(osState, settings.geminiApiKey);
    
    // Find and delete the placeholder. A more robust solution might update it.
    const loadingAsset = Object.values(osState.activeAssets).find(a => a.name === '正在生成...');
    if (loadingAsset) {
        dispatch({ type: 'DELETE_ASSET', payload: { assetId: loadingAsset.id }});
    }

    if (insight && insight.type !== 'error') {
        let generated_image = null;
        if (insight.image_prompt) {
            generated_image = await geminiService.generateImage(insight.image_prompt, settings.geminiApiKey);
        }

        dispatch({ 
            type: 'CREATE_ASSET', 
            payload: {
                agentId: 'agent.system.insight',
                name: insight.title || '来自AI的灵感',
                initialState: { ...insight, generated_image },
            }
        });
    }
  }, [osState, dispatch]);

  useEffect(() => {
    if (osState.isInitialized) {
        const hasInsights = Object.values(osState.activeAssets).some(a => a.agentId === 'agent.system.insight');
        const hasArchivedInsights = osState.insightHistory.length > 0;
        if (!hasInsights && !hasArchivedInsights) {
            console.log("Generating initial AI insight on first load...");
            generateAndCreateInsight();
        }
    }
  }, [osState.isInitialized, osState.insightHistory.length, osState.activeAssets, generateAndCreateInsight]);

  // Effect to watch for agent-initiated system actions
  useEffect(() => {
    if (!osState.isInitialized) return;

    Object.values(osState.activeAssets).forEach(asset => {
        if (asset.agentId === 'agent.system.insight' && asset.state.action === 'SET_WALLPAPER') {
            dispatch({ type: 'UPDATE_SETTINGS', payload: { wallpaper: asset.state.wallpaperUrl } });
            // Clear the action from the asset state to prevent re-triggering
            dispatch({ 
                type: 'UPDATE_ASSET_STATE', 
                payload: { assetId: asset.id, newState: { ...asset.state, action: null } }
            });
        }
    });

  }, [osState.activeAssets, osState.isInitialized]);


  const createAsset = useCallback((agentId: string, name: string, initialState?: any, position?: { x: number, y: number }) => {
    dispatch({ type: 'CREATE_ASSET', payload: { agentId, name, initialState, position } });
  }, []);

  const deleteAsset = useCallback((assetId: string) => {
    dispatch({ type: 'DELETE_ASSET', payload: { assetId } });
  }, []);
  
  const deleteArchivedInsight = useCallback((assetId: string) => {
    dispatch({ type: 'DELETE_ARCHIVED_INSIGHT', payload: { assetId } });
  }, []);

  const restoreArchivedInsight = useCallback((assetId: string) => {
    dispatch({ type: 'RESTORE_ARCHIVED_INSIGHT', payload: { assetId } });
  }, []);

  const viewAsset = useCallback((assetId: string) => {
    dispatch({ type: 'VIEW_ASSET', payload: { assetId } });
  }, []);

  const closeAssetView = useCallback(() => {
    dispatch({ type: 'CLOSE_ASSET_VIEW' });
  }, []);
  
  const setActiveModal = useCallback((modal: ModalType) => {
    dispatch({ type: 'SET_ACTIVE_MODAL', payload: modal });
  }, []);

  const setAIPanelState = useCallback((state: AIPanelState) => {
    dispatch({ type: 'SET_AI_PANEL_STATE', payload: state });
  }, []);

  const setControlCenterOpen = useCallback((isOpen: boolean) => {
      dispatch({ type: 'TOGGLE_CONTROL_CENTER', payload: isOpen });
  }, []);

  const setCurrentView = useCallback((view: 'desktop' | 'glance') => {
      dispatch({ type: 'SET_CURRENT_VIEW', payload: view });
  }, []);

  const toggleTheme = useCallback(() => {
    const newTheme = osState.settings.theme === 'light' ? 'dark' : 'light';
    dispatch({ type: 'UPDATE_SETTINGS', payload: { theme: newTheme } });
  }, [osState.settings.theme]);

  return (
    <OSContext.Provider value={{ osState, dispatch, createAsset, deleteAsset, viewAsset, closeAssetView, setActiveModal, setAIPanelState, setControlCenterOpen, setCurrentView, toggleTheme, triggerInsightGeneration: generateAndCreateInsight, deleteArchivedInsight, restoreArchivedInsight }}>
      {children}
    </OSContext.Provider>
  );
};


// Custom hook to use the context
export const useOS = (): IOSContext => {
  const context = useContext(OSContext);
  if (!context) {
    throw new Error('useOS must be used within an OSProvider');
  }
  return context;
};