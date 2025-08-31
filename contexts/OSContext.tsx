
import React, { createContext, useContext, useReducer, useEffect, useCallback, ReactNode } from 'react';
import { OSState, OSAction, ActiveAssetInstance, ModalType, AIPanelState } from '../types';
import { INITIAL_OS_STATE } from '../constants';
import { geminiService } from '../services/geminiService';
import { themes, applyTheme } from '../styles/themes';
import { storageService } from '../services/storageService';

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
        id: `aa-${Date.now().toString(36)}${Math.random().toString(36).substring(2)}`,
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
        desktopAssetOrder: [...state.desktopAssetOrder, newAsset.id],
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

      const newDesktopAssetOrder = state.desktopAssetOrder.filter(id => id !== assetId);
      
      const newUIState = state.ui.viewingAssetId === assetId 
        ? { ...state.ui, viewingAssetId: null } 
        : state.ui;
        
      return { 
        ...state,
        activeAssets: newActiveAssets,
        desktopAssetOrder: newDesktopAssetOrder,
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
      
      const newDesktopAssetOrder = state.desktopAssetOrder.filter(id => id !== assetId);

      const newInsightHistory = [...state.insightHistory, asset];
      
      return {
        ...state,
        activeAssets: newActiveAssets,
        desktopAssetOrder: newDesktopAssetOrder,
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
            desktopAssetOrder: [...state.desktopAssetOrder, assetId],
            insightHistory: state.insightHistory.filter(a => a.id !== assetId),
        };
    }
    
    case 'UPDATE_ASSET_ORDER': {
        return {
            ...state,
            desktopAssetOrder: action.payload
        };
    }


    case 'IMPORT_STATE': {
        const importedState = action.payload;
        // Merge assets and settings
        const newActiveAssets = { ...state.activeAssets, ...importedState.activeAssets };
        const newSettings = { ...state.settings, ...importedState.settings };
        const newInsightHistory = [...state.insightHistory, ...(importedState.insightHistory || [])];
        
        const existingOrder = new Set(state.desktopAssetOrder);
        const newAssetIds = Object.keys(importedState.activeAssets || {}).filter(id => !existingOrder.has(id));
        const newDesktopAssetOrder = [...state.desktopAssetOrder, ...newAssetIds];
        
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
            desktopAssetOrder: newDesktopAssetOrder,
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
  toggleThemeMode: () => void;
  setTheme: (themeName: string) => void;
  triggerInsightGeneration: () => void;
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
        
        let assetOrder = savedState.desktopAssetOrder;
        // Backwards compatibility: if asset order doesn't exist, create it.
        if (!assetOrder || !Array.isArray(assetOrder)) {
          assetOrder = Object.keys(savedState.activeAssets || {}).sort((a,b) => 
            new Date(savedState.activeAssets[a].createdAt).getTime() - new Date(savedState.activeAssets[b].createdAt).getTime()
          );
        }

        const rehydratedState: OSState = {
          ...INITIAL_OS_STATE,
          settings: { ...INITIAL_OS_STATE.settings, ...(savedState.settings || {}) },
          activeAssets: savedState.activeAssets || {},
          desktopAssetOrder: assetOrder,
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
          desktopAssetOrder: osState.desktopAssetOrder,
          insightHistory: osState.insightHistory,
        };
        localStorage.setItem(OS_STATE_LOCAL_STORAGE_KEY, JSON.stringify(stateToSave));
      } catch (error) {
        console.error("Failed to save state to localStorage:", error);
      }
    }
  }, [osState]);

  useEffect(() => {
    if (osState.isInitialized) {
        const { themeName, themeMode } = osState.settings;
        const themeData = themes[themeName]?.[themeMode] || themes.default[themeMode];
        
        applyTheme(themeData);

        const root = document.documentElement;
        if (themeMode === 'dark') {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
    }
  }, [osState.settings.themeName, osState.settings.themeMode, osState.isInitialized]);
  
  const triggerInsightGeneration = useCallback(() => {
    const { settings, activeAssets } = osState;
    if (!settings.geminiApiKey) {
        console.log("Cannot generate insight without Gemini API key.");
        return;
    }
    // Prevent multiple generations at once
    if (Object.values(activeAssets).some(a => a.state.generationStatus === 'pending' || a.state.generationStatus === 'in-progress')) {
        console.log("An insight is already being generated.");
        return;
    }
    dispatch({
        type: 'CREATE_ASSET',
        payload: {
            agentId: 'agent.system.insight',
            name: '正在生成...',
            initialState: { content: 'AI正在为您准备惊喜...', generationStatus: 'pending' }
        }
    });
  }, [osState, dispatch]);

  // Effect to handle the lifecycle of AI insight generation
  useEffect(() => {
    if (!osState.isInitialized) return;
    
    const pendingAsset = Object.values(osState.activeAssets).find(
        asset => asset.agentId === 'agent.system.insight' && asset.state.generationStatus === 'pending'
    );

    if (pendingAsset && osState.settings.geminiApiKey) {
        // Immediately mark as in-progress to prevent re-triggering
        dispatch({
            type: 'UPDATE_ASSET_STATE',
            payload: {
                assetId: pendingAsset.id,
                newState: { ...pendingAsset.state, generationStatus: 'in-progress' }
            }
        });

        const generate = async () => {
            try {
                const insight = await geminiService.generateInsight(osState, osState.settings.geminiApiKey!);
                if (insight && insight.type !== 'error') {
                    let generated_image_storageKey = null;
                    if (insight.image_prompt) {
                        const generated_image_base64 = await geminiService.generateImage(insight.image_prompt, osState.settings.geminiApiKey!);
                        if (generated_image_base64) {
                            const storageKey = `media-insight-${pendingAsset.id}`;
                            const dataUrl = `data:image/jpeg;base64,${generated_image_base64}`;
                            await storageService.setItem(storageKey, dataUrl);
                            generated_image_storageKey = storageKey;
                        }
                    }
                    dispatch({ 
                        type: 'UPDATE_ASSET_METADATA', 
                        payload: { 
                            assetId: pendingAsset.id, 
                            name: insight.title || '来自AI的灵感'
                        }
                    });
                    dispatch({
                        type: 'UPDATE_ASSET_STATE',
                        payload: {
                            assetId: pendingAsset.id,
                            newState: { ...insight, generated_image_storageKey, generationStatus: 'complete' }
                        }
                    });
                } else {
                    throw new Error(insight?.content || 'AI returned an error.');
                }
            } catch (error) {
                console.error("Insight generation failed:", error);
                dispatch({ type: 'DELETE_ASSET', payload: { assetId: pendingAsset.id } });
            }
        };
        generate();
    }
  }, [osState, dispatch]);

  useEffect(() => {
    if (osState.isInitialized) {
        const hasInsights = Object.values(osState.activeAssets).some(a => a.agentId === 'agent.system.insight');
        const hasArchivedInsights = osState.insightHistory.length > 0;
        if (!hasInsights && !hasArchivedInsights) {
            console.log("Generating initial AI insight on first load...");
            triggerInsightGeneration();
        }
    }
  }, [osState.isInitialized, osState.insightHistory.length, osState.activeAssets, triggerInsightGeneration]);


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

  const toggleThemeMode = useCallback(() => {
    const newThemeMode = osState.settings.themeMode === 'light' ? 'dark' : 'light';
    dispatch({ type: 'UPDATE_SETTINGS', payload: { themeMode: newThemeMode } });
  }, [osState.settings.themeMode]);
  
  const setTheme = useCallback((themeName: string) => {
    if (themes[themeName]) {
        dispatch({ type: 'UPDATE_SETTINGS', payload: { themeName } });
    }
  }, []);

  return (
    <OSContext.Provider value={{ osState, dispatch, createAsset, deleteAsset, viewAsset, closeAssetView, setActiveModal, setAIPanelState, setControlCenterOpen, setCurrentView, toggleThemeMode, setTheme, triggerInsightGeneration, deleteArchivedInsight, restoreArchivedInsight }}>
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