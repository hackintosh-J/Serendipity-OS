

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

    case 'SET_AI_BUSY':
        return { ...state, ui: { ...state.ui, isAIBusy: action.payload } };
    
    case 'SET_INSIGHT_STATUS':
        return { ...state, ui: { ...state.ui, insightGenerationStatus: action.payload.status, insightGenerationMessage: action.payload.message } };


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
  isAIBusy: boolean;
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
  
  const triggerInsightGeneration = useCallback(async () => {
    if (osState.ui.isAIBusy || !geminiService.isConfigured(osState.settings.geminiApiKey)) {
      console.log("Cannot generate insight: AI is busy or API key is missing.");
      return;
    }

    dispatch({ type: 'SET_AI_BUSY', payload: true });
    dispatch({ type: 'SET_INSIGHT_STATUS', payload: { status: 'generating', message: 'AI 正在为您生成洞察...' } });

    try {
      const insight = await geminiService.generateInsight(osState, osState.settings.geminiApiKey!);
      if (insight && insight.type !== 'error') {
        let generated_image_storageKey = null;
        if (insight.image_prompt) {
          const generated_image_base64 = await geminiService.generateImage(insight.image_prompt, osState.settings.geminiApiKey!);
          if (generated_image_base64) {
            const tempId = `insight-${Date.now()}`;
            const storageKey = `media-${tempId}`;
            const dataUrl = `data:image/jpeg;base64,${generated_image_base64}`;
            await storageService.setItem(storageKey, dataUrl);
            generated_image_storageKey = storageKey;
          }
        }
        dispatch({
          type: 'CREATE_ASSET',
          payload: {
            agentId: 'agent.system.insight',
            name: insight.title || '来自AI的灵感',
            initialState: { ...insight, generated_image_storageKey, generationStatus: 'complete' }
          }
        });
      } else {
        throw new Error(insight?.content || 'AI returned an error.');
      }
    } catch (error) {
      console.error("Insight generation failed:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      dispatch({ type: 'SET_INSIGHT_STATUS', payload: { status: 'error', message: `洞察生成失败: ${errorMessage}` } });
      setTimeout(() => {
        dispatch({ type: 'SET_INSIGHT_STATUS', payload: { status: 'idle', message: null } });
      }, 5000);
    } finally {
      dispatch({ type: 'SET_AI_BUSY', payload: false });
       if (osState.ui.insightGenerationStatus !== 'error') {
          dispatch({ type: 'SET_INSIGHT_STATUS', payload: { status: 'idle', message: null } });
      }
    }
  }, [osState, dispatch]);

  const autoOrganizeDesktop = useCallback(async () => {
    if (osState.ui.isAIBusy || !osState.isInitialized) return;
    
    const { settings } = osState;
    if (!geminiService.isConfigured(settings.geminiApiKey)) {
      console.log("Auto-organize skipped: Gemini API key not configured.");
      return;
    }

    dispatch({ type: 'SET_AI_BUSY', payload: true });
    dispatch({ type: 'SET_INSIGHT_STATUS', payload: { status: 'generating', message: 'AI 正在整理桌面...' } });
    console.log("Attempting to auto-organize desktop...");

    try {
      const stream = geminiService.generateActionStream("请根据资产尺寸和类型，智能地整理我的桌面布局。", osState, settings.geminiApiKey);

      for await (const event of stream) {
        if (event.type === 'result') {
          let actions = [];
          if (event.content.actions) {
            actions = event.content.actions;
          } else if (event.content.action) {
            actions = [event.content];
          }

          for (const actionItem of actions) {
            const { action, payload } = actionItem;
            if (action === 'UPDATE_ASSET_ORDER') {
              if (payload.order && Array.isArray(payload.order)) {
                const currentIds = new Set(Object.keys(osState.activeAssets));
                const newIds = new Set(payload.order);
                if (currentIds.size === newIds.size && [...currentIds].every(id => newIds.has(id as string))) {
                  if (JSON.stringify(osState.desktopAssetOrder) !== JSON.stringify(payload.order)) {
                    console.log("Auto-organizing desktop with new order:", payload.order);
                    dispatch({ type: 'UPDATE_ASSET_ORDER', payload: payload.order });
                  } else {
                    console.log("Auto-organize: New order is same as current, no changes made.");
                  }
                } else {
                  console.warn("Auto-organize: AI returned an invalid asset order.", { current: [...currentIds], returned: payload.order });
                }
              }
              return; // We only care about this one action.
            }
          }
        } else if (event.type === 'error') {
          console.error("Auto-organize failed with AI error:", event.content);
           dispatch({ type: 'SET_INSIGHT_STATUS', payload: { status: 'error', message: `桌面整理失败: ${event.content}` } });
          return;
        }
      }
    } catch (error) {
        console.error("Auto-organize failed with system error:", error);
        dispatch({ type: 'SET_INSIGHT_STATUS', payload: { status: 'error', message: '桌面整理失败' } });
    } finally {
        dispatch({ type: 'SET_AI_BUSY', payload: false });
        // Only set to idle if it wasn't an error, which has its own timeout
        if(osState.ui.insightGenerationStatus !== 'error') {
            dispatch({ type: 'SET_INSIGHT_STATUS', payload: { status: 'idle', message: null } });
        }
    }
  }, [osState, dispatch]);


  // Effect to run startup tasks sequentially and only ONCE.
  useEffect(() => {
    if (!osState.isInitialized) return;

    const runStartupTasks = async () => {
        console.log("Running startup AI tasks...");

        // 1. Generate initial insight if none exists.
        // This check uses the state at the time the effect runs, which is correct for a one-time operation.
        const hasInsights = Object.values(osState.activeAssets).some(a => a.agentId === 'agent.system.insight');
        const hasArchivedInsights = osState.insightHistory.length > 0;
        if (!hasInsights && !hasArchivedInsights) {
            // We await this to ensure it completes before the next step.
            await triggerInsightGeneration();
        }

        // 2. Auto-organize desktop.
        // This runs after insight generation. There's a known minor issue where the state from
        // insight creation might not be immediately available, causing a validation warning.
        // This is an acceptable trade-off to prevent repeated runs and system hangs.
        await autoOrganizeDesktop();
    };

    // Run after a short delay to ensure UI is responsive first.
    // This is the one and only time these tasks will be triggered automatically.
    const timeoutId = window.setTimeout(runStartupTasks, 1000);
    
    return () => window.clearTimeout(timeoutId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [osState.isInitialized]); // IMPORTANT: This effect should ONLY run once when the OS is initialized.


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
    <OSContext.Provider value={{ osState, dispatch, createAsset, deleteAsset, viewAsset, closeAssetView, setActiveModal, setAIPanelState, setControlCenterOpen, setCurrentView, toggleThemeMode, setTheme, triggerInsightGeneration, deleteArchivedInsight, restoreArchivedInsight, isAIBusy: osState.ui.isAIBusy }}>
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
