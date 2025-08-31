import { OSState, ActiveAssetInstance } from '../types';
import { storageService } from './storageService';

class ASTService {
  private async rehydrateStateForExport(state: any): Promise<any> {
    const rehydratedState = JSON.parse(JSON.stringify(state)); // Deep clone to avoid mutating original state

    for (const assetId in rehydratedState.activeAssets) {
        const asset = rehydratedState.activeAssets[assetId];
        if (asset.agentId === 'agent.system.photos' && asset.state.photos) {
            for (const photo of asset.state.photos) {
                if (photo.storageKey) {
                    photo.dataUrl = await storageService.getItem(photo.storageKey);
                    delete photo.storageKey;
                }
            }
        } else if (asset.agentId === 'agent.system.media_player' && asset.state.storageKey) {
            asset.state.file = await storageService.getItem(asset.state.storageKey);
            delete asset.state.storageKey;
        }
    }
    
    // Also rehydrate insight history
    if (rehydratedState.insightHistory) {
        for (const asset of rehydratedState.insightHistory) {
             if (asset.agentId === 'agent.system.insight' && asset.state.generated_image_storageKey) {
                asset.state.generated_image = await storageService.getItem(asset.state.generated_image_storageKey);
                delete asset.state.generated_image_storageKey;
            }
        }
    }

    return rehydratedState;
  }

  private async dehydrateStateAfterImport(state: Partial<OSState>): Promise<Partial<OSState>> {
      if (state.activeAssets) {
        for (const assetId in state.activeAssets) {
            const asset = state.activeAssets[assetId];
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
            }
        }
      }
      return state;
  }

  private cleanupStateForExport(state: OSState): any {
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

  public async exportSystemState(state: OSState) {
    try {
      const cleanState = this.cleanupStateForExport(state);
      const exportableState = await this.rehydrateStateForExport(cleanState);
      
      const stateJson = JSON.stringify(exportableState, null, 2);
      const blob = new Blob([stateJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `serendipity_os_backup_${new Date().toISOString()}.ast`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to export system state:", error);
      alert("导出系统状态失败！");
    }
  }

  public async exportAsset(asset: ActiveAssetInstance, agentDefinition: any) {
     try {
      const agentDefToExport = { ...agentDefinition };
      delete agentDefToExport.component;
      delete agentDefToExport.icon;
      
      const rehydratedState = await this.rehydrateStateForExport({ activeAssets: { [asset.id]: asset } });

      const exportableAsset = {
        asset: rehydratedState.activeAssets[asset.id],
        agentDefinition: agentDefToExport,
      };

      const assetJson = JSON.stringify(exportableAsset, null, 2);
      const blob = new Blob([assetJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${asset.name}.ast_bubble`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to export asset:", error);
      alert("导出活动资产失败！");
    }
  }


  public importStateFromFile(file: File): Promise<Partial<OSState>> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const result = event.target?.result;
          if (typeof result === 'string') {
            const importedData = JSON.parse(result);
            
            if (importedData.settings && importedData.activeAssets) {
              const dehydratedState = await this.dehydrateStateAfterImport(importedData as Partial<OSState>);
              resolve(dehydratedState);
            } else if (importedData.asset && importedData.agentDefinition) {
              const newAsset = importedData.asset as ActiveAssetInstance;
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