import { OSState, ActiveAssetInstance } from '../types';
import { storageService } from './storageService';

class ASTService {
  /**
   * Processes an imported state object, moving any embedded media data (like base64 images)
   * into IndexedDB and replacing it with a storage key. This is crucial for handling older
   * backup files or shared asset bubbles that contain media directly.
   */
  private async dehydrateStateAfterImport(state: Partial<OSState>): Promise<Partial<OSState>> {
      const processAsset = async (asset: ActiveAssetInstance) => {
            if (asset.agentId === 'agent.system.photos' && asset.state.photos) {
                for (const photo of asset.state.photos) {
                    if (photo.dataUrl) {
                        const storageKey = `photo-${photo.id || Date.now()}-${Math.random()}`;
                        await storageService.setItem(storageKey, photo.dataUrl);
                        photo.storageKey = storageKey;
                        delete photo.dataUrl;
                    }
                }
            } else if (asset.agentId === 'agent.system.media_player' && asset.state.file) {
                const storageKey = `media-${asset.id || Date.now()}-${Math.random()}`;
                await storageService.setItem(storageKey, asset.state.file);
                asset.state.storageKey = storageKey;
                delete asset.state.file;
            } else if (asset.agentId === 'agent.system.insight' && asset.state.generated_image) {
                const storageKey = `media-insight-${asset.id || Date.now()}-${Math.random()}`;
                // Handle both full data URLs and raw base64 strings for backward compatibility
                const dataUrl = asset.state.generated_image.startsWith('data:') 
                    ? asset.state.generated_image
                    : `data:image/jpeg;base64,${asset.state.generated_image}`;
                await storageService.setItem(storageKey, dataUrl);
                asset.state.generated_image_storageKey = storageKey;
                delete asset.state.generated_image;
            }
      };
      
      if (state.activeAssets) {
        for (const assetId in state.activeAssets) {
            await processAsset(state.activeAssets[assetId]);
        }
      }

      if (state.insightHistory) {
          for (const asset of state.insightHistory) {
              await processAsset(asset);
          }
      }

      return state;
  }

  /**
   * Prepares the OS state for export by removing runtime-only data like the UI state
   * and non-serializable agent component/icon functions.
   */
  private cleanupStateForExport(state: OSState): any {
    // Deep clone to avoid mutating the live state
    const stateToSave = JSON.parse(JSON.stringify(state));
    
    delete stateToSave.isInitialized;
    delete stateToSave.ui;

    if (stateToSave.installedAgents) {
        Object.keys(stateToSave.installedAgents).forEach(key => {
            delete stateToSave.installedAgents[key].component;
            delete stateToSave.installedAgents[key].icon;
        });
    }

    return stateToSave;
  }

  /**
   * Exports the entire system state to a compact .ast file.
   * Media is NOT embedded, ensuring the file is small and import is reliable.
   */
  public async exportSystemState(state: OSState) {
    try {
      const exportableState = this.cleanupStateForExport(state);
      
      const stateJson = JSON.stringify(exportableState, null, 2);
      const blob = new Blob([stateJson], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const safeDate = new Date().toISOString().replace(/:/g, '-').replace(/\..+/, '');
      a.download = `serendipity_os_backup_${safeDate}.ast`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to export system state:", error);
      alert("导出系统状态失败！");
    }
  }

  /**
   * Exports a single asset to an .ast_bubble file.
   */
  public async exportAsset(asset: ActiveAssetInstance, agentDefinition: any) {
     try {
      const agentDefToExport = { ...agentDefinition };
      delete agentDefToExport.component;
      delete agentDefToExport.icon;
      
      const exportableAsset = {
        // Clone the asset to ensure we don't modify the live state
        asset: JSON.parse(JSON.stringify(asset)),
        agentDefinition: agentDefToExport,
      };

      const assetJson = JSON.stringify(exportableAsset, null, 2);
      const blob = new Blob([assetJson], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      // Sanitize the asset name to create a valid filename
      const safeAssetName = asset.name.replace(/[^\p{L}\p{N}\s-]/gu, '_').replace(/\s+/g, '-');
      a.download = `${safeAssetName}.ast_bubble`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to export asset:", error);
      alert("导出活动资产失败！");
    }
  }

  /**
   * Imports system state from an .ast or .ast_bubble file.
   */
  public importStateFromFile(file: File): Promise<Partial<OSState>> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const result = event.target?.result;
          if (typeof result === 'string') {
            const importedData = JSON.parse(result);
            
            // Handle full system import
            if (importedData.settings && importedData.activeAssets) {
              const dehydratedState = await this.dehydrateStateAfterImport(importedData as Partial<OSState>);
              resolve(dehydratedState);
            // Handle single asset "bubble" import
            } else if (importedData.asset && importedData.agentDefinition) {
              const newAsset = importedData.asset as ActiveAssetInstance;
              // Assign a new unique ID to prevent conflicts
              const newId = `aa-${Date.now().toString(36)}${Math.random().toString(36).substring(2)}`;
              newAsset.id = newId;

              const singleAssetImport: Partial<OSState> = {
                  installedAgents: { [importedData.agentDefinition.id]: importedData.agentDefinition },
                  activeAssets: { [newId]: newAsset }
              };
              const dehydratedState = await this.dehydrateStateAfterImport(singleAssetImport);
              resolve(dehydratedState);
            }
            else {
              reject(new Error("无效的 .ast 或 .ast_bubble 文件格式。"));
            }
          } else {
            reject(new Error("无法读取文件内容。"));
          }
        } catch (error) {
          reject(new Error(`解析文件失败: ${error instanceof Error ? error.message : String(error)}`));
        }
      };
      reader.onerror = (error) => {
        reject(new Error(`读取文件时出错: ${error}`));
      };
      reader.readAsText(file);
    });
  }
}

export const astService = new ASTService();